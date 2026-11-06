import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Branch, Role } from '../entities';
import { Auth } from '../common/auth';
import { clean, slugify } from '../common/util';

export class BranchDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() openHours?: string;
  @IsOptional() @IsString() mapQuery?: string;
}

@Injectable()
export class BranchesService {
  constructor(@InjectRepository(Branch) private repo: Repository<Branch>) {}

  list() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async get(id: string) {
    const b = await this.repo.findOneBy({ id });
    if (!b) throw new NotFoundException('Cabang tidak ditemukan');
    return b;
  }

  create(dto: BranchDto) {
    return this.repo.save(this.repo.create({ ...dto, slug: slugify(dto.name) }));
  }

  async update(id: string, dto: Partial<BranchDto>) {
    await this.get(id);
    await this.repo.update(id, { ...clean(dto), ...(dto.name ? { slug: slugify(dto.name) } : {}) });
    return this.get(id);
  }

  async remove(id: string) {
    await this.repo.delete(await this.get(id).then((b) => b.id));
    return { ok: true };
  }
}

@Controller('branches')
export class BranchesController {
  constructor(private svc: BranchesService) {}

  @Get() list() {
    return this.svc.list();
  }

  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(id);
  }

  @Post() @Auth(Role.SUPER_ADMIN) create(@Body() dto: BranchDto) {
    return this.svc.create(dto);
  }

  @Patch(':id') @Auth(Role.SUPER_ADMIN) update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BranchDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id') @Auth(Role.SUPER_ADMIN) remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
