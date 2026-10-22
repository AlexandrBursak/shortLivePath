-- Destructive rollback: removes indefinite expired-link recognition metadata.
-- Stop dependent application code and take a metadata-only backup before a real rollback.
-- No CASCADE: unexpected dependents must block rollback rather than be removed.
DROP TABLE IF EXISTS link_lifecycles;
