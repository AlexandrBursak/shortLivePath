-- Staged design migration; implement promotes this through a Lucid migration.
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
