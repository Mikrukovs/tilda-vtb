# Backend Setup Guide

## Что изменилось

Проект переведен с **static export** на **SSR** с поддержкой:
- PostgreSQL база данных
- API Routes для backend
- Prisma ORM
- Real-time collaboration (в будущем)

## Установка

### 1. Клонирование репозитория

```bash
git clone -b dev https://github.com/Mikrukovs/pip_builder.git
cd pip_builder
```

###2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте `.env` файл:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/prototype_builder"
POSTGRES_DB=prototype_builder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:8888"

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_username
```

**Важно**: 
- `NEXTAUTH_SECRET` должен быть минимум 32 символа
- Сгенерировать можно: `openssl rand -base64 32`

### 4. Запуск с Docker

```bash
# Запуск PostgreSQL + App
docker compose up -d

# Проверка статуса
docker compose ps

# Логи
docker compose logs -f
```

### 5. Миграции базы данных

```bash
# Применить миграции (создать таблицы)
docker compose exec app-dev npx prisma migrate deploy

# Или если запускаете локально без Docker
npx prisma migrate deploy
```

### 6. Проверка

Откройте `http://localhost:8888` - должна открыться страница авторизации.

## Команды Prisma

### Генерация Prisma Client

```bash
npm run db:generate
# или
npx prisma generate
```

### Создание миграции

```bash
npm run db:migrate
# или
npx prisma migrate dev --name your_migration_name
```

### Push схемы без миграции (dev)

```bash
npm run db:push
# или
npx prisma db push
```

### Prisma Studio (GUI для БД)

```bash
npm run db:studio
# или
npx prisma studio
```

Откроется на `http://localhost:5555`

## Структура базы данных

### Таблицы

1. **users** - Пользователи из Telegram
   - `id`, `telegram_id`, `username`, `first_name`, `last_name`, `photo_url`

2. **folders** - Папки для организации проектов
   - `id`, `name`, `owner_id`

3. **projects** - Проекты (прототипы)
   - `id`, `name`, `folder_id`, `data` (JSONB)

4. **project_collaborators** - Доступ к проектам
   - `id`, `project_id`, `user_id`, `role`

5. **project_history** - История изменений
   - `id`, `project_id`, `user_id`, `data` (JSONB)

## Development без Docker

### 1. Установить PostgreSQL локально

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Создать базу данных

```bash
createdb prototype_builder
```

### 3. Обновить DATABASE_URL в `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prototype_builder"
```

### 4. Применить миграции

```bash
npx prisma migrate deploy
```

### 5. Запустить dev сервер

```bash
npm run dev
```

## Production Deployment

### 1. Build

```bash
docker compose --profile production build
```

### 2. Run

```bash
docker compose --profile production up -d
```

### 3. Миграции

```bash
docker compose exec app-prod npx prisma migrate deploy
```

## Troubleshooting

### Cannot connect to database

**Проблема:** `Error: P1001: Can't reach database server`

**Решение:**
```bash
# Проверить что PostgreSQL запущен
docker compose ps

# Перезапустить
docker compose restart postgres

# Проверить логи
docker compose logs postgres
```

### Prisma Client not generated

**Проблема:** `Cannot find module '@prisma/client'`

**Решение:**
```bash
npx prisma generate
```

### Migration failed

**Проблема:** Ошибка при применении миграции

**Решение:**
```bash
# Сбросить БД (ВНИМАНИЕ: удалит все данные!)
npx prisma migrate reset

# Или вручную пересоздать
docker compose down -v
docker compose up -d
npx prisma migrate deploy
```

## Следующие шаги

- [ ] Настроить API routes для auth
- [ ] Создать API для folders
- [ ] Создать API для projects
- [ ] Добавить UI для dashboard
