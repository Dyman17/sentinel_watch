# 🌦️ AI-Meteo: Техническая документация (Часть 2)

## Часть 8: Инструкция по запуску

### Требования к окружению

```
Системные требования:
  - ОС: Linux, macOS, Windows (WSL2)
  - Python: 3.10+
  - Node.js: 16+ (для фронтенда)
  - PostgreSQL: 13+
  - Redis: 6.0+ (опционально для кэширования)

Установленные инструменты:
  - Git (для клонирования репо)
  - pip (package manager для Python)
  - npm (package manager для Node.js)
  - Docker (опционально, для деплоя)
  - Arduino IDE или PlatformIO (для прошивки ESP32)

Железо для демо:
  - 2-3 ESP32 платы с датчиками BME280/DHT22
  - ИЛИ запустить симулятор (generate_test_data.py)

Доступ в интернет:
  - Для передачи данных с ESP32
  - Для доступа к Sentinel Hub API
```

### Пошаговая установка (для жюри)

#### Шаг 1️⃣: Клонировать репозиторий

```bash
# Клонируем проект
git clone https://github.com/yourusername/ai-meteo.git
cd ai-meteo

# Проверяем структуру
ls -la
# Output:
# backend/          ← Сервер FastAPI
# frontend/         ← React приложение
# firmware/         ← Код для ESP32
# demo/             ← Скрипты для демонстрации
# docs/             ← Документация
# tests/            ← Тесты
# docker-compose.yml
# README.md
```

#### Шаг 2️⃣: Настроить Backend

```bash
cd backend

# Создаём виртуальное окружение
python -m venv venv

# Активируем (на Linux/macOS)
source venv/bin/activate
# Или на Windows:
# venv\Scripts\activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Копируем пример переменных окружения
cp .env.example .env

# Редактируем .env файл (внесите свои значения):
cat .env
# ===== .env =====
# DATABASE_URL=postgresql://user:password@localhost/ai_meteo
# REDIS_URL=redis://localhost:6379
# SENTINEL_HUB_CLIENT_ID=your_client_id
# SENTINEL_HUB_CLIENT_SECRET=your_client_secret
# TELEGRAM_BOT_TOKEN=your_bot_token
# ================

# Создаём базу данных (если используете PostgreSQL)
# (можно использовать SQLite для быстрого старта)

# Запускаем миграции (если используете Alembic)
alembic upgrade head

# Запускаем сервер
python main.py
# Output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

**Проверка:**
```bash
curl http://localhost:8000/api/health
# Expected output:
# {"status": "ok", "model_loaded": true, "database": "connected"}
```

#### Шаг 3️⃣: Настроить Frontend

```bash
cd ../frontend

# Устанавливаем зависимости
npm install

# Копируем переменные окружения
cp .env.example .env

# Отредактируем .env:
cat .env
# ===== .env =====
# VITE_API_BASE_URL=http://localhost:8000
# VITE_MAPBOX_TOKEN=your_mapbox_token  # опционально
# ================

# Запускаем dev сервер
npm run dev
# Output:
# VITE v4.0.0 ready in xxx ms
# ➜ Local:   http://localhost:5173/
# ➜ press h to show help
```

**Проверка:** Открыть браузер http://localhost:5173 — должна загрузиться карта Leaflet

#### Шаг 4️⃣: Запустить демонстрацию (без реального железа)

```bash
cd ../demo

# Запускаем симулятор датчиков
python simulate_sensors.py

# Output:
# 🚀 Simulator started
# 📡 Station #1: temp=18.5, humidity=72%, pressure=1013.2
# 📡 Station #2: temp=20.1, humidity=65%, pressure=1013.0
# 📡 Station #3: temp=17.8, humidity=75%, pressure=1012.9
# Sending data every 5 seconds...
# ✅ Data sent to http://localhost:8000/api/readings
```

**В другом терминале:** проверяем что данные поступают

```bash
# Смотрим логи backend'а
tail -f ../backend/logs/app.log

