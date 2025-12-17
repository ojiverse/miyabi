DROP TABLE IF EXISTS jobs;
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  status TEXT NOT NULL, -- 'PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'
  result TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
