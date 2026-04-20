# Настройка Google OAuth

## Чеклист Google Cloud Console

### 1. Authorized JavaScript origins
Добавь в разделе "Authorized JavaScript origins":
```
http://localhost:3000
http://localhost:5000
```

### 2. Authorized redirect URIs ← САМОЕ ВАЖНОЕ
Добавь ТОЧНО эту строку:
```
http://localhost:5000/api/auth/google/callback
```

### 3. OAuth consent screen
- User Type: External
- App name: DanceStudio (любое)
- Добавь свой email в "Test users" если приложение в статусе "Testing"

### 4. Проверь .env
```
GOOGLE_CLIENT_ID=865546662175-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

## После изменений — ПЕРЕЗАПУСТИ BACKEND
```
npm run dev
```

## Как проверить что всё работает
Открой в браузере: http://localhost:5000/api/auth/google
- Должна открыться страница выбора аккаунта Google
- После выбора — редирект на http://localhost:3000/auth/google/success
- Затем — редирект на /schedule (для клиента)
