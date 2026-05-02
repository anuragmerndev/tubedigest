import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditColumnsToOrgs1746300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS credit_balance INT NOT NULL DEFAULT 10,
        ADD COLUMN IF NOT EXISTS credit_limit INT NOT NULL DEFAULT 10,
        ADD COLUMN IF NOT EXISTS credit_reset_period VARCHAR(7)
    `);

    // Backfill: set pro orgs limit to 100
    await queryRunner.query(`
      UPDATE organizations SET credit_limit = 100 WHERE plan = 'pro'
    `);

    // Backfill: calculate remaining balance from current usage_records
    await queryRunner.query(`
      UPDATE organizations o
      SET credit_balance = GREATEST(0, o.credit_limit - COALESCE(
        (SELECT count FROM usage_records
         WHERE org_id = o.id AND period = to_char(NOW(), 'YYYY-MM')),
        0
      ))
    `);

    // Set reset period to current month
    await queryRunner.query(`
      UPDATE organizations SET credit_reset_period = to_char(NOW(), 'YYYY-MM')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
        DROP COLUMN IF EXISTS credit_balance,
        DROP COLUMN IF EXISTS credit_limit,
        DROP COLUMN IF EXISTS credit_reset_period
    `);
  }
}
