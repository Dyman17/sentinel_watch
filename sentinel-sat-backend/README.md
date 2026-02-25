# SENTINEL.SAT: Система мониторинга катастроф

Профессиональная система для мониторинга ESP32 камеры и спутниковых снимков NASA с AI анализом через HuggingFace YOLO.

## 🚀 Быстрый старт

### 1. Получи HuggingFace токен
1. Зайди на [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Создай новый токен с правами `read`
3. Сохрани токен: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Деплой на Render
1. Fork этого репозитория
2. Зайди на [render.com](https://render.com)
3. Создай новый Web Service
4. Подключи GitHub репозиторий
5. Настрой environment variables:
   ```bash
   HF_TOKEN=Bearer hf_your_token_here
   ESP_STREAM_URL=http://your-esp32-ip:81/stream
   ```

### 3. Запуск!
Render автоматически соберет и развернет приложение.

## 🎯 Функции

- 🌍 **Мониторинг в реальном времени** - ESP32 камера + AI анализ
- 🤖 **YOLO детекция** - огонь, наводнения, дым через HuggingFace
- 🗺️ **Карта событий** - Leaflet с NASA спутниковыми тайлами
- 📊 **История событий** - логи с временными метками
- 🎨 **Современный UI** - анимированные частицы, адаптивный дизайн

## 📡 API Endpoints

- `GET /api/health` - проверка здоровья
- `GET /api/latest` - последний анализ
- `GET /api/logs` - история событий
- `POST /api/switch/{esp|nasa}` - переключить источник
- `GET /stream` - видеопоток

## 🛠️ Технологии

- **Backend**: FastAPI, Python, OpenCV
- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion
- **AI**: HuggingFace YOLO (`yolos/yolos-tiny`)
- **Video**: MJPEG поток с ESP32-CAM
- **Maps**: Leaflet с NASA тайлами
- **Deploy**: Render (бесплатный tier)

## 💰 Стоимость

- **Render**: Бесплатно (750 часов/месяц)
- **HuggingFace**: Бесплатно (30,000 запросов/месяц)
- **ESP32**: Одноразовая покупка (~$10)

## 📱 Доступ

После деплоя приложение будет доступно по адресу:
`https://sentinel-sat-backend.onrender.com`

## 🔧 Локальная разработка

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

## 📄 Лицензия

MIT License - свободно для использования и модификации.

---

🌍 **SENTINEL.SAT** - Мониторинг катастроф нового поколения
