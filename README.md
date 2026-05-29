# FitMind AI Web

React SPA для FitMind AI: личный кабинет с авторизацией, профилем, тренировками, питанием, AI-заглушками и калькулятором 1ПМ.

## Запуск

```bash
npm install
npm run dev
```

Сайт откроется на `http://127.0.0.1:5173`.

## Backend

По умолчанию включен mock mode, поэтому интерфейс работает без запущенных Go-сервисов.

```env
VITE_USE_MOCKS=true
VITE_AUTH_API_BASE=/auth-api
VITE_MAIN_API_BASE=/main-api
```

Чтобы подключить реальные сервисы из веток `auth` и `main-module`, выставьте `VITE_USE_MOCKS=false` и запустите:

- auth service: `http://localhost:8080`
- main service: `http://localhost:8081`

Vite proxy уже настроен для `/auth-api/*` и `/main-api/*`.

Локально ветки можно держать в:

- `backend/auth`
- `backend/main-module`

AI endpoints в `main-module` требуют `API_KEY`; без него backend возвращает ошибку внешнего AI-провайдера, а интерфейс показывает ее как статус генерации.

## Проверки

```bash
npm run lint
npm run build
```
