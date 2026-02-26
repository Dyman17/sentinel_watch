# 🛰️ SENTINEL.SAT

**«Ранняя детекция чрезвычайных ситуаций в реальном времени»**

SENTINEL.SAT — система мониторинга пожаров и ЧС с использованием ESP32-CAM и AI.

## 🎯 Возможности

- **Детекция**: пожары, дым, опасные зоны
- **Реальное время**: WebSocket обновления
- **Источники**: локальные камеры + спутниковая аналитика

## 🏗 Архитектура

```
📷 ESP32-CAM → FastAPI Backend → HuggingFace AI → React Frontend
```

## 🚀 Быстрый старт

### 1. Запуск бэкенда
```bash
cd backend && pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Запуск фронтенда
```bash
cd frontend && npm install && npm run dev
```

### 3. Прошивка ESP32-CAM
- Настройте Wi-Fi в `esp32_example/esp32cam.ino`
- Прошейте устройство

## 📁 Структура

```
├── backend/          # FastAPI сервер
├── frontend/         # React приложение  
├── hf_space/         # HuggingFace AI
├── esp32_example/    # Прошивки ESP32
└── Dockerfile        # Мульти-стейдж билд
```

## 📊 API

- `POST /api/upload-frame` - кадры с ESP32
- `POST /api/upload` - ручная загрузка
- `GET /api/latest` - последние детекции
- `WS /ws/logs` - реальное время

## 🌐 Ссылки

- **GitHub**: [github.com/Dyman17/sentinel-watch](https://github.com/Dyman17/sentinel-watch)
- **Live Demo**: [sentinel-sat.onrender.com](https://sentinel-sat.onrender.com)
- **AI Space**: [huggingface.co/spaces/Dyman17/sentinel-watch](https://huggingface.co/spaces/Dyman17/sentinel-watch)
- **Презентация**: [Google Slides](https://docs.google.com/presentation/d/1FCL2t7_7N6AEPTfaFdzLETOuuKQb_Nk-/edit?usp=sharing&ouid=116860278482411569103&rtpof=true&sd=true)
- **Видео**: [Google Drive](https://drive.google.com/file/d/1wsEiyUkcTQV7qe8eySsrQcF3eUTUwkTe/view?usp=sharing)
- **Документация**: [Google Docs](https://drive.google.com/file/d/12-Y89PafHf988pY-XUgSG19HoaUnw4R5/view?usp=sharing)

---

<div align="center">

**🛰️ SENTINEL.SAT - Защитим будущее вместе!**

[![Website](https://img.shields.io/badge/🌐-Website-success?style=flat-square)](https://sentinel-sat.onrender.com)
[![GitHub](https://img.shields.io/badge/📦-GitHub-black?style=flat-square)](https://github.com/Dyman17/sentinel-watch)

</div>
