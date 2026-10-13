-- Preserve publication of legacy projects while adding a separate draft flag.
UPDATE cms_entries
SET data_json=json_set(data_json,'$.draft',json(CASE WHEN status='draft' THEN 'true' ELSE 'false' END))
WHERE kind='project' AND json_type(data_json,'$.draft') IS NULL;
CREATE TABLE IF NOT EXISTS cms_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
