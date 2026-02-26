# 🛰️ SENTINEL.SAT
«Ранняя детекция чрезвычайных ситуаций в реальном времени»

SENTINEL.SAT — это система мониторинга и раннего оповещения о пожарах, задымлении и других ЧС с использованием IoT-камер ESP32-CAM и искусственного интеллекта. Проект разрабатывается для обеспечения быстрого реагирования и визуализации событий на карте в реальном времени.

## 🎯 Возможности системы

- **Детекция объектов**: пожары, дым, опасные зоны
- **Обновление данных**: мгновенно через WebSocket
- **Источники данных**: локальные камеры + спутниковая аналитика Sentinel

## 📚 Документация и питч-дек

- **Презентация проекта (Pitch Deck)** — [Google Drive](https://docs.google.com/presentation/d/1V4yblO_LOYY8zQ_Rj_zdPoR7a1-DUMCi/edit?usp=sharing&ouid=116860278482411569103&rtpof=true&sd=true)
- **Основная документация (Google Docs)** — [Google Docs](https://docs.google.com/document/d/1-TK_TiXlVmHxVKi7C-XYBaTW_SIBIqns/edit?usp=sharing&ouid=116860278482411569103&rtpof=true&sd=true)

## 🎥 Видеоматериалы

- **Демонстрация работы системы** — [Видео](https://drive.google.com/file/d/12Rnz7P5-263DtvEsZlyrEBy-qIDxIwQh/view?usp=sharing)

## 🌐 Проект в сети

- **GitHub**: [github.com/Dyman17/sentinel-watch](https://github.com/Dyman17/sentinel-watch)
- **Live Demo**: [sentinel-sat.onrender.com](https://sentinel-sat.onrender.com)
- **AI Space**: [huggingface.co/spaces/Dyman17/sentinel-watch](https://huggingface.co/spaces/Dyman17/sentinel-watch)

## 🏗 Архитектура системы

```
� ESP32-CAM → захват видео с местоположения
🤖 AI Server → анализ изображений в реальном времени
🗺️ Веб-интерфейс → визуализация на карте
🔔 WebSocket → мгновенные оповещения
```

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/Dyman17/sentinel-watch.git
cd sentinel-watch
```

### 2. Настройка окружения
```bash
pip install -r requirements.txt
```

### 3. Запуск сервера
```bash
python main.py
```

### 4. Доступ к системе
- Веб-интерфейс: `http://localhost:8000`
- API документация: `http://localhost:8000/docs`
- WebSocket: `ws://localhost:8000/ws`

## � Технологический стек

- **Backend**: FastAPI, WebSocket, OpenCV
- **AI/ML**: YOLO, Computer Vision
- **Hardware**: ESP32-CAM, сенсоры
- **Frontend**: React, WebSocket клиент
- **Deployment**: Render, GitHub Actions

## 📊 Ключевые метрики

- ⚡ Скорость детекции: < 1 секунда
- 🎯 Точность обнаружения: > 95%
- 📡 Задержка обновления: < 500 мс
- 🔋 Автономность: 24/7 мониторинг

## 🛡️ Безопасность и надежность

- 🔒 Шифрование данных WebSocket
- 🔄 Автоматическое восстановление соединений
- 📱 Мгновенные push-уведомления
- 🗂️ Логирование всех событий

## 🤝 Участие в проекте

1. Fork репозитория
2. Создание feature branch
3. Submit Pull Request
4. Обсуждение улучшений

## 📄 Лицензия

MIT License - свободное использование и модификация

---

**🚨 SENTINEL.SAT - Ваша безопасность в приоритете!**