# Или запрашиваем последние станции
curl http://localhost:8000/api/stations | jq
```

#### Шаг 5️⃣: Открыть фронтенд и протестировать

1. Открыть браузер: **http://localhost:5173**
2. Должны увидеть интерактивную карту
3. На карте — 3 разноцветных маркера (зелёные, жёлтые или красные)
4. Кликнуть на маркер → должен открыться попап с:
   - Текущей температурой/влажностью/давлением
   - Графиком прогноза осадков на 3 часа
   - Вероятностью дождя в процентах

#### Шаг 6️⃣: Протестировать Telegram-бот (опционально)

```bash
cd ../bot

# Устанавливаем зависимости
pip install -r requirements.txt

# Запускаем бот
python telegram_bot.py

# Output:
# 🤖 Telegram bot started
# Listening for messages...
```

Открыть Telegram → найти бота (@your_bot_name) → `/start`

---

### Как протестировать/продемонстрировать работу

#### 📱 Демо без реального железа (3 минуты)

```bash
# Терминал 1: Backend
cd backend
source venv/bin/activate
python main.py

# Терминал 2: Frontend
cd frontend
npm run dev

# Терминал 3: Симулятор
cd demo
python simulate_sensors.py

# Терминал 4: (опционально) Telegram-бот
cd bot
python telegram_bot.py
```

**Результат:**
- На http://localhost:5173 видны маркеры станций
- Маркеры меняют цвет каждые 15 минут (LSTM предсказывает новый прогноз)
- Клик на маркер → детальная информация
- Telegram-бот отвечает на команды

#### 🔧 Демо с реальным ESP32 (30 минут)

1. **Прошить ESP32** (инструкция в `firmware/README.md`)
2. **Подключить датчик BME280/DHT22** к пинам (см. `firmware/config.h`)
3. **Включить WiFi** и установить SSID/password в коде
4. **Загрузить прошивку** через Arduino IDE или PlatformIO
5. **Отключить симулятор** (убить процесс `simulate_sensors.py`)
6. **ESP32 начнёт отправлять реальные данные** на Backend
7. На фронте увидите реальные значения температуры/влажности

---

## Часть 9: Структура проекта

```
ai-meteo/                          # Корневая папка проекта
│
├── README.md                       # Главный файл проекта
├── LICENSE                         # Лицензия (MIT)
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Docker Compose конфиг
├── requirements-dev.txt            # Dev зависимости
│
├── firmware/                       # Прошивка для ESP32
│   ├── README.md
│   ├── esp32_bme280.ino            # Основной скетч с BME280
│   ├── esp32_dht22.ino             # Альтернативный скетч с DHT22
│   ├── config.h                    # Конфигурация Wi-Fi и MQTT
│   ├── secrets.h                   # Пароли (в .gitignore)
│   └── libraries/                  # Используемые библиотеки
│       ├── BME280.h
│       ├── DHT.h
│       └── WiFi.h
│
├── backend/                        # Backend на FastAPI
│   ├── main.py                     # Точка входа (Uvicorn)
│   ├── requirements.txt            # Python зависимости
│   ├── .env.example                # Пример переменных окружения
│   ├── config.py                   # Конфигурация приложения
│   │
│   ├── app/                        # FastAPI приложение
│   │   ├── __init__.py
│   │   ├── api/                    # API эндпоинты
│   │   │   ├── __init__.py
│   │   │   ├── readings.py         # POST /api/readings
│   │   │   ├── stations.py         # GET /api/stations
│   │   │   ├── forecast.py         # GET /api/station/{id}/forecast
│   │   │   ├── websocket.py        # WebSocket /ws/predictions
│   │   │   └── health.py           # GET /api/health
│   │   │
│   │   ├── models/                 # SQLAlchemy модели БД
│   │   │   ├── __init__.py
│   │   │   ├── reading.py          # Таблица readings (temp, humidity, pressure)
│   │   │   ├── station.py          # Таблица stations (название, координаты)
│   │   │   ├── forecast.py         # Таблица forecasts (прогнозы)
│   │   │   └── satellite.py        # Таблица satellite_data (облачность из Sentinel)
│   │   │
│   │   ├── schemas/                # Pydantic схемы (валидация)
│   │   │   ├── __init__.py
│   │   │   ├── reading_schema.py
│   │   │   ├── forecast_schema.py
│   │   │   └── station_schema.py
│   │   │
│   │   ├── database.py             # Подключение к PostgreSQL
│   │   ├── websocket_manager.py    # Управление WebSocket соединениями
│   │   └── dependencies.py         # Зависимости (DB session и т.п.)
│   │
│   ├── ml/                         # ML модель и инференс
│   │   ├── __init__.py
│   │   ├── model.py                # Загрузка LSTM модели
│   │   ├── predict.py              # Функция инференса (batch prediction)
│   │   ├── preprocess.py           # Feature engineering
│   │   ├── train.py                # Обучение модели (скрипт)
│   │   ├── models/                 # Сохранённые веса моделей
│   │   │   ├── lstm_model.pt       # PyTorch модель
│   │   │   ├── scaler.pkl          # StandardScaler
│   │   │   └── transformer_model.pt # (опционально)
│   │   └── datasets/               # Данные для обучения
│   │       ├── meteostat_data.csv
│   │       ├── synthetic_data.csv
│   │       └── train_val_split.py
│   │
│   ├── integrations/               # Интеграции с внешними API
│   │   ├── __init__.py
│   │   ├── sentinel_hub.py         # Получение облачности из Sentinel
│   │   ├── telegram_service.py     # Отправка уведомлений в Telegram
│   │   └── openweather.py          # (опционально) калибровка по OpenWeatherMap
│   │
│   ├── utils/                      # Утилиты
│   │   ├── __init__.py
│   │   ├── logger.py               # Логирование
│   │   ├── validators.py           # Валидация данных
│   │   └── helpers.py              # Вспомогательные функции
│   │
│   ├── logs/                       # Логи приложения
│   │   └── app.log
│   │
│   └── tests/                      # Unit тесты
│       ├── __init__.py
│       ├── test_api.py
│       ├── test_models.py
│       └── test_ml.py
│
├── frontend/                       # React приложение (Vite)
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js              # Vite конфигурация
│   ├── tsconfig.json               # TypeScript конфигурация
│   ├── .env.example
│   │
│   ├── public/                     # Статические файлы
│   │   └── favicon.ico
│   │
│   └── src/
│       ├── index.css               # Глобальные стили
│       ├── main.tsx                # Точка входа
│       ├── App.tsx                 # Корневой компонент
│       ├── vite-env.d.ts           # TypeScript типы для Vite
│       │
│       ├── components/             # React компоненты
│       │   ├── Map/
│       │   │   ├── Map.tsx         # Карта Leaflet с маркерами
│       │   │   └── Map.css
│       │   ├── StationPopup/
│       │   │   ├── StationPopup.tsx  # Попап при клике на маркер
│       │   │   ├── StationPopup.css
│       │   │   └── ForecastChart.tsx # График прогноза (Chart.js)
│       │   ├── Legend/
│       │   │   ├── Legend.tsx       # Легенда (зелёный/жёлтый/красный)
│       │   │   └── Legend.css
│       │   ├── StatusBar/
│       │   │   ├── StatusBar.tsx    # Статус бара (обновлен/ошибка)
│       │   │   └── StatusBar.css
│       │   └── LoadingSpinner/
│       │       └── LoadingSpinner.tsx
│       │
│       ├── services/               # API и сервисы
│       │   ├── api.ts              # REST API клиент (axios/fetch)
│       │   ├── websocket.ts        # WebSocket клиент (socket.io)
│       │   └── geolocation.ts      # Работа с геолокацией браузера
│       │
│       ├── types/                  # TypeScript типы
│       │   ├── index.ts
│       │   ├── station.ts
│       │   ├── forecast.ts
│       │   └── api.ts
│       │
│       ├── hooks/                  # React хуки
│       │   ├── useStations.ts      # Загрузка станций
│       │   ├── useForecast.ts      # Загрузка прогнозов
│       │   └── useWebSocket.ts     # WebSocket подключение
│       │
│       ├── utils/                  # Утилиты фронтенда
│       │   ├── colors.ts           # Маппинг вероятности → цвет маркера
│       │   ├── distance.ts         # Расчёт расстояния между координатами
│       │   └── formatters.ts       # Форматирование дат, чисел
│       │
│       └── assets/                 # Изображения, шрифты
│           └── icons/
│
├── bot/                            # Telegram-бот
│   ├── telegram_bot.py             # Основной файл бота
│   ├── requirements.txt
│   ├── handlers/
│   │   ├── __init__.py
│   │   ├── start.py                # /start команда
│   │   ├── forecast.py             # /forecast команда
│   │   ├── location.py             # Обработка геолокации
│   │   └── settings.py             # /settings команда
│   ├── services/
│   │   ├── __init__.py
│   │   └── api_client.py           # Клиент для Backend API
│   └── config.py
│
├── demo/                           # Демонстрационные скрипты
│   ├── simulate_sensors.py         # Генерирует тестовые данные
│   ├── test_api.py                 # Тестирование API вручную
│   ├── generate_test_data.csv      # Пример входных данных
│   └── README.md
│
├── data/                           # Примеры данных
│   ├── sample_readings.json        # Пример данных с датчиков
│   ├── sample_forecast.json        # Пример прогноза
│   └── satellite_sample.tif        # Пример спутникового снимка
│
├── docs/                           # Документация
│   ├── API.md                      # API документация
│   ├── ARCHITECTURE.md             # Описание архитектуры
│   ├── SETUP.md                    # Гайд установки
│   ├── ML_MODEL.md                 # Описание модели
│   ├── DEPLOYMENT.md               # Деплой на Render, HF Spaces
│   └── images/                     # Скриншоты
│       ├── map_demo.png
│       ├── telegram_demo.png
│       └── architecture.png
│
├── tests/                          # Интеграционные тесты
│   ├── test_end_to_end.py
│   └── conftest.py
│
└── .github/                        # GitHub Actions (CI/CD)
    └── workflows/
        ├── test.yml                # Запуск тестов
        └── deploy.yml              # Деплой на Render
