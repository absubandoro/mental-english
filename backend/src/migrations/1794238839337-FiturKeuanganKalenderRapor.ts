import { MigrationInterface, QueryRunner } from "typeorm";

export class FiturKeuanganKalenderRapor1794238839337 implements MigrationInterface {
    name = 'FiturKeuanganKalenderRapor1794238839337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "class_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayOfWeek" smallint NOT NULL, "startTime" character varying(5) NOT NULL, "endTime" character varying(5) NOT NULL, "room" character varying, "classId" uuid NOT NULL, CONSTRAINT "PK_2300f700f17303f84f7f4df153b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."calendar_events_type_enum" AS ENUM('LIBUR', 'ACARA', 'UJIAN', 'LAINNYA')`);
        await queryRunner.query(`CREATE TABLE "calendar_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "type" "public"."calendar_events_type_enum" NOT NULL DEFAULT 'ACARA', "startDate" date NOT NULL, "endDate" date NOT NULL, "startTime" character varying(5), "endTime" character varying(5), "branchId" uuid NOT NULL, "classId" uuid, "createdById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_faf5391d232322a87cdd1c6f30c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."enrollments_status_enum" AS ENUM('BARU', 'DIHUBUNGI', 'DITERIMA', 'DITOLAK')`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentName" character varying NOT NULL, "studentBirthDate" date, "studentSchool" character varying, "program" character varying, "studentEmail" character varying, "parentName" character varying NOT NULL, "parentPhone" character varying NOT NULL, "parentEmail" character varying NOT NULL, "passwordHash" character varying NOT NULL, "notes" text, "status" "public"."enrollments_status_enum" NOT NULL DEFAULT 'BARU', "adminNote" text, "branchId" uuid NOT NULL, "studentId" uuid, "parentId" uuid, "handledById" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."progress_reports_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`);
        await queryRunner.query(`CREATE TABLE "progress_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "skills" jsonb NOT NULL DEFAULT '[]', "overallGrade" character varying, "teacherComment" text, "recommendation" text, "attendanceSummary" jsonb, "examSummary" jsonb, "media" jsonb NOT NULL DEFAULT '[]', "status" "public"."progress_reports_status_enum" NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP WITH TIME ZONE, "studentId" uuid NOT NULL, "classId" uuid, "branchId" uuid NOT NULL, "authorId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_175179020a43d5ec75ab1d6a04f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "billingEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "billingDay" smallint NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "billingAmount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "billingDescription" character varying NOT NULL DEFAULT 'SPP Bulanan'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "billingDueDays" smallint NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "bankAccounts" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "branches" ADD "paymentInstructions" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "monthlyFee" integer`);
        await queryRunner.query(`ALTER TABLE "class_sessions" ADD "media" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "mading" ADD "media" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`CREATE TYPE "public"."payments_source_enum" AS ENUM('MANUAL', 'AUTO')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "source" "public"."payments_source_enum" NOT NULL DEFAULT 'MANUAL'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "proofUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "proofNote" text`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "proofUploadedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "rejectionReason" text`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "verifiedById" uuid`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "remindedDueSoon" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "remindedOverdue" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "media" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'FINANCE')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payment_auto_period" ON "payments" ("studentId", "period") WHERE "source" = 'AUTO'`);
        await queryRunner.query(`ALTER TABLE "class_schedules" ADD CONSTRAINT "FK_f128816d75ea74b7df510a82bd2" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_9844382d99f06637b3709f37e75" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_6490ca470e3aabb38d170d77c99" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_events" ADD CONSTRAINT "FK_6ad6ef11e78d4127be50a9268cb" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_43fe7599377eb8895eec5791f12" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_f37157c3f17ccb242e8268cc97a" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_607ff6f8d02c46836737e1b1a47" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "progress_reports" ADD CONSTRAINT "FK_4b1eb5eebebea25362f892353ee" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "progress_reports" ADD CONSTRAINT "FK_f0120b1dbf6e25de6070b6ba5ce" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "progress_reports" ADD CONSTRAINT "FK_e0d09481f802325ff733a22172d" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "progress_reports" ADD CONSTRAINT "FK_8295aaa1dfb98e4a244ecab2794" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "progress_reports" DROP CONSTRAINT "FK_8295aaa1dfb98e4a244ecab2794"`);
        await queryRunner.query(`ALTER TABLE "progress_reports" DROP CONSTRAINT "FK_e0d09481f802325ff733a22172d"`);
        await queryRunner.query(`ALTER TABLE "progress_reports" DROP CONSTRAINT "FK_f0120b1dbf6e25de6070b6ba5ce"`);
        await queryRunner.query(`ALTER TABLE "progress_reports" DROP CONSTRAINT "FK_4b1eb5eebebea25362f892353ee"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_607ff6f8d02c46836737e1b1a47"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_f37157c3f17ccb242e8268cc97a"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_bf3ba3dfa95e2df7388eb4589fd"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_43fe7599377eb8895eec5791f12"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_6ad6ef11e78d4127be50a9268cb"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_6490ca470e3aabb38d170d77c99"`);
        await queryRunner.query(`ALTER TABLE "calendar_events" DROP CONSTRAINT "FK_9844382d99f06637b3709f37e75"`);
        await queryRunner.query(`ALTER TABLE "class_schedules" DROP CONSTRAINT "FK_f128816d75ea74b7df510a82bd2"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_payment_auto_period"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "media"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "remindedOverdue"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "remindedDueSoon"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "verifiedAt"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "verifiedById"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "rejectionReason"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "proofUploadedAt"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "proofNote"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "proofUrl"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "source"`);
        await queryRunner.query(`DROP TYPE "public"."payments_source_enum"`);
        await queryRunner.query(`ALTER TABLE "mading" DROP COLUMN "media"`);
        await queryRunner.query(`ALTER TABLE "class_sessions" DROP COLUMN "media"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "monthlyFee"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "paymentInstructions"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "bankAccounts"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "billingDueDays"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "billingDescription"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "billingAmount"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "billingDay"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "billingEnabled"`);
        await queryRunner.query(`DROP TABLE "progress_reports"`);
        await queryRunner.query(`DROP TYPE "public"."progress_reports_status_enum"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
        await queryRunner.query(`DROP TABLE "calendar_events"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_events_type_enum"`);
        await queryRunner.query(`DROP TABLE "class_schedules"`);
    }

}
