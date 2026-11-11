import { MigrationInterface, QueryRunner } from "typeorm";

export class TagihanLangganan1794435937342 implements MigrationInterface {
    name = 'TagihanLangganan1794435937342'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."platform_invoices_status_enum" AS ENUM('BELUM_BAYAR', 'MENUNGGU', 'LUNAS', 'BATAL')`);
        await queryRunner.query(`CREATE TABLE "platform_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" character varying NOT NULL, "organizationId" uuid NOT NULL, "period" character varying(7) NOT NULL, "issueDate" date NOT NULL, "dueDate" date NOT NULL, "items" jsonb NOT NULL DEFAULT '[]', "amount" integer NOT NULL, "status" "public"."platform_invoices_status_enum" NOT NULL DEFAULT 'BELUM_BAYAR', "proofUrl" character varying, "proofNote" text, "proofUploadedAt" TIMESTAMP WITH TIME ZONE, "paidAt" TIMESTAMP WITH TIME ZONE, "verifiedById" uuid, "rejectReason" text, "note" text, "remindedDueSoonAt" TIMESTAMP WITH TIME ZONE, "remindedOverdueAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2d93dae806a0c224080f450d846" UNIQUE ("number"), CONSTRAINT "PK_95e46be4905c268e772197f627d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_invoice_org_period" ON "platform_invoices" ("organizationId", "period") `);
        await queryRunner.query(`CREATE TABLE "platform_settings" ("key" character varying NOT NULL, "value" jsonb NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d9031e30fac3ec3ec8b9602e17" PRIMARY KEY ("key"))`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "subscriptionEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "planName" character varying`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "baseFee" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "perStudentFee" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "dueDay" smallint NOT NULL DEFAULT '10'`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "invoiceLeadDays" smallint NOT NULL DEFAULT '7'`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "subscriptionStart" character varying(7)`);
        await queryRunner.query(`ALTER TABLE "platform_invoices" ADD CONSTRAINT "FK_fc30af416c2d88907514a7fdacd" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_invoices" DROP CONSTRAINT "FK_fc30af416c2d88907514a7fdacd"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscriptionStart"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "invoiceLeadDays"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "dueDay"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "perStudentFee"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "baseFee"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "planName"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscriptionEnabled"`);
        await queryRunner.query(`DROP TABLE "platform_settings"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_invoice_org_period"`);
        await queryRunner.query(`DROP TABLE "platform_invoices"`);
        await queryRunner.query(`DROP TYPE "public"."platform_invoices_status_enum"`);
    }

}