```

---

## Часть 10: Веб-интерфейс (ДЕТАЛЬНО)

### Главная страница: Интерактивная карта

```
┌─────────────────────────────────────────────────────────────────┐
│ AI-Meteo | Прогноз осадков на карте           [🔄 Обновить]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Легенда:  🟢 Ясно  🟡 Возможен дождь  🔴 Дождь ожидается     │
│                                                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │                                                          │   │
│ │              🟢 Станция №1 (Северное Бутово)            │   │
│ │           (55.3485°N, 37.7449°E)                       │   │
│ │                                                          │   │
│ │                          🟡 Станция №2                  │   │
│ │                         (Центр Москвы)                 │   │
│ │                                                          │   │
│ │        🔴 Станция №3 (ЮАО)                             │   │
│ │                                                          │   │
│ │  [← Zoom in/out →]                                     │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Последнее обновление: 14:15  |  🟢 Соединение активно        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Поведение маркеров

**Цветовая индикация (зависит от вероятности дождя):**

```javascript
if (rain_probability > 0.7) {
  marker_color = "#FF0000";  // 🔴 Красный → Дождь высоковероятен
  intensity = "Heavy rain";
} else if (rain_probability > 0.4) {
  marker_color = "#FFC107";  // 🟡 Жёлтый → Может быть дождь
  intensity = "Light rain";
} else {
  marker_color = "#4CAF50";  // 🟢 Зелёный → Ясно
  intensity = "No rain";
}
```

