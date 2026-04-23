import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUsersOrgIdNullable1745410000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "org_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_org"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_org"
        FOREIGN KEY ("org_id")
        REFERENCES "organizations"("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_org"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_org"
        FOREIGN KEY ("org_id")
        REFERENCES "organizations"("id")
        ON DELETE CASCADE
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "org_id" SET NOT NULL`,
    );
  }
}
