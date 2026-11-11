import { MigrationInterface, QueryRunner } from "typeorm";

export class PanelPlatform1794434726293 implements MigrationInterface {
    name = 'PanelPlatform1794434726293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "platform_admins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7ddfa7abfaf477f671ccc566c83" UNIQUE ("email"), CONSTRAINT "PK_faecb3398d1962507b44c76e4f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "notes"`);
        await queryRunner.query(`DROP TABLE "platform_admins"`);
    }

}
