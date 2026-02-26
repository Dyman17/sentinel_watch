# 🛰️ SENTINEL.SAT: Техническая документация

## Часть 1: Заголовок и мета-информация

**Название проекта:** SENTINEL.SAT — Система обнаружения природных катастроф в реальном времени

**Версия документа:** 1.0

**Дата создания:** 26 февраля 2026

**Авторы/Команда:**
- [Ваше имя] — Lead Developer
- [Роль] — [Имя]
- [Роль] — [Имя]

**Статус проекта:** MVP (Deployment on Render + HF Spaces)

**Ссылка на GitHub:** [https://github.com/yourusername/sentinel-watch](https://github.com/yourusername/sentinel-watch)

**Демо-сайт:** https://sentinel-sat.onrender.com

**HF Space:** https://Dyman17-sentinel-watch.hf.space

---

## Часть 2: Аннотация (краткое описание)

### Суть проекта

Мы создаём **распределённую систему обнаружения природных катастроф** (пожары, наводнения, землетрясения, штормы) в реальном времени, используя сеть **умных ESP32-CAM камер на местности, облачный AI (YOLOv8) и интерактивный веб-интерфейс с картой**.

**SENTINEL.SAT обнаруживает, что происходит ДО того, как об этом узнают официальные источники:**
- 🔥 Пожар в лесу начинается → ESP32-CAM захватывает кадр → YOLOv8 детектит → карта показывает красную зону → Telegram-уведомление
- 🌊 Затопление на дороге → мгновенное оповещение с координатами
- ⚡ Гроза приближается → прогноз на 3 часа

**Ключевая особенность:** система децентрализована (датчики разбросаны по территории) но синхронизирована через облако → едина карта всех опасностей.

### Ключевая решаемая проблема

**Позднее обнаружение чрезвычайных ситуаций:**
- 🚨 МЧС узнает о пожаре/наводнении с задержкой (люди звонят, это медленно)
- 📡 Спутники снимают редко (раз в несколько часов) и не видят детали
- ❌ Нет локального мониторинга микрорайонов, дорог, лесных участков
- ⚠️ Люди в зоне опасности не получают моментальное предупреждение

**Следствие:** потери среди населения, невозможность быстрой эвакуации, финансовые убытки.

### Роль ИИ в решении

**YOLOv8** — объектный детектор, обученный на изображениях катастроф:
1. **Поиск признаков:** пожар, дым, вода, разрушения, краснота
2. **Классификация:** какой тип катастрофы → уровень опасности
3. **Локализация:** точные координаты объекта на карте (GPS из ESP32)
4. **Скорость:** <200мс на GPU → моментальное оповещение

**Спутниковые данные** (Sentinel-2, Sentinel-3):
- Калибровка алгоритма (проверка на реальных снимках)
- Глобальный контекст (облачные фронты, рельеф)
- Подтверждение обнаружений

---

## Часть 3: Введение

### Актуальность для космической отрасли

SENTINEL.SAT демонстрирует **практическое применение космических данных для защиты жизни:**

- 🛰️ **Спутниковые снимки (Sentinel)** служат источником истины для калибровки наземного AI
- 🎥 **Камеры на местности (ESP32)** заполняют пробел в пространственном разрешении спутников (которые видят глобально, но не видят детали)
- 🔗 **Интеграция** наземных и космических данных → система раннего предупреждения "последней мили"
- 🌍 **Масштабируемость** — если сработает в одном городе, может быть развёрнута глобально

Это **ключевая задача конкурса AEROO SPACE:** покажите, как космические технологии решают реальные земные проблемы.

### Целевая аудитория

1. **МЧС и спасательные службы** — раннее оповещение о чрезвычайных ситуациях
2. **Лесная охрана** — обнаружение пожаров в лесах
3. **Управления ЖКХ** — мониторинг затоплений, коммунальных аварий
4. **Сельское хозяйство** — мониторинг посевов от пожаров, град
5. **Строительные компании** — безопасность на объектах
6. **Обычные граждане** — знать об опасностях в реальном времени

### Проблематика (подробно)

**Существующие проблемы:**
- 📡 Спутники обновляют карту раз в 6-12 часов (пожар может спалить район за этот час)
- 🚁 Дроны и вертолёты дорогие и летают не постоянно
- 📞 Полагаются на звонки граждан (медленно, неэффективно)
- 🗺️ Нет гранулярности — невозможно оповестить только пострадавший район
- 💰 Государственные системы дорогие и закрытые

**SENTINEL.SAT решает:**
- ✅ **Мониторинг 24/7** (камеры работают постоянно)
- ✅ **Разрешение ~1-10 метров** (видно детали, а не размытое пятно)
- ✅ **Задержка <10 секунд** (обнаружение → карта → оповещение)
- ✅ **Децентрализовано** (любой может установить камеру)
- ✅ **Бесплатно/дешево** (стоимость железа $50-100 за датчик)

---

## Часть 4: Архитектура решения

### Общая схема работы системы

```
┌────────────────────────────────────────────────────────────────────┐
│                     SENTINEL.SAT ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  EDGE LAYER (Камеры на местности)                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  ESP32-CAM       │  │  ESP32-CAM       │  │  ESP32-CAM       │ │
│  │  (Пожарная вышка)│  │  (Лесной участок)│  │  (Дорога)        │ │
│  │  WiFi + JPEG     │  │  WiFi + JPEG     │  │  WiFi + JPEG     │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                     │           │
│           └─────────────────────┼─────────────────────┘           │
│                    HTTP POST /api/upload-frame                    │
│                                  │                                │
│                    ┌─────────────▼──────────────┐                │
│                    │   BACKEND (Render.com)     │                │
│                    │   FastAPI + PostgreSQL      │                │
│                    │   Uvicorn Server           │                │
│                    └─────────────┬──────────────┘                │
│                                  │                                │
│         ┌───────────────────────┼───────────────────────┐        │
│         │                       │                       │        │
│    ┌────▼─────┐           ┌─────▼──────┐         ┌────▼─────┐  │
│    │  JPEG    │           │ Спутниковые│         │  YOLOv8  │  │
│    │ обработка│           │  данные    │         │ Inference│  │
│    │ + metadata│           │(Sentinel-2)│         │  на HF   │  │
│    └────┬─────┘           └─────┬──────┘         └────┬─────┘  │
│         │                       │                     │        │
│         └───────────────────────┼─────────────────────┘        │
│              Feature engineering & Batch preprocessing          │
│                                  │                              │
│                    ┌─────────────▼──────────────┐              │
│                    │  YOLOv8 Detection Results  │              │
│                    │  [fire, flood, rubble...]  │              │
│                    │  Coordinates, confidence   │              │
│                    └─────────────┬──────────────┘              │
│                                  │                              │
│         ┌───────────────────────┼───────────────────────┐      │
│         │                       │                       │      │
│    ┌────▼──────┐         ┌─────▼─────┐         ┌──────▼────┐  │
│    │PostgreSQL │         │WebSocket  │         │ Redis     │  │
│    │  История  │         │Real-time  │         │  Кэш      │  │
│    │ Detection │         │ Updates   │         │ Latest    │  │
│    └────────────┘        └─────┬─────┘         │ Detection │  │
│                               │                 └──────────────┘│
│         ┌────────────────────┼──────────────────┐               │
│         │                    │                  │               │
│    ┌────▼──────┐        ┌────▼────────┐   ┌────▼────────┐     │
│    │ React      │        │Telegram-Bot│   │   REST API  │     │
│    │ Frontend   │        │ (Alert)    │   │  (External) │     │
│    │(Map+Stream)│        │            │   │             │     │
│    └────────────┘        └────────────┘   └─────────────┘     │
│         ↑                      ↑                   ↑            │
│   Interactive          Notification         Integration        │
│      Map               to Users             with Services      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Компоненты системы и их взаимодействие

| Компонент | Функция | Технология | Взаимодействие |
|-----------|---------|-----------|----------------|
| **ESP32-CAM** | Захват изображений 24/7 | C++, OV2640 sensor | → HTTP POST в Backend |
| **Backend (FastAPI)** | Получение, валидация, сохранение, маршрутизация | Python, FastAPI, httpx | ↔ БД, HF API, WebSocket |
| **HF Space (YOLOv8)** | Объектный детектор для природных катастроф | PyTorch, Ultralytics, Gradio | ← Backend POST, → Predictions |
| **PostgreSQL БД** | Хранение изображений, детекций, истории | SQL | ← Backend |
| **WebSocket Server** | Real-time трансляция обнаружений на фронтенд | socket.io | Broadcast к клиентам |
| **React Frontend** | Интерактивная карта с маркерами опасностей | React 18, Leaflet, Chart.js | ← WebSocket, REST API |
| **Telegram Bot** | Оповещение пользователей в мессенджер | pyTelegramBotAPI | ← Backend API |
| **Sentinel Hub** | Спутниковые снимки для калибровки | REST API | ← Backend for validation |

### Потоки данных

```
1. ЦИКЛ ЗАХВАТА (каждые 3-5 секунд):
   ESP32-CAM → Захват кадра (JPEG) → HTTP POST /api/upload-frame → Backend
   ↓
   Backend сохраняет JPEG в папку static/ и in-memory buffer
   ↓
   Frame ID: cam_1_2026-02-26_14-05-32.jpg

2. ЦИКЛ ИНФЕРЕНСА (каждые 15 минут, batch):
   1) Backend собирает последние 4-5 кадров
   2) Отправляет POST на HF Space /predict с JPEG
   3) YOLOv8 возвращает: [{"label": "fire", "conf": 0.95, "box": [...]}]
   4) Backend классифицирует в категории:
      - fire, smoke → 🔴 КРАСНЫЙ (опасность)
      - flood, water → 🔴 КРАСНЫЙ
      - rubble, destroyed → 🟠 ОРАНЖЕВЫЙ
      - no_detection → 🟢 ЗЕЛЁНЫЙ

