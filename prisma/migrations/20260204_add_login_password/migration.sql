-- Делаем telegramId опциональным
ALTER TABLE "users" ALTER COLUMN "telegram_id" DROP NOT NULL;

-- Заполняем username для пользователей, у которых его нет (генерируем из telegram_id)
UPDATE "users" 
SET "username" = 'tg_' || "telegram_id"::text 
WHERE "username" IS NULL AND "telegram_id" IS NOT NULL;

-- Для пользователей без telegram_id и без username (если такие есть)
UPDATE "users" 
SET "username" = 'user_' || "id"::text 
WHERE "username" IS NULL;

-- Делаем username обязательным и уникальным
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Добавляем поле password (опциональное, так как может быть Telegram авторизация)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);

-- Создаём уникальный индекс на username, если его ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
    END IF;
END $$;
