import { MigrationInterface, QueryRunner } from "typeorm";

export class PermintaanDemo1794435354989 implements MigrationInterface {
    name = 'PermintaanDemo1794435354989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."platform_leads_status_enum" AS ENUM('BARU', 'DIHUBUNGI', 'JADI_KLIEN', 'TIDAK_LANJUT')`);
        await queryRunner.query(`CREATE TABLE "platform_leads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "institution" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying, "city" character varying, "size" character varying, "message" text, "status" "public"."platform_leads_status_enum" NOT NULL DEFAULT 'BARU', "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fae3c40da94db9317fc914d4342" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "platform_leads"`);
        await queryRunner.query(`DROP TYPE "public"."platform_leads_status_enum"`);
    }

}