**Анимация:**
- Маркеры **пульсируют** (opacity 0.7 → 1.0) каждые 15 секунд, если данные свежие
- Маркер **становится серым** если данные старше 30 минут (потеря связи с датчиком)

### Попап станции (при клике)

```
┌───────────────────────────────────────────────┐
│ Северное Бутово         [×]                   │
├───────────────────────────────────────────────┤
│                                               │
│ 📍 55.3485°N, 37.7449°E                      │
│ 🕐 Обновлено: 14:05 (2 минуты назад)        │
│                                               │
│ ═══════════════════════════════════════════  │
│ ТЕКУЩИЕ ПОКАЗАНИЯ                             │
│ ═══════════════════════════════════════════  │
│                                               │
│ 🌡️  Температура: +18.5°C                     │
│     ▁▂▃▄▅ (средняя за день)                  │
│                                               │
│ 💧 Влажность: 72%                            │
│     ▁▂▃▄▅                                     │
│                                               │
│ 🌪️  Давление: 1013.2 hPa                     │
│     ▁▂▃▄▅                                     │
│                                               │
│ ═══════════════════════════════════════════  │
│ ПРОГНОЗ ОСАДКОВ НА 3 ЧАСА                   │
│ ═══════════════════════════════════════════  │
│                                               │
│  15:00         16:00         17:00           │
│   █            █████         ███             │
│   █            █████         ███             │
│   █            █████         ███             │
│   █            █████         ███             │
│   █            █████         ███             │
│  ──────────────────────────────────          │
│  15%           45%            25%            │
│  (Нет дождя)  (Лёгкий дождь) (Дождь)       │
│                                               │
│ 🌧️ Итоговый прогноз: Лёгкий дождь           │
│    ожидается в 16:00, пик интенсивности     │
│    в 16:30.                                  │
│                                               │
│ [📍 Открыть в новой вкладке]                │
│                                               │
└───────────────────────────────────────────────┘
```

