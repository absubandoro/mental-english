import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches';
import { CalendarModule } from './calendar/calendar';
import { EnrollmentsModule } from './enrollments/enrollments';
import { ReportsModule } from './reports/reports';
import { ClassesModule } from './classes/classes';
import { MadingModule } from './mading/mading';
import { NotificationsModule } from './notifications/notifications';
import { ParentModule } from './parent/parent';
import { PaymentsModule } from './payments/payments';
import { PostsModule } from './posts/posts';
import { SessionsModule } from './sessions/sessions';
import { StatsModule } from './stats/stats';
import { UPLOAD_DIR, UploadsModule } from './uploads/uploads';
import { UsersModule } from './users/users';
import { OrganizationsModule } from './organizations/organizations';
import { PlatformModule } from './platform/platform';
import { TenantMiddleware, TenantModule } from './common/tenant';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        ...dataSourceOptions,
        url: c.get<string>('DATABASE_URL'),
        synchronize: c.get<string>('DB_SYNC') === 'true',
        // Production: jalankan migrasi yang belum diterapkan setiap kali API start
        migrationsRun: c.get<string>('DB_SYNC') !== 'true',
      }),
    }),
    ServeStaticModule.forRoot({ rootPath: UPLOAD_DIR, serveRoot: '/uploads' }),
    TenantModule,
    OrganizationsModule,
    PlatformModule,
    AuthModule,
    BranchesModule,
    UsersModule,
    PostsModule,
    MadingModule,
    ClassesModule,
    SessionsModule,
    PaymentsModule,
    NotificationsModule,
    ParentModule,
    UploadsModule,
    StatsModule,
    CalendarModule,
    ReportsModule,
    EnrollmentsModule,
  ],
})
export class AppModule implements NestModule {
  /** Setiap request: tentukan organisasi (lembaga) dari domain yang dibuka */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('{*path}');
  }
}
