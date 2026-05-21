ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

UPDATE "users"
SET "email" = lower(regexp_replace("id", '[^a-zA-Z0-9]+', '_', 'g')) || '@legacy.local'
WHERE "email" IS NULL;

UPDATE "users"
SET "password_hash" = 'legacy:disabled'
WHERE "password_hash" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
