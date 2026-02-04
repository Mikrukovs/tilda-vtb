# 🏗️ Архитектура: Collaborative Builder

## Текущая архитектура

- **Frontend**: Next.js (static export)
- **State**: Zustand + localStorage
- **Auth**: Telegram (client-side)
- **Storage**: localStorage (клиент)

## Целевая архитектура

### Backend Stack

1. **Server**: Next.js API Routes (или отдельный Node.js/NestJS)
2. **Database**: PostgreSQL + Prisma ORM
3. **Real-time**: Socket.io для collaborative editing
4. **Storage**: S3/Minio для медиа файлов (опционально)

### Frontend Stack

1. **Framework**: Next.js (SSR вместо static export)
2. **State**: Zustand + Server State (React Query)
3. **Real-time**: Socket.io client
4. **Auth**: Telegram + JWT tokens

## База данных (PostgreSQL)

### Таблицы

```sql
-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Папки
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Проекты
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Структура проекта (screens, slots, etc)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Доступ к проектам (для collaborative editing)
CREATE TABLE project_collaborators (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'editor', -- owner, editor, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- История изменений (для undo/redo и конфликтов)
CREATE TABLE project_history (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_folders_owner ON folders(owner_id);
CREATE INDEX idx_projects_folder ON projects(folder_id);
CREATE INDEX idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_collaborators_user ON project_collaborators(user_id);
```

## API Endpoints

### Authentication

```
POST /api/auth/telegram     - Авторизация через Telegram
POST /api/auth/refresh      - Обновление JWT токена
GET  /api/auth/me           - Получить текущего пользователя
POST /api/auth/logout       - Выход
```

### Folders

```
GET    /api/folders         - Список папок пользователя
POST   /api/folders         - Создать папку
GET    /api/folders/:id     - Получить папку
PUT    /api/folders/:id     - Обновить папку
DELETE /api/folders/:id     - Удалить папку
```

### Projects

```
GET    /api/projects              - Список всех проектов пользователя
GET    /api/folders/:id/projects  - Проекты в папке
POST   /api/projects              - Создать проект
GET    /api/projects/:id          - Получить проект
PUT    /api/projects/:id          - Обновить проект
DELETE /api/projects/:id          - Удалить проект
```

### Collaborators

```
GET    /api/projects/:id/collaborators     - Список участников проекта
POST   /api/projects/:id/collaborators     - Добавить участника
DELETE /api/projects/:id/collaborators/:userId - Удалить участника
PUT    /api/projects/:id/collaborators/:userId - Изменить роль
```

### History

```
GET    /api/projects/:id/history           - История изменений проекта
POST   /api/projects/:id/revert/:historyId - Откатиться на версию
```

## WebSocket Events (Socket.io)

### Client -> Server

```javascript
// Подключение к проекту
socket.emit('project:join', { projectId, token });

// Обновление компонента
socket.emit('project:update', { 
  projectId, 
  changes: { type: 'updateComponent', slotId, props } 
});

// Добавление компонента
socket.emit('project:update', { 
  projectId, 
  changes: { type: 'addComponent', slotId, componentType } 
});

// Курсор пользователя (показать где работает другой юзер)
socket.emit('cursor:update', { projectId, position });
```

### Server -> Client

```javascript
// Изменения от других пользователей
socket.on('project:updated', (data) => {
  // Применить изменения к локальному state
});

// Кто-то подключился
socket.on('user:joined', (user) => {
  // Показать уведомление
});

// Кто-то отключился
socket.on('user:left', (user) => {
  // Скрыть курсор пользователя
});

// Курсоры других пользователей
socket.on('cursor:updated', (data) => {
  // Показать курсор другого пользователя
});
```

## Архитектура Collaborative Editing

### Подход: Operational Transformation (OT) или CRDT

**Рекомендую упрощенный подход с блокировками:**

1. **Блокировка слота**: Когда пользователь редактирует слот, он блокируется для других
2. **Live cursors**: Показываем где работают другие пользователи
3. **Автосохранение**: Каждые 2 секунды сохраняем на сервер
4. **Conflict resolution**: Последняя запись побеждает (Last Write Wins)

