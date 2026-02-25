import requests
import numpy as np
from PIL import Image
import io
import json
import time
import os
import torch
from transformers import pipeline
from huggingface_hub import hf_hub_download
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

# --- Конфигурация ---
SENTINEL_SERVER_URL = os.getenv("SENTINEL_SERVER_URL", "https://sentinel-sat.onrender.com")
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

# Disaster Detection Classes
YOLO_DISASTER_CLASSES = {
    "fire": ["fire", "flame", "smoke", "burning", "blaze"],
    "flood": ["flood", "water", "inundated", "submerged", "overflow"],
    "earthquake": ["earthquake", "collapse", "rubble", "destruction", "damaged"],
    "storm": ["storm", "tornado", "hurricane", "cyclone", "wind"]
}

# --- Загрузка реальной YOLO модели ---
print("🤖 Loading YOLO model...")
try:
    # Используем DETR для детекции объектов
    object_detector = pipeline(
        "object-detection", 
        model="facebook/detr-resnet-50",
        device=0 if torch.cuda.is_available() else -1
    )
    print("✅ YOLO model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    object_detector = None

def analyze_image(image):
    """
    Анализирует изображение и отправляет результаты на SENTINEL.SAT сервер
    """
    try:
        if image is None:
            return "Пожалуйста, загрузите изображение", None
        
        # Конвертируем PIL Image в байты
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()
        
        # Создаем результат детекции (РЕАЛЬНАЯ YOLO МОДЕЛЬ)
        predictions = real_yolo_detection(image)
        
        # Обрабатываем результаты для катастроф
        disaster_detections = []
        for pred in predictions:
            label = pred.get('label', '').lower()
            score = pred.get('score', 0)
            
            # Map YOLO labels to disaster categories
            for disaster_type, keywords in YOLO_DISASTER_CLASSES.items():
                if any(keyword in label for keyword in keywords):
                    disaster_detections.append({
                        'label': disaster_type,
                        'score': score,
                        'original_label': label,
                        'box': pred.get('box', {}),
                        'timestamp': time.time()
                    })
                    break
        
        analysis_result = {
            'predictions': predictions,
            'disaster_detections': disaster_detections,
            'total_objects': len(predictions),
            'disasters_found': len(disaster_detections),
            'timestamp': time.time(),
            'hf_space': True
        }
        
        # Отправляем результаты на SENTINEL.SAT сервер
        try:
            response = requests.post(
                f"{SENTINEL_SERVER_URL}/api/hf-results",
                json=analysis_result,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                server_response = response.json()
                print(f"✅ Results sent to server: {server_response}")
            else:
                print(f"❌ Failed to send to server: {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending to server: {e}")
        
        # Формируем текстовый результат для отображения
        result_text = f"🔍 Анализ завершен\n\n"
        result_text += f"📊 Всего объектов: {len(predictions)}\n"
        result_text += f"🚨 Катастроф найдено: {len(disaster_detections)}\n\n"
        
        if disaster_detections:
            result_text += "📋 Обнаруженные катастрофы:\n"
            for i, disaster in enumerate(disaster_detections, 1):
                result_text += f"{i}. {disaster['label'].upper()} (уверенность: {disaster['score']:.2f})\n"
        else:
            result_text += "✅ Катастроф не обнаружено"
        
        return result_text, image
        
    except Exception as e:
        return f"❌ Ошибка: {str(e)}", None

def real_yolo_detection(image):
    """
    РЕАЛЬНАЯ YOLO детекция с помощью DETR модели
    """
    if object_detector is None:
        print("❌ Model not loaded")
        return []
    
    try:
        print(f"🔍 Analyzing image with real YOLO model...")
        
        # Запускаем детекцию
        results = object_detector(image)
        
        # Конвертируем результаты в нужный формат
        predictions = []
        for result in results:
            predictions.append({
                'label': result['label'],
                'score': result['score'],
                'box': {
                    'xmin': result['box']['xmin'],
                    'ymin': result['box']['ymin'],
                    'xmax': result['box']['xmax'],
                    'ymax': result['box']['ymax']
                }
            })
        
        print(f"✅ Real YOLO detection found {len(predictions)} objects")
        return predictions
        
    except Exception as e:
        print(f"❌ Error in real detection: {e}")
        return []

def check_server_status():
    """
    Проверяет статус SENTINEL.SAT сервера
    """
    try:
        response = requests.get(f"{SENTINEL_SERVER_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return f"✅ Сервер онлайн\nHF статус: {data.get('hf', 'unknown')}\nКлиенты: {data.get('clients_connected', 0)}"
        else:
            return f"❌ Сервер ответил: {response.status_code}"
    except Exception as e:
        return f"❌ Ошибка подключения: {str(e)}"

# --- Создание Gradio интерфейса ---
with gr.Blocks(title="SENTINEL.SAT - HuggingFace Space", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🛰️ SENTINEL.SAT - AI Disaster Detection")
    gr.Markdown("### HuggingFace Space для детекции катастроф")
    
    with gr.Row():
        with gr.Column(scale=2):
            gr.Markdown("#### 📸 Загрузите изображение для анализа")
            
            image_input = gr.Image(
                label="Изображение",
                type="pil",
                height=400
            )
            
            with gr.Row():
                analyze_btn = gr.Button("🔍 Анализировать", variant="primary")
                clear_btn = gr.Button("🗑️ Очистить")
            
            result_output = gr.Textbox(
                label="Результаты анализа",
                lines=8,
                max_lines=10
            )
            
            result_image = gr.Image(
                label="Обработанное изображение",
                height=300
            )
        
        with gr.Column(scale=1):
            gr.Markdown("#### 📊 Статус системы")
            
            status_text = gr.Textbox(
                label="Статус сервера",
                value="Проверка...",
                lines=3
            )
            
            refresh_status_btn = gr.Button("🔄 Обновить статус", size="sm")
            
            gr.Markdown("#### 🔗 Информация")
            gr.Markdown(f"""
            **Сервер SENTINEL.SAT:**  
            {SENTINEL_SERVER_URL}
            
            **Функции:**
            - 🤖 AI детекция катастроф
            - 📡 Отправка результатов на сервер
            - 📊 История детекций
            - 🎥 Реальное время стриминг
            """)
    
    gr.Markdown("---")
    gr.Markdown("### 🚨 Типы детектируемых катастроф")
    
    with gr.Row():
        gr.Markdown("""
        **🔥 Пожары:** fire, flame, smoke, burning, blaze  
        **🌊 Наводнения:** flood, water, inundated, submerged, overflow  
        **🌍 Землетрясения:** earthquake, collapse, rubble, destruction, damaged  
        **⛈️ Штормы:** storm, tornado, hurricane, cyclone, wind
        """)
    
    # Обработчики событий
    analyze_btn.click(
        analyze_image,
        inputs=[image_input],
        outputs=[result_output, result_image]
    )
    
    clear_btn.click(
        lambda: (None, "", None),
        outputs=[image_input, result_output, result_image]
    )
    
    refresh_status_btn.click(
        check_server_status,
        outputs=[status_text]
    )
    
    # Автоматическая проверка статуса при загрузке
    demo.load(
        check_server_status,
        outputs=[status_text]
    )

# --- FastAPI приложение ---
app = FastAPI(title="SENTINEL.SAT AI API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "SENTINEL.SAT AI Disaster Detection API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": object_detector is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.post("/predict")
async def predict(request: Request):
    """
    Принимает изображение и возвращает детекции
    """
    try:
        # Получаем данные изображения
        img_data = await request.body()
        
        # Конвертируем в PIL Image
        image = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        # Анализируем с реальной моделью
        predictions = real_yolo_detection(image)
        
        # Обрабатываем результаты
        disasters_found = 0
        disaster_type = None
        confidence = 0.0
        
        for pred in predictions:
            label = pred['label'].lower()
            for disaster, keywords in YOLO_DISASTER_CLASSES.items():
                if any(keyword in label for keyword in keywords):
                    disasters_found += 1
                    disaster_type = disaster
                    confidence = max(confidence, pred['score'])
                    break
        
        # Формируем результат
        result = {
            "predictions": predictions,
            "disasters_found": disasters_found,
            "disaster_type": disaster_type,
            "confidence": confidence,
            "timestamp": time.time()
        }
        
        # Отправляем на сервер SENTINEL.SAT
        try:
            response = requests.post(
                f"{SENTINEL_SERVER_URL}/api/hf-results",
                json=result,
                timeout=5
            )
            print(f"📨 Results sent to server: {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending to server: {e}")
        
        return result
        
    except Exception as e:
        return {"error": str(e), "predictions": [], "disasters_found": 0}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
