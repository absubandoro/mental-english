import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1794236350629 implements MigrationInterface {
    name = 'InitialSchema1794236350629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "branches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "address" text, "city" character varying, "phone" character varying, "openHours" character varying, "mapQuery" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c2c16397fa98d34f8db37684c41" UNIQUE ("slug"), CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "phone" character varying, "address" text, "birthDate" date, "school" character varying, "level" character varying, "avatarUrl" character varying, "bio" text, "isActive" boolean NOT NULL DEFAULT true, "branchId" uuid, "parentId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "schedule" character varying, "level" character varying, "branchId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."class_sessions_type_enum" AS ENUM('BELAJAR', 'UJIAN', 'OUTDOOR')`);
        await queryRunner.query(`CREATE TABLE "class_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "type" "public"."class_sessions_type_enum" NOT NULL DEFAULT 'BELAJAR', "topic" character varying NOT NULL, "report" text, "classId" uuid NOT NULL, "teacherId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dc034da48c6e0cf95c51f606c4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendances_status_enum" AS ENUM('HADIR', 'IZIN', 'SAKIT', 'ALPA')`);
        await queryRunner.query(`CREATE TABLE "attendances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."attendances_status_enum" NOT NULL DEFAULT 'HADIR', "note" text, "sessionId" uuid NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "UQ_7c4623087030d1ba925ad1eef44" UNIQUE ("sessionId", "studentId"), CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exam_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "score" numeric(5,2), "grade" character varying, "note" text, "sessionId" uuid NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "UQ_1f12225b5be54f544a495606f6a" UNIQUE ("sessionId", "studentId"), CONSTRAINT "PK_07d4ea139ed7ca111c75df2de12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mading" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "content" text NOT NULL, "imageUrl" character varying, "category" character varying NOT NULL DEFAULT 'Karya', "published" boolean NOT NULL DEFAULT true, "branchId" uuid NOT NULL, "authorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ff721d28a994ccb2f059a19d5e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dc97a4f5fddc43011357c114ed" ON "mading" ("title") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_target_enum" AS ENUM('BRANCH_PARENTS', 'CLASS_PARENTS', 'USERS')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "body" text NOT NULL, "target" "public"."notifications_target_enum" NOT NULL, "branchId" uuid, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_recipients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "notificationId" uuid NOT NULL, "userId" uuid NOT NULL, "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_53cfd1bfedccc676fd6d74137bb" UNIQUE ("notificationId", "userId"), CONSTRAINT "PK_bd5b25c456987261a38c762b223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('BELUM_BAYAR', 'MENUNGGU', 'LUNAS')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "period" character varying NOT NULL, "description" character varying NOT NULL, "amount" integer NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'BELUM_BAYAR', "dueDate" date, "paidAt" TIMESTAMP WITH TIME ZONE, "method" character varying, "note" text, "studentId" uuid NOT NULL, "branchId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."posts_type_enum" AS ENUM('BLOG', 'VLOG')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."posts_type_enum" NOT NULL DEFAULT 'BLOG', "title" character varying NOT NULL, "slug" character varying NOT NULL, "excerpt" text, "content" text NOT NULL, "coverUrl" character varying, "videoUrl" character varying, "published" boolean NOT NULL DEFAULT true, "branchId" uuid NOT NULL, "authorId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d82eb2bb2ddd7a6bfac8804d8" ON "posts" ("title") `);
        await queryRunner.query(`CREATE TABLE "class_students" ("classId" uuid NOT NULL, "studentId" uuid NOT NULL, CONSTRAINT "PK_800605a0412a8d21a45a7ca32fc" PRIMARY KEY ("classId", "studentId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8077e3550bf215749c0cdd138c" ON "class_students" ("classId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e9a9986dd87d6448440f84014" ON "class_students" ("studentId") `);
        await queryRunner.query(`CREATE TABLE "class_teachers" ("classId" uuid NOT NULL, "teacherId" uuid NOT NULL, CONSTRAINT "PK_b82f1d6f03f39d87106df92b734" PRIMARY KEY ("classId", "teacherId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ec9a523c3c379160292fde41a5" ON "class_teachers" ("classId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c66d30333f9a8b8632294155d6" ON "class_teachers" ("teacherId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_246426dfd001466a1d5e47322f4" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8110309ac51ed55a91d28625b88" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_b86680d8cd61fa2ec418965e499" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_a25b83aafc81c493286637c6bb8" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_65621dccf831fc3765dfeeae25d" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendances" ADD CONSTRAINT "FK_615b414059091a9a8ea0355ae89" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_results" ADD CONSTRAINT "FK_541e300443ce80e4e43e54b78dc" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_results" ADD CONSTRAINT "FK_033e5c68fb99745a58e82f7abdf" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mading" ADD CONSTRAINT "FK_0d317dee134902f2c4bfdc4e90b" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mading" ADD CONSTRAINT "FK_d0d2fcf66ce7d99e41246c2f5b9" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_623e1a9554c2f381a22aff0a04e" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_fcce8c50a375466676d82dcbadd" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_recipients" ADD CONSTRAINT "FK_452385a8220b8053ab65317ffa6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2731e10aef7f886a08c552290e" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_827d04dd3e917e88271d43e664b" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_74f79ac69733d568e825b9086b5" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_8077e3550bf215749c0cdd138c2" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_4e9a9986dd87d6448440f840144" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_teachers" ADD CONSTRAINT "FK_ec9a523c3c379160292fde41a59" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "class_teachers" ADD CONSTRAINT "FK_c66d30333f9a8b8632294155d6d" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_teachers" DROP CONSTRAINT "FK_c66d30333f9a8b8632294155d6d"`);
        await queryRunner.query(`ALTER TABLE "class_teachers" DROP CONSTRAINT "FK_ec9a523c3c379160292fde41a59"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_4e9a9986dd87d6448440f840144"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_8077e3550bf215749c0cdd138c2"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_74f79ac69733d568e825b9086b5"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_827d04dd3e917e88271d43e664b"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2731e10aef7f886a08c552290e"`);
        await queryRunner.query(`ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_452385a8220b8053ab65317ffa6"`);
        await queryRunner.query(`ALTER TABLE "notification_recipients" DROP CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_fcce8c50a375466676d82dcbadd"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_623e1a9554c2f381a22aff0a04e"`);
        await queryRunner.query(`ALTER TABLE "mading" DROP CONSTRAINT "FK_d0d2fcf66ce7d99e41246c2f5b9"`);
        await queryRunner.query(`ALTER TABLE "mading" DROP CONSTRAINT "FK_0d317dee134902f2c4bfdc4e90b"`);
        await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT "FK_033e5c68fb99745a58e82f7abdf"`);
        await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT "FK_541e300443ce80e4e43e54b78dc"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_615b414059091a9a8ea0355ae89"`);
        await queryRunner.query(`ALTER TABLE "attendances" DROP CONSTRAINT "FK_d5140a0a7ab7511a8d326eef004"`);
        await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_65621dccf831fc3765dfeeae25d"`);
        await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_a25b83aafc81c493286637c6bb8"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_b86680d8cd61fa2ec418965e499"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8110309ac51ed55a91d28625b88"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_246426dfd001466a1d5e47322f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c66d30333f9a8b8632294155d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec9a523c3c379160292fde41a5"`);
        await queryRunner.query(`DROP TABLE "class_teachers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e9a9986dd87d6448440f84014"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8077e3550bf215749c0cdd138c"`);
        await queryRunner.query(`DROP TABLE "class_students"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d82eb2bb2ddd7a6bfac8804d8"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_type_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "notification_recipients"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_target_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc97a4f5fddc43011357c114ed"`);
        await queryRunner.query(`DROP TABLE "mading"`);
        await queryRunner.query(`DROP TABLE "exam_results"`);
        await queryRunner.query(`DROP TABLE "attendances"`);
        await queryRunner.query(`DROP TYPE "public"."attendances_status_enum"`);
        await queryRunner.query(`DROP TABLE "class_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."class_sessions_type_enum"`);
        await queryRunner.query(`DROP TABLE "classes"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "branches"`);
    }

}