### Пример flow:

```
User A: Выбирает слот #5
  -> Socket: emit('slot:lock', { slotId: 5 })
  -> Server: Блокирует слот #5 для других
  -> Server: Broadcast всем: 'slot:locked' { slotId: 5, userId: A }
  
User B: Пытается выбрать слот #5
  -> UI: Показывает "Редактируется пользователем A"
  
User A: Изменяет props
  -> Локально обновляет UI (optimistic update)
  -> Socket: emit('project:update', { changes })
  -> Server: Сохраняет в БД + broadcast другим
  
User B: Получает обновление
  -> Socket: on('project:updated')
  -> Применяет изменения к локальному state
```

## Структура проекта

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Страница авторизации
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout с проверкой auth
│   │   ├── page.tsx              # Список папок и проектов
│   │   └── folders/
│   │       └── [id]/
│   │           └── page.tsx      # Проекты в папке
│   ├── editor/
│   │   └── [projectId]/
│   │       └── page.tsx          # Редактор проекта
│   └── api/
│       ├── auth/
│       │   ├── telegram/route.ts
│       │   └── me/route.ts
│       ├── folders/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── projects/
│           ├── route.ts
│           ├── [id]/route.ts
│           └── [id]/
│               ├── collaborators/route.ts
│               └── history/route.ts
├── components/
│   ├── auth/
│   ├── dashboard/
│   │   ├── FolderList.tsx
│   │   ├── ProjectList.tsx
│   │   ├── CreateFolderModal.tsx
│   │   └── ShareProjectModal.tsx
│   ├── editor/
│   │   ├── CollaboratorsCursors.tsx
│   │   ├── OnlineUsers.tsx
│   │   └── ...existing editor components
│   └── ui-kit/
├── lib/
│   ├── prisma.ts                 # Prisma client
│   ├── socket-server.ts          # Socket.io server setup
│   └── auth.ts                   # JWT utilities
├── hooks/
│   ├── useSocket.ts              # WebSocket hook
│   ├── useProject.ts             # React Query для проектов
│   └── useCollaboration.ts       # Collaborative editing logic
└── store/
    ├── auth.ts                   # Auth state
    ├── editor.ts                 # Editor state (modified)
    └── collaboration.ts          # Real-time collaboration state
```

## Этапы реализации

### Этап 1: Backend Setup (2-3 дня)
- [ ] Убрать static export из next.config
- [ ] Настроить PostgreSQL + Prisma
- [ ] Создать схему БД и миграции
- [ ] Реализовать API endpoints для auth
- [ ] Добавить JWT токены

### Этап 2: Folders & Projects API (2-3 дня)
- [ ] API для folders (CRUD)
- [ ] API для projects (CRUD)
- [ ] API для collaborators
- [ ] Миграция данных из localStorage

### Этап 3: UI для Dashboard (2-3 дня)
- [ ] Страница авторизации с редиректом
- [ ] Dashboard со списком папок
- [ ] Список проектов в папке
- [ ] Модалки создания/редактирования

### Этап 4: Real-time Collaboration (3-5 дней)
- [ ] Настроить Socket.io
- [ ] Реализовать подключение к проекту
- [ ] Синхронизация изменений
- [ ] Live cursors
- [ ] Блокировки слотов
- [ ] Список онлайн пользователей

### Этап 5: Polish & Testing (2-3 дня)
- [ ] Обработка конфликтов
- [ ] Оптимизация производительности
- [ ] История изменений
- [ ] Тестирование на нескольких пользователях

## Docker изменения

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: prototype_builder
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Next.js App (SSR)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8888:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/prototype_builder
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXT_PUBLIC_TELEGRAM_BOT_NAME: ${NEXT_PUBLIC_TELEGRAM_BOT_NAME}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Оценка времени

- **Минимально работающая версия**: 7-10 дней
- **С collaborative editing**: 12-15 дней
- **Полностью отполированная**: 15-20 дней

## Следующий шаг

Что делаем первым делом?

1. **Настраиваем базу данных** и API
2. **Создаем UI для dashboard** с папками
3. **Добавляем collaborative editing**

Скажите, с чего начнем? 🚀
