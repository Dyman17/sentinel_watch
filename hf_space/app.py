import gradio as gr
import requests
import numpy as np
from PIL import Image
import io
import json
import time
import os

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
        
        # Создаем результат детекции (симуляция YOLO модели)
        # В реальном коде здесь будет вызов YOLO модели
        predictions = simulate_yolo_detection(image)
        
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

def simulate_yolo_detection(image):
    """
    Симуляция YOLO детекции (заменить на реальную модель)
    """
    # В реальном коде здесь будет загрузка YOLO модели и детекция
    # Сейчас симулируем результаты для демонстрации
    
    width, height = image.size
    
    # Симуляция детекции (случайные объекты)
    import random
    predictions = []
    
    # Генерируем случайные детекции
    num_objects = random.randint(0, 3)
    
    for i in range(num_objects):
        # Случайный тип объекта
        labels = ["fire", "smoke", "water", "building", "tree", "car", "person"]
        label = random.choice(labels)
        
        # Случайная уверенность
        score = random.uniform(0.5, 0.95)
        
        # Случайные координаты bounding box
        x1 = random.randint(0, width // 2)
        y1 = random.randint(0, height // 2)
        x2 = x1 + random.randint(50, 200)
        y2 = y1 + random.randint(50, 200)
        
        predictions.append({
            'label': label,
            'score': score,
            'box': {'xmin': x1, 'ymin': y1, 'xmax': x2, 'ymax': y2}
        })
    
    return predictions

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

# --- API эндпоинт для внешних запросов ---
@app.post("/api/predict")
async def predict_api(image):
    """
    API эндпоинт для SENTINEL.SAT сервера
    """
    try:
        result_text, processed_image = analyze_image(image)
        
        # Возвращаем JSON результат
        return {
            "status": "success",
            "predictions": simulate_yolo_detection(image),
            "timestamp": time.time(),
            "hf_space": True
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=True
    )
