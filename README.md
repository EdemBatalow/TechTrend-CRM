# TechTrend CRM

Интеллектуальная CRM-платформа для застройщиков, объединяющая маркетинг, продажи и аналитику с AI-модулями для прогнозирования спроса и оценки покупательской готовности.

## 🚀 Быстрый запуск (Docker)

Самый быстрый способ запустить проект — использовать Docker Compose. Одной командой вы развернете базу данных, бэкенд и фронтенд.

### Требования
- Docker
- Docker Compose

### Запуск
1. Склонируйте репозиторий.
2. Создайте файл `.env` в папке `backend/` (если его нет) и добавьте туда ваш `AI_API_KEY`.
3. Запустите проект из корневой директории:
   ```bash
   docker-compose up --build
   ```
4. После запуска:
   - Фронтенд: [http://localhost:5173](http://localhost:5173)
   - Бэкенд API: [http://localhost:8000](http://localhost:8000)
   - Документация Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🛠 Технологический стек

- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL
- **Frontend**: React, Vite, TypeScript, Framer Motion (motion.react)
- **AI**: Google Gemini API (для аналитики и чат-помощника)
- **Database**: PostgreSQL 15

## 📂 Структура проекта

- `backend/` — Исходный код API на FastAPI.
- `frontend/` — Клиентское приложение на React.
- `docker-compose.yml` — Файл оркестрации для запуска всего стека.

## ⚙️ Конфигурация

Основные настройки находятся в `backend/.env`:
- `DATABASE_URL`: Строка подключения к БД.
- `AI_API_KEY`: Ключ API для работы ИИ-модуля.
- `SECRET_KEY`: Секретный ключ для JWT токенов.

---
Разработано в рамках учебного проекта студентами Малышевым Эрвеном и Баталовым Эдемом.