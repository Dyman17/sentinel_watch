# 🚀 Быстрый деплой SENTINEL.SAT на Render

## 📋 Твой репозиторий уже готов: `https://github.com/Dyman17/sentinel_watch`

### 🎯 Что нужно сделать:

#### Шаг 1: Подготовка файлов (1 минута)
```bash
# Запусти скрипт
PUSH_TO_GITHUB.bat
```
*Скрипт создаст README.md, LICENSE, .gitignore, .env.example*

#### Шаг 2: Push на GitHub (30 секунд)
```bash
git add .
git commit -m "🚀 Initial commit: SENTINEL.SAT AI Disaster Monitoring"
git push origin main
```

#### Шаг 3: Деплой на Render (2 минуты)
1. Зайди на [render.com](https://render.com)
2. "New" → "Web Service"
3. Подключи репозиторий `Dyman17/sentinel_watch`
4. Настрой:

```yaml
Name: sentinel-watch
Environment: Python
Root Directory: ./backend
Build Command: ./render-build.sh
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Шаг 4: Environment Variables
```bash
HF_TOKEN=Bearer hf_your_token_here
ESP_STREAM_URL=http://192.168.1.100:81/stream
```

#### Шаг 5: Готово! 🎉
Через 3 минуты приложение будет доступно на `https://sentinel-watch.onrender.com`

---

## 🔧 HuggingFace токен

1. Зайди на [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Создай новый токен
3. Скопируй: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Добавь в Environment Variables на Render

---

## ✅ Проверка работоспособности

После деплоя проверь:
- 🌐 `https://sentinel-watch.onrender.com` - главный интерфейс
- 🔧 `https://sentinel-watch.onrender.com/api/health` - API статус
- 📹 `https://sentinel-watch.onrender.com/stream` - видеопоток

---

## 🎯 Результат

Ты получишь:
- ✅ **Рабочее AI приложение** с детекцией катастроф
- ✅ **Красивый интерфейс** с анимированными частицами
- ✅ **Real-time мониторинг** с ESP32 камерами
- ✅ **Полностью бесплатно** - Render + HuggingFace

---

**🌍 SENTINEL.SAT готов спасать мир!** 🚀✨