### Компоненты UI

#### 1. **Map.tsx** — Основная карта

```typescript
// Использует Leaflet для отображения
// Инициализирует карту с центром на Москве
// Рендерит маркеры для каждой станции
// Обновляет маркеры через WebSocket

const Map = () => {
  const mapRef = useRef(null);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    // Загрузить станции с API
    fetchStations().then(setStations);

    // Подписаться на WebSocket обновления
    subscribeToUpdates((update) => {
      updateMarkerColor(update.station_id, update.color);
    });
  }, []);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      {stations.map(station => (
        <Marker
          key={station.id}
          position={[station.lat, station.lon]}
          color={station.forecast.color}
          onClick={() => openPopup(station)}
        />
      ))}
    </div>
  );
};
```

#### 2. **StationPopup.tsx** — Информационное окно

```typescript
const StationPopup = ({ station, onClose }) => {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    // Загрузить прогноз для этой станции
    fetchForecast(station.id).then(setForecast);
  }, [station.id]);

  return (
    <div className="popup">
      <h3>{station.name}</h3>

      {/* Текущие показания */}
      <div className="readings">
        <Reading icon="🌡️" label="Температура" value={`${station.temp}°C`} />
        <Reading icon="💧" label="Влажность" value={`${station.humidity}%`} />
        <Reading icon="🌪️" label="Давление" value={`${station.pressure} hPa`} />
      </div>

      {/* График прогноза */}
      <ForecastChart forecast={forecast} />

      <button onClick={onClose}>Закрыть</button>
    </div>
  );
};
```

#### 3. **ForecastChart.tsx** — График прогноза

```typescript
import Chart from 'chart.js';

const ForecastChart = ({ forecast }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !forecast) return;

    const ctx = chartRef.current.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['15:00', '16:00', '17:00', ...],
        datasets: [{
          label: 'Вероятность дождя (%)',
          data: forecast.rain_probs,
          backgroundColor: forecast.rain_probs.map(prob =>
            prob > 0.7 ? '#FF0000' : prob > 0.4 ? '#FFC107' : '#4CAF50'
          ),
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { min: 0, max: 100 }
        }
      }
    });
  }, [forecast]);

  return <canvas ref={chartRef} />;
};
```

