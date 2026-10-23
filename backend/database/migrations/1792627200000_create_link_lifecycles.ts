import { BaseSchema } from '@adonisjs/lucid/schema'
// Promoted staged SQL bodies verbatim; clock anchoring belongs to the INSERT service.
export const upSql = `-- Staged design migration; implement promotes this through a Lucid migration.
-- All identifiers and timestamps are supplied by the service, not database clocks.
CREATE TABLE IF NOT EXISTS link_lifecycles (
    id uuid NOT NULL,
    token_digest bytea NOT NULL,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    CONSTRAINT link_lifecycles_pkey PRIMARY KEY (id),
    CONSTRAINT link_lifecycles_token_digest_unique UNIQUE (token_digest),
    CONSTRAINT link_lifecycles_token_digest_length CHECK (
        octet_length(token_digest) = 32
    ),
    CONSTRAINT link_lifecycles_lifetime_valid CHECK (
        isfinite(created_at)
        AND isfinite(expires_at)
        AND EXTRACT(EPOCH FROM (expires_at - created_at)) BETWEEN 60 AND 86400
        AND MOD(EXTRACT(EPOCH FROM (expires_at - created_at)), 60) = 0
    )
);
`
export const downSql = `-- Destructive rollback: removes indefinite expired-link recognition metadata.
-- Stop dependent application code and take a metadata-only backup before a real rollback.
-- No CASCADE: unexpected dependents must block rollback rather than be removed.
DROP TABLE IF EXISTS link_lifecycles;
`
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // Fail even for an apparently compatible unmanaged table; no silent adoption.
      if (await db.schema.hasTable('link_lifecycles')) throw new Error('Lifecycle table already exists; promotion refused')
      await db.rawQuery(upSql)
    })
  }
  async down() {
    this.defer(async (db) => { await db.rawQuery(downSql) })
  }
}
