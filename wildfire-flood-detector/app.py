import gradio as gr
from ultralytics import YOLO
import cv2
import numpy as np

# Загружаем модель
model = YOLO("best.pt")

# Получаем имена классов
class_names = model.names

def detect(image, conf):
    if image is None:
        return None, "No image uploaded"

    # YOLO ожидает BGR
    image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # Уменьшаем размер изображения до 640x640
    image_bgr = cv2.resize(image_bgr, (640, 640))

    # Инференс
    results = model(image_bgr, conf=conf)

    result = results[0]

    # Подсчет объектов по классам
    counts = {}
    if result.boxes is not None:
        for cls_id in result.boxes.cls:
            cls_name = class_names[int(cls_id)]
            counts[cls_name] = counts.get(cls_name, 0) + 1

    # Рисуем боксы
    annotated = result.plot()

    # Перевод обратно в RGB
    annotated = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)

    # Формируем текст статистики
    if counts:
        stats_text = "\n".join([f"{k}: {v}" for k, v in counts.items()])
    else:
        stats_text = "No objects detected"

    return annotated, stats_text


interface = gr.Interface(
    fn=detect,
    inputs=[
        gr.Image(type="numpy", label="Upload aerial image"),
        gr.Slider(0.1, 0.9, value=0.4, step=0.05, label="Confidence threshold")
    ],
    outputs=[
        gr.Image(type="numpy", label="Detection Result"),
        gr.Textbox(label="Detection Summary")
    ],
    title="🔥 Smoke / Fire / Flood Detector",
    description="Upload aerial image to detect smoke, fire and floods using YOLOv8"
)

if __name__ == "__main__":
    interface.launch()