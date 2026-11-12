import { MigrationInterface, QueryRunner } from "typeorm";

export class SiklusTahunan1794444178304 implements MigrationInterface {
    name = 'SiklusTahunan1794444178304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" ADD "billingCycle" character varying(10) NOT NULL DEFAULT 'MONTHLY'`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "dueMonth" smallint NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "dueMonth"`);
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "billingCycle"`);
    }

}
