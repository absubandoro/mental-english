import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'postgres',
        url: c.get<string>('DATABASE_URL'),
        entities: ENTITIES,
        synchronize: c.get<string>('DB_SYNC') === 'true',
      }),
    }),
    ServeStaticModule.forRoot({ rootPath: UPLOAD_DIR, serveRoot: '/uploads' }),
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
  ],
})
export class AppModule {}
