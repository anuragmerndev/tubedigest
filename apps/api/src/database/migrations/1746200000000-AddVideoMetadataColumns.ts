import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoMetadataColumns1746200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE videos
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS channel_name TEXT,
        ADD COLUMN IF NOT EXISTS duration INTEGER
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE videos
        DROP COLUMN IF EXISTS title,
        DROP COLUMN IF EXISTS thumbnail_url,
        DROP COLUMN IF EXISTS channel_name,
        DROP COLUMN IF EXISTS duration
    `);
  }
}
