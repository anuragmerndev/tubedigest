import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1745400000000 implements MigrationInterface {
  name = 'InitialSchema1745400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(`CREATE TYPE "plan_enum" AS ENUM ('free', 'pro')`);
    await queryRunner.query(
      `CREATE TYPE "role_enum" AS ENUM ('owner', 'member')`,
    );
    await queryRunner.query(
      `CREATE TYPE "invitation_status_enum" AS ENUM ('pending', 'accepted', 'cancelled')`,
    );

    // organizations — no RLS, looked up before tenant context is set
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "name"       varchar     NOT NULL,
        "slug"       varchar     NOT NULL,
        "plan"       "plan_enum" NOT NULL DEFAULT 'free',
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_organizations"      PRIMARY KEY ("id")
      )
    `);

    // users — RLS
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"         uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "clerk_id"   varchar     NOT NULL,
        "email"      varchar     NOT NULL,
        "role"       "role_enum" NOT NULL DEFAULT 'member',
        "org_id"     uuid        NOT NULL,
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_clerk_id" UNIQUE ("clerk_id"),
        CONSTRAINT "PK_users"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_org"      FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // invitations — RLS
    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"     uuid                     NOT NULL,
        "email"      varchar                  NOT NULL,
        "role"       "role_enum"              NOT NULL DEFAULT 'member',
        "status"     "invitation_status_enum" NOT NULL DEFAULT 'pending',
        "invited_by" uuid                     NOT NULL,
        "created_at" TIMESTAMP                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations"      PRIMARY KEY ("id"),
        CONSTRAINT "FK_invitations_org"  FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invitations_user" FOREIGN KEY ("invited_by")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // subscriptions — RLS
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                   uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"               uuid      NOT NULL,
        "dodo_plan_id"         varchar   NOT NULL,
        "status"               varchar   NOT NULL,
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end"   TIMESTAMP NOT NULL,
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscriptions_org_id" UNIQUE ("org_id"),
        CONSTRAINT "PK_subscriptions"        PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_org"    FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // usage_records — RLS
    await queryRunner.query(`
      CREATE TABLE "usage_records" (
        "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "org_id"     uuid      NOT NULL,
        "period"     varchar   NOT NULL,
        "count"      integer   NOT NULL DEFAULT 0,
        "limit"      integer   NOT NULL DEFAULT 10,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usage_records_org_period" UNIQUE ("org_id", "period"),
        CONSTRAINT "PK_usage_records"            PRIMARY KEY ("id"),
        CONSTRAINT "FK_usage_records_org"        FOREIGN KEY ("org_id")
          REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    // videos — no RLS, shared cross-tenant cache
    await queryRunner.query(`
      CREATE TABLE "videos" (
        "id"               uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "youtube_video_id" varchar   NOT NULL,
        "url"              varchar   NOT NULL,
        "transcript"       text,
        "summary"          text,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_videos_youtube_video_id" UNIQUE ("youtube_video_id"),
        CONSTRAINT "PK_videos"                  PRIMARY KEY ("id")
      )
    `);

    // user_summaries — RLS
    await queryRunner.query(`
      CREATE TABLE "user_summaries" (
        "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid      NOT NULL,
        "org_id"     uuid      NOT NULL,
        "video_id"   uuid      NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_summaries"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_summaries_user"  FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_summaries_video" FOREIGN KEY ("video_id")
          REFERENCES "videos"("id") ON DELETE CASCADE
      )
    `);

    // ── Indexes ──────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE INDEX "IDX_users_clerk_id"        ON "users"          ("clerk_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_org_id"          ON "users"          ("org_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_org_id"    ON "invitations"    ("org_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_org_email" ON "invitations"    ("org_id", "email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_summaries_user"   ON "user_summaries" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_summaries_org"    ON "user_summaries" ("org_id")`,
    );

    // ── RLS policies ─────────────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE "users" FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY "tenant_isolation" ON "users"
        USING (org_id = current_setting('app.org_id')::uuid)
    `);

    for (const table of [
      'invitations',
      'subscriptions',
      'usage_records',
      'user_summaries',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`,
      );
      await queryRunner.query(`
        CREATE POLICY "tenant_isolation" ON "${table}"
          USING (org_id = current_setting('app.org_id')::uuid)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'user_summaries',
      'videos',
      'usage_records',
      'subscriptions',
      'invitations',
      'users',
      'organizations',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    await queryRunner.query(`DROP TYPE IF EXISTS "invitation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plan_enum"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
