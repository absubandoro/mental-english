import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { In, Repository } from 'typeorm';
import { ClassRoom, Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, requireBranch, scopeBranch } from '../common/auth';
import { clean } from '../common/util';

export class ClassDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() schedule?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) studentIds?: string[];
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) teacherIds?: string[];
}

const SAFE = (u: User) => ({ id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, level: u.level });

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassRoom) private repo: Repository<ClassRoom>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  private present(c: ClassRoom, viewerId?: string) {
    return {
      ...c,
      students: (c.students ?? []).map(SAFE),
      teachers: (c.teachers ?? []).map(SAFE),
      assignedToMe: viewerId ? (c.teachers ?? []).some((t) => t.id === viewerId) : undefined,
    };
  }

  async list(actor: AuthUser, q: { branchId?: string; q?: string; mine?: string }) {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.students', 's')
      .leftJoinAndSelect('c.teachers', 't')
      .leftJoinAndSelect('c.branch', 'b')
      .orderBy('c.name', 'ASC');
    const branchId = scopeBranch(actor, q.branchId);
    if (branchId) qb.andWhere('c.branchId = :branchId', { branchId });
    if (q.q) qb.andWhere('c.name ILIKE :q', { q: `%${q.q}%` });
    let list = await qb.getMany();
    if (q.mine === 'true') list = list.filter((c) => c.teachers.some((t) => t.id === actor.id));
    return list.map((c) => this.present(c, actor.id));
  }

  async entity(actor: AuthUser, id: string) {
    const c = await this.repo.findOne({ where: { id }, relations: { students: true, teachers: true, branch: true } });
    if (!c) throw new NotFoundException('Kelas tidak ditemukan');
    assertBranch(actor, c.branchId);
    return c;
  }

  async get(actor: AuthUser, id: string) {
    return this.present(await this.entity(actor, id), actor.id);
  }

  private async members(ids: string[] | undefined, role: Role, branchId: string) {
    if (!ids) return undefined;
    if (ids.length === 0) return [];
    const found = await this.users.find({ where: { id: In(ids), role, branchId } });
    if (found.length !== new Set(ids).size) {
      throw new BadRequestException(`Sebagian ${role === Role.STUDENT ? 'pelajar' : 'pengajar'} tidak valid / beda cabang`);
    }
    return found;
  }

  async create(actor: AuthUser, dto: ClassDto) {
    const branchId = requireBranch(actor, dto.branchId);
    const { studentIds, teacherIds, ...rest } = dto;
    const c = this.repo.create({
      ...rest,
      branchId,
      students: (await this.members(studentIds, Role.STUDENT, branchId)) ?? [],
      teachers: (await this.members(teacherIds, Role.TEACHER, branchId)) ?? [],
    });
    const saved = await this.repo.save(c);
    return this.get(actor, saved.id);
  }

  async update(actor: AuthUser, id: string, dto: Partial<ClassDto>) {
    const c = await this.entity(actor, id);
    const { studentIds, teacherIds, branchId: _b, ...rest } = dto;
    Object.assign(c, clean(rest));
    const students = await this.members(studentIds, Role.STUDENT, c.branchId);
    const teachers = await this.members(teacherIds, Role.TEACHER, c.branchId);
    if (students) c.students = students;
    if (teachers) c.teachers = teachers;
    await this.repo.save(c);
    return this.get(actor, id);
  }

  async remove(actor: AuthUser, id: string) {
    await this.entity(actor, id);
    await this.repo.delete(id);
    return { ok: true };
  }

  /** Pengajar memilih kelas yang diajar (assign / unassign diri sendiri) */
  async setTeaching(actor: AuthUser, id: string, assign: boolean) {
    const c = await this.entity(actor, id);
    const already = c.teachers.some((t) => t.id === actor.id);
    if (assign && !already) {
      const me = await this.users.findOneByOrFail({ id: actor.id });
      c.teachers.push(me);
    } else if (!assign) {
      c.teachers = c.teachers.filter((t) => t.id !== actor.id);
    }
    await this.repo.save(c);
    return this.get(actor, id);
  }
}

@Controller('admin/classes')
@Auth(...ADMIN_ROLES)
export class AdminClassesController {
  constructor(private svc: ClassesService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: { branchId?: string; q?: string }) {
    return this.svc.list(u, q);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: ClassDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ClassDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Controller('teacher/classes')
@Auth(Role.TEACHER)
export class TeacherClassesController {
  constructor(private svc: ClassesService) {}
  /** Semua kelas di cabang pengajar; ?mine=true untuk kelas yang diajar */
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: { q?: string; mine?: string }) {
    return this.svc.list(u, q);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
  @Post(':id/assign') assign(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.setTeaching(u, id, true);
  }
  @Delete(':id/assign') unassign(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.setTeaching(u, id, false);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ClassRoom, User])],
  controllers: [AdminClassesController, TeacherClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