#### 4. **Legend.tsx** — Легенда

```typescript
const Legend = () => (
  <div className="legend">
    <div className="legend-item">
      <span className="legend-color" style={{ backgroundColor: '#4CAF50' }} />
      <span className="legend-label">Ясно (&lt;30%)</span>
    </div>
    <div className="legend-item">
      <span className="legend-color" style={{ backgroundColor: '#FFC107' }} />
      <span className="legend-label">Возможен дождь (30-70%)</span>
    </div>
    <div className="legend-item">
      <span className="legend-color" style={{ backgroundColor: '#FF0000' }} />
      <span className="legend-label">Дождь ожидается (&gt;70%)</span>
    </div>
  </div>
);
```

### Обновления в реальном времени

**WebSocket поток данных:**

```typescript
const socket = io('http://localhost:8000');

socket.on('forecast_update', (data) => {
  // Получили новый прогноз от сервера
  console.log(`Station ${data.station_id}: ${data.intensity}`);

  // Обновляем цвет маркера на карте
  updateMarkerColor(data.station_id, data.color);

  // Показываем уведомление пользователю (опционально)
  if (data.color === '#FF0000') {
    showNotification(`⚠️ На станции "${data.station_name}" ожидается дождь!`);
  }
});
```

### Адаптивный дизайс

**Desktop (>1024px):**
- Карта во весь экран
- Легенда в левом углу
- Статус-бар снизу

**Таблет (768-1024px):**
- Карта с меньшим зумом
- Легенда справа или снизу
- Попап занимает 60% ширины

**Мобильный (<768px):**
- Карта на весь экран (touch controls)
- Легенда свёрнута (иконка ⓘ)
- Попап в виде bottom sheet (скольжение вверх)

---

## Часть 11: Ограничения и пути развития

### Текущие ограничения MVP

| Ограничение | Влияние | Решение в будущем |
|------------|--------|------------------|
| **Мало датчиков** | Низкое пространственное разрешение | Расширить сеть до 50+ станций |
| **Малый датасет** | Модель может переобучиться | Собрать 6-12 месяцев истории |
| **Нет учёта рельефа** | Неточность в горах/впадинах | Добавить DEM (Digital Elevation Model) |
| **Статичное обучение** | Модель не адаптируется к сезонам | Online learning, retraining раз в месяц |
| **Одна моель для всех** | Разные районы имеют разный микроклимат | Per-location fine-tuning |
| **WebSocket только** | Нет истории при перезагрузке страницы | Добавить REST API для истории |
| **Нет мобильного приложения** | Невозможно быстро проверить погоду | React Native или Flutter приложение |
| **Ограничение Sentinel** | Спутник не видит сквозь облака | Комбинировать с радаром (NEXRAD) |
| **Нет push-уведомлений** | Пользователь должен постоянно открывать сайт | Веб-пушей, или мобильное приложение |

### Планируемые улучшения

#### 📱 **Фаза 1 (Месяц 1-2):**
- [x] MVP веб-сайт
- [ ] Мобильное приложение (React Native)
- [ ] Push-уведомления (Firebase Cloud Messaging)
- [ ] История прогнозов (графики за 7 дней)
- [ ] API для разработчиков (дополнительный доход?)

#### 🛰️ **Фаза 2 (Месяц 3-4):**
- [ ] Интеграция с радаром NEXRAD (осадки в реальном времени)
- [ ] Ансамбль моделей (LSTM + Transformer + Gradient Boosting)
- [ ] Per-location fine-tuning моделей
- [ ] Спутниковая визуализация облачности на карте
- [ ] Прогноз ветра, грозы (расширение возможностей)

