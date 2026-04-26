import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDodoCustomerIdToOrgs1745420000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dodo_customer_id VARCHAR NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE organizations DROP COLUMN IF EXISTS dodo_customer_id`,
    );
  }
}
