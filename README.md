# FitMind AI Web

React SPA для FitMind AI: личный кабинет с авторизацией, профилем, тренировками, питанием, AI-планами и калькулятором 1ПМ.

## Запуск

```bash
npm install
npm run dev
```

Интерфейс откроется на `http://127.0.0.1:5173`.

## Backend

По умолчанию интерфейс работает с реальными Go-сервисами через Vite proxy:

- auth service: `http://localhost:8080`
- main service: `http://localhost:8081`

Настройки:

```env
VITE_AUTH_API_BASE=/auth-api
VITE_MAIN_API_BASE=/main-api
```

