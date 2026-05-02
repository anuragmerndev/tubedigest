import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlansTable1746400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dodo_product_id VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        price INT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        billing_cycle VARCHAR NOT NULL DEFAULT 'monthly',
        credit_limit INT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS plans`);
  }
}