#### 🏢 **Фаза 3 (Месяц 5-6):**
- [ ] B2B API для бизнеса (event-агентства, строительные компании)
- [ ] Интеграция с Яндекс.Погодой, 2ГИС
- [ ] Монетизация (премиум подписка, API платный)
- [ ] Расширение на другие города (Санкт-Петербург, Казань)

#### 🚀 **Фаза 4+ (Долгосрок):**
- [ ] Платформа для установки сетей датчиков в других городах
- [ ] Marketplace для интеграций (Telegram, Slack, Discord боты)
- [ ] Данные для климатических исследований (open API)
- [ ] Глобальная сеть (США, Европа, Азия)

### Возможные улучшения модели ИИ

```python
# Текущая версия: однослойный LSTM
model = Sequential([
    LSTM(128, input_shape=(96, 7)),
    Dense(32, activation='relu'),
    Dense(3, activation='sigmoid')
])

# Версия v2: Bidirectional LSTM + Attention
model = Sequential([
    Bidirectional(LSTM(128, return_sequences=True)),
    Attention(),
    LSTM(64, return_sequences=False),
    Dense(64, activation='relu'),
    Dropout(0.3),
    Dense(3, activation='sigmoid')
])

# Версия v3: Ensemble (LSTM + Transformer + XGBoost)
ensemble = VotingRegressor([
    lstm_model,
    transformer_model,
    xgboost_model
])

# Версия v4: Online Learning (постоянная переквалификация)
# Каждый день добавляются новые данные и модель обновляется
```

### Конкурентные преимущества

| Признак | Наше решение | Гидрометцентр | OpenWeatherMap |
|---------|-----------|---------------|-----------------|
| **Разрешение** | ~500 м | ~50 км | ~10 км |
| **Обновление** | 5 минут | 6 часов | 10 минут |
| **Обучение** | На локальных данных | На модели NWP | На модели NWP |
| **Стоимость** | Бесплатно (MVP) | Платная подписка | Платная API |
| **Сообщество** | Растущее | Закрыто | Закрыто |

---

## Часть 12: Использованные источники

### Датасеты

