-- Adds district to apartment and amount to deal.
-- Run once against the existing database.
ALTER TABLE apartment ADD COLUMN IF NOT EXISTS district VARCHAR(120);

ALTER TABLE deal ADD COLUMN IF NOT EXISTS amount NUMERIC(19, 2) NOT NULL DEFAULT 0;
