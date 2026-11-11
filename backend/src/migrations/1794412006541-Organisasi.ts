import { MigrationInterface, QueryRunner } from "typeorm";

export class Organisasi1794412006541 implements MigrationInterface {
    name = 'Organisasi1794412006541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "tagline" character varying, "description" text, "logoUrl" character varying, "brandColor" character varying NOT NULL DEFAULT '#3d8ccf', "photos" jsonb NOT NULL DEFAULT '{}', "whatsapp" character varying, "email" character varying, "instagram" character varying, "website" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organization_domains" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "domain" character varying NOT NULL, "organizationId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a8ab82513ff727b9fae7e5b7ece" UNIQUE ("domain"), CONSTRAINT "PK_66c1149e9a4faf8d657161b263f" PRIMARY KEY ("id"))`);
        // Mental English menjadi organisasi pertama; seluruh data lama dipindahkan ke sana
        await queryRunner.query(
            `INSERT INTO "organizations" ("slug", "name", "tagline", "description", "logoUrl", "brandColor", "photos", "email") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                'mental-english',
                'Mental English',
                'Build Your Mental Focus!',
                'Kursus bahasa Inggris yang melatih keberanian berbicara, fokus, dan kepercayaan diri. Orang tua dapat memantau absensi, hasil ujian, dan pembayaran anak secara langsung.',
                '/logo.png',
                '#3d8ccf',
                JSON.stringify({ welcome: '/landing/welcome.jpg', holiday: '/landing/holiday.jpg', team: '/landing/team.jpg' }),
                'info@mentalenglish.id',
            ],
        );
        await queryRunner.query(`ALTER TABLE "branches" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`);
        await queryRunner.query(`UPDATE "branches" SET "organizationId" = (SELECT "id" FROM "organizations" WHERE "slug" = 'mental-english')`);
        await queryRunner.query(`UPDATE "users" SET "organizationId" = (SELECT "id" FROM "organizations" WHERE "slug" = 'mental-english')`);
        await queryRunner.query(`ALTER TABLE "branches" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "UQ_c2c16397fa98d34f8db37684c41"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_branch_org_slug" ON "branches" ("organizationId", "slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_org_email" ON "users" ("organizationId", "email") `);
        await queryRunner.query(`ALTER TABLE "organization_domains" ADD CONSTRAINT "FK_0edfd4de8c741d0327f3c8d8109" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "FK_50d4200557c21103ae29b7985a2" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP CONSTRAINT "FK_50d4200557c21103ae29b7985a2"`);
        await queryRunner.query(`ALTER TABLE "organization_domains" DROP CONSTRAINT "FK_0edfd4de8c741d0327f3c8d8109"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_org_email"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_branch_org_slug"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "branches" ADD CONSTRAINT "UQ_c2c16397fa98d34f8db37684c41" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "branches" DROP COLUMN "organizationId"`);
        await queryRunner.query(`DROP TABLE "organization_domains"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }

}