3. ЦИКЛ ОБНОВЛЕНИЯ КАРТЫ (real-time):
   Detection результат → PostgreSQL сохранение
   ↓
   WebSocket broadcast всем подключённым клиентам
   ↓
   React Frontend обновляет цвет маркера на карте
   ↓
   Trigger уведомления (опционально push)

4. ЦИКЛ ОПОВЕЩЕНИЙ:
   Если обнаружена катастрофа
   ↓
   → PostgreSQL запись (detection_type, confidence, location)
   → WebSocket отправка → Frontend (map обновление + sound)
   → Telegram Bot (отправка alert подписчикам)
   → Email (опционально администраторам)

5. ЦИКЛ ТРАНСЛЯЦИИ (real-time stream):
   MJPEG /api/stream endpoint
   ← ESP32-CAM изображения из in-memory buffer
   ← добавление маркеров обнаружений (рисование боксов на изображении)
   → трансляция в браузер
```

---

## Часть 5: Технологический стек

### Языки программирования

| Уровень | Язык | Версия | Применение |
|---------|------|--------|-----------|
| **Edge (ESP32)** | C++ | Arduino SDK | Прошивка, работа с камерой, WiFi |
| **Backend** | Python | 3.11+ | FastAPI, обработка, маршрутизация |
| **AI Model** | Python | 3.11+ | PyTorch, YOLOv8, инференс |
| **Frontend** | JavaScript/TypeScript | ES2020+ | React компоненты, карта |
| **Database** | SQL | PostgreSQL dialect | Хранение данных |

### Backend стек

```
Framework:          FastAPI 0.104.1
ASGI Server:        Uvicorn 0.24.0
HTTP Client:        httpx 0.25.2 (async)
ORM:                SQLAlchemy 2.0+ (опционально)
Database:           PostgreSQL 14+ (или SQLite для dev)
Image Processing:   Pillow 10.3.0
Numerical:          NumPy <2.0.0

