# 🔄 HuggingFace Space Reset Guide

## 🗑️ Удаление старого Space

### 1. Зайди на HuggingFace
- Перейди на https://huggingface.co/spaces/Dyman17/sentinel-watch
- Нажми "Settings" (шестеренка справа)
- Прокрути вниз до "Danger zone"
- Нажми "Delete this space"
- Подтверди удаление

## 🆕 Создание нового Space

### 1. Создай новый Space
- Перейди на https://huggingface.co/spaces
- Нажми "Create new Space"
- Выбери "Gradio" SDK
- Назови `sentinel-watch`
- Выбери "Public" или "Private" (как хочешь)
- Нажми "Create Space"

### 2. Настройка переменных окружения
- В созданном Space перейди в "Settings"
- Нажми "Variables and secrets"
- Добавь переменные:
  ```
  SENTINEL_SERVER_URL=https://sentinel-sat.onrender.com
  HF_API_TOKEN=hf_xxxxxxxxxxxxxx
  ```
- Нажми "Save"

## 📁 Загрузка файлов

### Способ 1: Через веб-интерфейс (рекомендуется)
1. В созданном Space нажми "Files"
2. Нажми "Upload files"
3. Загрузи файлы из папки `hf_space/`:
   - `app.py`
   - `requirements.txt`
   - `README.md`
   - `Dockerfile`

### Способ 2: Через Git (если настроен)
```bash
# Клонируй новый Space
git clone https://huggingface.co/spaces/Dyman17/sentinel-watch
cd sentinel-watch

# Копируй файлы
cp ../hf_space/* .

# Загрузи
git add .
git commit -m "🚀 Initial SENTINEL.SAT integration"
git push
```

## ✅ Проверка работы

### 1. Жди сборки (2-3 минуты)
- Space автоматически соберется
- Следи за логами сборки

### 2. Проверь интерфейс
- Открой https://huggingface.co/spaces/Dyman17/sentinel-watch
- Должен появиться Gradio интерфейс

### 3. Проверь API
```python
# Тест API эндпоинта
import requests

response = requests.post(
    "https://dyman17-sentinel-watch.hf.space/api/predict",
    files={"data": ("test.jpg", open("test.jpg", "rb"), "image/jpeg")}
)
print(response.json())
```

### 4. Проверь интеграцию
- В интерфейсе загрузи изображение
- Проверь что результаты отправляются на SENTINEL.SAT сервер

## 🔗 Интеграция с SENTINEL.SAT

### Что делает новый Space:
- ✅ **Принимает изображения** через Gradio
- ✅ **Анализирует** с помощью AI модели
- ✅ **Отправляет результаты** на Render сервер
- ✅ **Возвращает JSON** с детекциями

### API эндпоинты:
```
POST /api/predict
Content-Type: multipart/form-data
Files: image_file
```

### Ответ сервера:
```json
{
  "status": "success",
  "predictions": [...],
  "disasters_found": 1,
  "timestamp": 1672531200.123
}
```

## 🚀 Преимущества нового Space

- ✅ **Чистый код** - без старых ошибок
- ✅ **Правильная интеграция** с SENTINEL.SAT
- ✅ **Актуальные зависимости** - свежие версии библиотек
- ✅ **Полная документация** - README с инструкциями
- ✅ **Docker поддержка** - для продакшена

## 📊 Ожидаемый результат

После настройки Space будет:
1. **Принимать** изображения от пользователей
2. **Анализировать** их на катастрофы
3. **Отправлять** результаты на твой сервер
4. **Показывать** результаты в интерфейсе

## 🎯 Следующие шаги

1. **Удали старый Space**
2. **Создай новый Space**
3. **Загрузи файлы**
4. **Настрой переменные**
5. **Протестируй интеграцию**
6. **Подключи ESP32** к системе

---

**🛰️ SENTINEL.SAT готов к новому развертыванию!**  
*Чистый HF Space + правильная интеграция = стабильная работа*
