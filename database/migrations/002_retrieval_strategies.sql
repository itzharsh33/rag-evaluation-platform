
BEGIN;

-- Track the strategy used to create each individual chunk.
ALTER TABLE chunks
ADD COLUMN IF NOT EXISTS chunking_strategy TEXT
NOT NULL DEFAULT 'fixed';

-- Permit the same chunk index for different strategies.
ALTER TABLE chunks
DROP CONSTRAINT IF EXISTS chunks_document_id_chunk_index_key;

ALTER TABLE chunks
ADD CONSTRAINT chunks_document_strategy_index_key
UNIQUE (document_id, chunking_strategy, chunk_index);

-- Help PostgreSQL filter chunks by workspace and strategy.
CREATE INDEX IF NOT EXISTS idx_chunks_strategy_scope
ON chunks (workspace_id, collection, chunking_strategy);

COMMIT;