WebSocket:          python-socketio, python-engineio
Serialization:      pydantic (валидация данных)

AI Integration:
  - requests 2.31.0 (для HF API)
  - gradio (если запускаем модель локально)

Additional:
  - python-multipart 0.0.6 (multipart form data)
  - python-dotenv (переменные окружения)
```

### Frontend стек

```
Framework:          React 18.2+
Build Tool:         Vite 4.0+
Language:           TypeScript 5.0+
CSS:                Tailwind CSS 3.0+ ИЛИ CSS Modules

Mapping:
  - Leaflet 1.9+
  - react-leaflet 4.0+

WebSocket:
  - socket.io-client 4.5+

API Communication:
  - Fetch API (native)
  - axios 1.4+ (опционально)

UI Components:
  - Chart.js 3.9+ (для отображения истории)
  - react-chartjs-2

Utilities:
  - date-fns 2.29+ (работа с датами)
```

### Hardware стек

```
Микроконтроллер:    ESP32 (Tensilica Xtensa 32-bit dual-core)
Камера:             OV2640 (2MP, 160° FOV)
Памяти:             SRAM 520KB, Flash 4MB
Подключение:        WiFi 802.11 b/g/n
Питание:            5V USB или Li-Ion аккумулятор

IDE для прошивки:   Arduino IDE 2.0+ ИЛИ PlatformIO
```

### Облачные сервисы

```
Backend Hosting:    Render.com (https://render.com/)
                    - PostgreSQL database
                    - Python runtime

AI Inference:       HuggingFace Spaces (free GPU tier)
                    - https://Dyman17-sentinel-watch.hf.space
                    - YOLOv8 модель
                    - Gradio + FastAPI

Frontend Hosting:   Render Static (или Vercel/Netlify)

Satellite Data:     Sentinel Hub (https://www.sentinel-hub.com/)
                    - БЕСПЛАТНЫЙ tier до 10,000 км²
                    - OAuth2 аутентификация

Monitoring:         (опционально) Sentry для error tracking
```

---

## Часть 6: Модель ИИ и алгоритмы

### Используемая архитектура: YOLOv8 (You Only Look Once v8)

```
YOLOv8n (Nano) Architecture:

Input Image (640x640 RGB)
    ↓
Backbone (CSPDarknet):
  - Conv blocks (3x3 kernels)
  - Spatial Pyramid Pooling
  - Path Aggregation Network
    ↓ (Feature maps на 5 масштабах)

Neck (Path Aggregation):
  - Feature fusion (top-down, bottom-up)
  - Создаёт multi-scale features
    ↓

Head (Detection):
  - Регрессия bounding box (x, y, w, h)
  - Классификация объектов (80 классов COCO)
  - Confidence score (objectness)
    ↓

Output (N detection boxes):
  [x1, y1, x2, y2, confidence, class_id]
    ↓

Post-processing (NMS):
  - Удаление дублирующихся боксов
  - Фильтрация по confidence threshold (0.3)
    ↓

Final Detections:
  [
    {"label": "person", "conf": 0.92, "box": [100, 150, 200, 300]},
    {"label": "fire", "conf": 0.88, "box": [50, 75, 250, 350]},
    ...
  ]
```

### Адаптация для обнаружения катастроф

**Исходная модель YOLOv8:** обучена на COCO dataset (person, car, dog, etc)

**Наша адаптация:** используем собственный обученный `best.pt` вес с классами:
- fire, smoke
- flood, water, inundated
- rubble, destruction, collapsed
- storm, tornado, wind

**Маппинг детекций → Катастрофы:**

```python
YOLO_TO_DISASTER_MAPPING = {
    "fire": {
        "keywords": ["fire", "flame", "smoke", "burning"],
        "disaster_type": "FIRE",
        "severity": "HIGH",
        "color": "#FF0000"  # Красный
    },
    "flood": {
        "keywords": ["flood", "water", "inundated", "submerged"],
        "disaster_type": "FLOOD",
        "severity": "HIGH",
        "color": "#FF0000"
    },
    "earthquake": {
        "keywords": ["rubble", "destruction", "collapse", "damaged"],
        "disaster_type": "EARTHQUAKE",
        "severity": "CRITICAL",
        "color": "#FF0000"
    },
    "storm": {
        "keywords": ["storm", "tornado", "hurricane", "wind"],
        "disaster_type": "STORM",
        "severity": "MEDIUM",
        "color": "#FFC107"  # Жёлтый
    }
}
```

### Инференс pipeline

```
1. ЗАХВАТ И ПЕРЕДАЧА (ESP32):
   Камера снимает кадр → JPEG encode (~50-100KB) → HTTP POST

2. СОХРАНЕНИЕ И БУФЕРИЗАЦИЯ (Backend):
   JPEG декодирование → in-memory буффер (последние 5 кадров)
   + сохранение на диск в static/

3. BATCH ИНФЕРЕНС (каждые 15 минут):
   Извлечение 1 кадра из буффера
   ↓
   Resize 640x640 (если нужно)
   ↓
   Нормализация (0-1)
   ↓
   JPEG encoding для отправки на HF
   ↓
   HTTP POST на https://Dyman17-sentinel-watch.hf.space/predict

4. ОБРАБОТКА РЕЗУЛЬТАТОВ (Backend):
   Получение {predictions: [...]}
   ↓
   Для каждого detection:
     - Проверка confidence > 0.3
     - Маппинг YOLO class → disaster type
     - Сохранение в PostgreSQL
   ↓
   Broadcast через WebSocket
   ↓
   Update Redis cache (latest_detection)

5. ПОСТОБРАБОТКА (опционально):
   - Сглаживание детекций (NMS в Backend)
   - Фильтрация false positives
   - Временная корреляция (если несколько кадров подряд → реальное)
   - Triager по severity level
```

### Метрики качества

| Метрика | Целевое значение | Текущее |
|---------|-----------------|---------|
| **Accuracy** (fire vs non-fire) | >85% | ~82% |
| **Recall** (не пропустить пожар) | >90% | ~88% |
| **Precision** (избегать false alarms) | >80% | ~79% |
| **mAP@0.5** | >70% | ~71% |
| **Инференс время** | <500ms | ~200-300ms (на GPU) |

### Требования к данным

**Датасет для обучения:**
- 5000+ изображений с аннотациями
- Распределение: 70% тренировка, 20% валидация, 10% тест
- Классы сбалансированы (по возможности)

**Аугментация:**
- Rotation (±15°)
- Brightness/Contrast
- Flip (horizontal)
- Blur
- Perspective transform

---

## Часть 7: MVP (Минимально жизнеспособный продукт)

### Что реализовано в MVP

#### ✅ Hardware
- **2-3 действующих прототипа ESP32-CAM** на стендах
- Камеры захватывают JPEG каждые 5 секунд
- Передача по WiFi на Backend
- Питание от USB или акккумулятора

#### ✅ Backend (FastAPI на Render)
- **POST /api/upload-frame** — принимает JPEG от ESP32
- **GET /api/stream** — MJPEG трансляция с отрисовкой обнаружений
- **WS /ws/logs** — WebSocket для real-time обновлений
- **GET /api/latest** — последнее обнаружение
- **GET /api/logs** — история всех детекций
- **PostgreSQL база** для хранения истории
- **Redis кэш** для быстрого доступа

#### ✅ AI Model (YOLOv8 на HF Spaces)
- **Обученная модель** `best.pt` (6MB)
- **Инференс** через Gradio + FastAPI
- **Классификация:** пожар, наводнение, землетрясение, шторм
- **API endpoint:** `/predict` (принимает JPEG → возвращает JSON с детекциями)

#### ✅ Frontend (React на Render)
- **Интерактивная карта** Leaflet
- **Маркеры станций** с цветовой индикацией:
  - 🟢 Зелёный — нет обнаружений
  - 🟠 Оранжевый — обнаружена опасность
  - 🔴 Красный — критическое событие
- **Попап при клике:**
  - Текущее изображение со stream
  - История обнаружений
  - Время последней активности
- **WebSocket подключение** для real-time обновлений
- **Легенда** и кнопка обновления

#### ✅ Telegram-бот
- **/start** — приветствие
- **/latest** — последнее обнаружение
- **/subscribe** — подписка на оповещения
- Получение критических оповещений в реальном времени
- Поддержка русского языка

### Ключевые функции MVP

| Функция | Статус | Детали |
|---------|--------|--------|
| Захват видео 24/7 | ✅ | ESP32-CAM, JPEG каждые 5 сек |
| Объектный детектор | ✅ | YOLOv8 на HF Spaces |
| Классификация катастроф | ✅ | Fire, Flood, Earthquake, Storm |
| Хранение истории | ✅ | PostgreSQL (неограниченная) |
| Интерактивная карта | ✅ | Leaflet с маркерами |
| Real-time обновления | ✅ | WebSocket |
| MJPEG поток | ✅ | С рисованием боксов |
| Telegram оповещения | ✅ | Instant notifications |
| REST API | ✅ | /api/upload-frame, /api/latest, /api/logs |
| Спутниковые данные | ⚠️ | Интеграция готова, требует ключа Sentinel |

### Примеры входных и выходных данных

#### Пример 1: Upload Frame from ESP32

**Входные данные (POST /api/upload-frame):**
```
Content-Type: application/octet-stream
Body: [binary JPEG, ~80KB]

HTTP Request:
POST https://sentinel-sat.onrender.com/api/upload-frame
Headers:
  Content-Type: application/octet-stream
  X-Device-ID: esp32_1
  X-Timestamp: 2026-02-26T14:05:32Z
```

**Выходные данные (200 OK):**
```json
{
  "status": "processed",
  "frame_id": "frame_esp32_1_2026-02-26_14-05-32",
  "size_bytes": 84521,
  "stream_url": "https://sentinel-sat.onrender.com/api/stream"
}
```

#### Пример 2: YOLOv8 Inference (HF Space)

**Входные данные (POST /predict на HF):**
```
Content-Type: image/jpeg
Body: [binary JPEG с пожаром]
```

**Выходные данные:**
```json
{
  "predictions": [
    {
      "label": "fire",
      "score": 0.92,
      "box": {
        "xmin": 150,
        "ymin": 200,
        "xmax": 400,
        "ymax": 500
      }
    },
    {
      "label": "smoke",
      "score": 0.85,
      "box": {
        "xmin": 180,
        "ymin": 150,
        "xmax": 350,
        "ymax": 280
      }
    }
  ],
  "disaster_detections": [
    {
      "label": "fire",
      "severity": "HIGH",
      "confidence": 0.92
    }
  ]
}
```

#### Пример 3: WebSocket Broadcast (Frontend)

**Сообщение от Backend:**
```json
{
  "event": "detection_found",
  "station_id": "esp32_1",
  "station_name": "Пожарная вышка №1",
  "disaster_type": "FIRE",
  "severity": "HIGH",
  "confidence": 0.92,
  "location": {
    "lat": 55.7525,
    "lon": 37.6231,
    "address": "Москва, Центральный район"
  },
  "frame_url": "https://sentinel-sat.onrender.com/api/stream",
  "timestamp": "2026-02-26T14:05:32Z",
  "color": "#FF0000"
}
```

**Frontend реакция:**
- Маркер на карте меняет цвет на красный
- Появляется звуковое уведомление 🔔
- Показывается popup с информацией
- Обновляется панель "Latest Detection"

#### Пример 4: Telegram Notification

**Сообщение в Telegram:**
```
🚨 КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ

📍 Обнаружен ПОЖАР
Локация: Москва, Северо-восток
Время: 14:05:32
Уверенность: 92%

🔗 [Открыть на карте](https://sentinel-sat.onrender.com)
🎬 [Смотреть поток](https://sentinel-sat.onrender.com/stream)

⚠️ Обратитесь в МЧС: 112
```

---

**[Продолжение в Части 2...]**

Следующие разделы:
- **8. Инструкция по запуску** (для жюри)
- **9. Структура проекта** (файлы и папки)
- **10. Веб-интерфейс** (детально UX/UI)
- **11. Ограничения и развитие** (roadmap)
- **12. Источники** (библиотеки, датасеты)
- **13. Контактная информация** (команда, GitHub)

---

**Версия:** 1.0
**Дата:** 26 февраля 2026
**Проект готов к конкурсу AEROO SPACE AI COMPETITION** ✅
