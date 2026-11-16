CREATE TABLE IF NOT EXISTS notes (
  id serial PRIMARY KEY,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO notes (body)
SELECT 'Created by infra.setup when this lane started for the first time.'
WHERE NOT EXISTS (SELECT 1 FROM notes);