1. **Meteostat (https://meteostat.net/)**
   - Открытые метеоданные от 10000+ станций мира
   - Температура, влажность, давление, осадки
   - Используется для предварительной подготовки модели

2. **NOAA NEXRAD (https://www.ncei.noaa.gov/products/weather-and-climate-databases/radar-data-raw)**
   - Радиолокационные данные осадков
   - Разрешение: 1 км, обновление: 5 минут
   - Используется для валидации прогнозов

3. **Copernicus Open Access Hub (https://scihub.copernicus.eu/)**
   - Sentinel-2, Sentinel-3 спутниковые снимки
   - Облачность, растительность (NDVI)
   - Свободный доступ после регистрации

4. **Синтетические данные**
   - Генерируются скриптом `demo/generate_synthetic_data.py`
   - Используются для тестирования без реальных датчиков

### ML Библиотеки и статьи

**TensorFlow/Keras:**
- https://www.tensorflow.org/guide/keras/rnn
- Официальная документация по LSTM

**PyTorch & PyTorch Lightning:**
- https://pytorch.org/
- Более гибкий фреймворк для кастомных моделей

**Transformer архитектуры для временных рядов:**
- "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting" (Zhou et al., 2021)
  - Главная идея: ProbSparse attention экономит память
- "Autoformer: Decomposition Transformers with Auto-Correlation for Long-Term Series Forecasting" (Wu et al., 2021)

**Классические ML методы:**
- scikit-learn документация: https://scikit-learn.org/
- XGBoost для ансамблей: https://xgboost.readthedocs.io/

### Веб-фреймворки

**Backend:**
- FastAPI: https://fastapi.tiangolo.com/ (документация и туториалы)
- SQLAlchemy: https://docs.sqlalchemy.org/
- socket.io-python: https://python-socketio.readthedocs.io/

**Frontend:**
- React документация: https://react.dev/
- Vite: https://vitejs.dev/
- Leaflet: https://leafletjs.com/ (картографическая библиотека)
- Chart.js: https://www.chartjs.org/ (графики)

### Hardware

**ESP32:**
- Официальная документация: https://docs.espressif.com/projects/esp-idf/
- Arduino IDE: https://docs.arduino.cc/
- PlatformIO: https://docs.platformio.org/

**Датчики:**
- BME280 datasheet: https://www.bosch-sensortec.com/products/environmental-sensors/pressure-sensors/bme280/
- DHT22 datasheet: https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf

### Облачные сервисы

- **Render.com**: https://render.com/docs (деплой Backend)
- **Vercel**: https://vercel.com/docs (деплой Frontend)
- **HuggingFace Spaces**: https://huggingface.co/docs/hub/spaces (альтернатива)
- **AWS**: https://docs.aws.amazon.com/ (долгосроч. решение)

### Статьи и исследования

1. "Deep Learning for Precipitation Nowcasting: A Benchmark and A New Model" (Shi et al., 2017)
   - Основание для выбора LSTM для прогноза осадков

2. "Attention is All You Need" (Vaswani et al., 2017)
   - Трансформер архитектура

3. "Machine Learning for Weather Forecasting" (обзор 2023)
   - Современный обзор методов ML в метеорологии

---

## Часть 13: Контактная информация

### Команда проекта

| Роль | Имя | Email | GitHub |
|------|-----|-------|--------|
| **Lead Developer** | [Ваше имя] | [ваша почта] | [@yourusername](https://github.com/yourusername) |
| **ML Engineer** | [Имя 2] | [почта 2] | [@username2](https://github.com/username2) |
| **Frontend Dev** | [Имя 3] | [почта 3] | [@username3](https://github.com/username3) |
| **DevOps** | [Имя 4] | [почта 4] | [@username4](https://github.com/username4) |

### Ссылки на проект

**GitHub Repository:**
```
https://github.com/yourusername/ai-meteo
```

**Демо-сайт (Live):**
```
https://ai-meteo.onrender.com/          ← Backend API
https://ai-meteo-frontend.vercel.app/   ← Frontend веб-сайт
```

**Документация:**
```
https://github.com/yourusername/ai-meteo/wiki/
https://ai-meteo-docs.readthedocs.io/   ← (опционально)
```

**Telegram чат команды:**
```
https://t.me/ai_meteo_team
```

### Способы связи для жюри

**Email:** contact@ai-meteo.dev

**Telegram бот для демо:**
```
@AIMeteoBot  ← Отправьте геолокацию и получите прогноз
```

**Видеопрезентация (YouTube):**
```
https://youtube.com/watch?v=... (5-минутное видео-демо)
```

**Pitch Deck (PDF):**
```
https://github.com/yourusername/ai-meteo/blob/main/docs/AI-METEO_PITCH.pdf
```

### Как запустить проект (для жюри)

**Быстрый старт (3 минуты):**
```bash
git clone https://github.com/yourusername/ai-meteo.git
cd ai-meteo
docker-compose up -d
# Откройте http://localhost:5173
```

**Детальная установка (см. Часть 8):**
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

### Лицензия

**MIT License** — свободное использование в образовательных и коммерческих целях

Полный текст: [LICENSE](LICENSE)

---

### Заключение

**AI-Meteo** демонстрирует, как **комбинация IoT, AI и спутниковых данных** может решить практические проблемы граждан и бизнеса.

Проект показывает:
- ✅ **Важность локальных данных** (микроклимат отличается от общегородских прогнозов)
- ✅ **Возможности нейросетей** (LSTM предсказывает осадки с точностью 85%)
- ✅ **Использование космических технологий** (Sentinel спутники для облачности)
- ✅ **Масштабируемое архитектуру** (от 3 датчиков до сетей в других городах)

**Спасибо за внимание!** 🙏

---

**Версия:** 1.0
**Дата последнего обновления:** 26 февраля 2026
**Статус:** Готово к конкурсу AEROO SPACE AI COMPETITION ✅

