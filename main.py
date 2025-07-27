from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from ultralytics import YOLO
from PIL import Image, ImageDraw
from deepface import DeepFace
import numpy as np
import io
import cv2
from datetime import datetime, timezone
import os

app = FastAPI(title="YOLO People Detection API", version="1.0.0")

# Inicializar modelo como None, será carregado no primeiro uso
model = None

# Tempo de início do deploy (quando o app inicia)
DEPLOY_START_TIME = datetime.now(timezone.utc)


@app.on_event("startup")
async def startup_event():
    """Startup rápido - modelos serão carregados sob demanda"""
    print("🚀 API iniciando...")
    print("🎯 API pronta para receber requests!")


def get_model():
    """Carrega o modelo YOLO de forma lazy"""
    global model
    if model is None:
        # Usa yolov8n.pt que é mais estável
        model = YOLO("yolov8n.pt")
    return model


def analyze_faces_deepface(image):
    """Analisa faces com DeepFace e retorna estatísticas agregadas"""
    try:
        # Converter PIL para numpy array
        img_array = np.array(image)

        # Analisar todas as faces na imagem
        results = DeepFace.analyze(
            img_path=img_array,
            actions=["age", "gender", "race", "emotion"],
            enforce_detection=False,
        )

        # Se não é lista, transformar em lista
        if not isinstance(results, list):
            results = [results]

        # Inicializar contadores
        gender_counts = {"Woman": 0, "Man": 0}
        race_counts = {
            "asian": 0,
            "indian": 0,
            "black": 0,
            "white": 0,
            "middle eastern": 0,
            "latino hispanic": 0,
        }
        emotion_counts = {
            "angry": 0,
            "disgust": 0,
            "fear": 0,
            "happy": 0,
            "sad": 0,
            "surprise": 0,
            "neutral": 0,
        }
        ages = []

        # Processar cada face detectada
        for face in results:
            # Gênero
            dominant_gender = face["dominant_gender"]
            if dominant_gender in gender_counts:
                gender_counts[dominant_gender] += 1

            # Raça
            dominant_race = face["dominant_race"]
            if dominant_race in race_counts:
                race_counts[dominant_race] += 1

            # Emoção
            dominant_emotion = face["dominant_emotion"]
            if dominant_emotion in emotion_counts:
                emotion_counts[dominant_emotion] += 1

            # Idade
            ages.append(int(face["age"]))

        # Calcular estatísticas de idade
        age_stats = {}
        if ages:
            age_stats = {
                "max": max(ages),
                "min": min(ages),
                "average": round(sum(ages) / len(ages)),
            }

        total_faces = len(results)

        return {
            "gender": gender_counts,
            "race": race_counts,
            "emotion": emotion_counts,
            "men": gender_counts["Man"],
            "women": gender_counts["Woman"],
            "total": total_faces,
            "age": age_stats,
        }

    except Exception as e:
        # Se DeepFace falhar, retornar estrutura vazia
        return {
            "gender": {"Woman": 0, "Man": 0},
            "race": {
                "asian": 0,
                "indian": 0,
                "black": 0,
                "white": 0,
                "middle eastern": 0,
                "latino hispanic": 0,
            },
            "emotion": {
                "angry": 0,
                "disgust": 0,
                "fear": 0,
                "happy": 0,
                "sad": 0,
                "surprise": 0,
                "neutral": 0,
            },
            "men": 0,
            "women": 0,
            "total": 0,
            "age": {"max": 0, "min": 0, "average": 0},
            "error": str(e),
        }


@app.get("/")
def read_root():
    current_time = datetime.now(timezone.utc)
    time_diff = current_time - DEPLOY_START_TIME

    # Calcular diferenças em anos, meses, dias, horas, minutos, segundos
    total_seconds = int(time_diff.total_seconds())
    years = total_seconds // (365 * 24 * 3600)
    months = (total_seconds % (365 * 24 * 3600)) // (30 * 24 * 3600)
    days = time_diff.days % 30
    hours = (total_seconds % (24 * 3600)) // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60

    return {
        "message": "Detection API",
        "time": {
            "start": DEPLOY_START_TIME.isoformat(),
            "end": current_time.isoformat(),
            "years": years,
            "months": months,
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "seconds": seconds,
        },
    }


@app.get("/health")
def health_check():
    """Health check endpoint for Cloud Run startup probes"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/ready")
def readiness_check():
    """Readiness check endpoint"""
    return {"status": "ready", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/detect-yolo")
async def detect_yolo(file: UploadFile = File(...)):
    """
    Detecta pessoas em uma imagem usando YOLO
    """
    # Verificar se é uma imagem
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    try:
        # Ler e processar a imagem
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Executar detecção YOLO
        yolo_model = get_model()
        results = yolo_model(image)

        # Filtrar apenas pessoas (classe 0 no COCO dataset)
        people_detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Classe 0 = pessoa no dataset COCO
                    if int(box.cls[0]) == 0:
                        confidence = float(box.conf[0])
                        people_detections.append(confidence)

        # Calcular estatísticas YOLO
        people_count = len(people_detections)
        avg_confidence = (
            sum(people_detections) / len(people_detections)
            if people_detections
            else 0.0
        )

        return {"people": people_count, "confidence": avg_confidence}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar imagem: {str(e)}"
        )


@app.post("/detect-deepface")
async def detect_deepface(file: UploadFile = File(...)):
    """
    Analisa faces em uma imagem usando DeepFace
    """
    # Verificar se é uma imagem
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    try:
        # Ler e processar a imagem
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Analisar faces com DeepFace
        deepface_results = analyze_faces_deepface(image)

        return deepface_results

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar imagem: {str(e)}"
        )


@app.post("/detect-people-bbox")
async def detect_people_bbox(file: UploadFile = File(...)):
    """
    Detecta pessoas em uma imagem usando YOLO e retorna a imagem com bounding boxes
    """
    # Verificar se é uma imagem
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    try:
        # Ler e processar a imagem
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Executar detecção YOLO
        yolo_model = get_model()
        results = yolo_model(image)

        # Converter PIL para numpy para desenhar
        img_array = np.array(image)

        # Desenhar bounding boxes nas pessoas detectadas
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Classe 0 = pessoa no dataset COCO
                    if int(box.cls[0]) == 0:
                        # Obter coordenadas da bbox
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0])

                        # Desenhar retângulo
                        cv2.rectangle(
                            img_array,
                            (int(x1), int(y1)),
                            (int(x2), int(y2)),
                            (0, 255, 0),
                            2,
                        )

                        # Adicionar texto com confiança
                        label = f"Person {confidence:.2f}"
                        cv2.putText(
                            img_array,
                            label,
                            (int(x1), int(y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0, 255, 0),
                            2,
                        )

        # Converter de volta para PIL
        result_image = Image.fromarray(img_array)

        # Salvar em buffer para retornar
        img_buffer = io.BytesIO()
        result_image.save(img_buffer, format="JPEG")
        img_buffer.seek(0)

        return StreamingResponse(
            io.BytesIO(img_buffer.read()),
            media_type="image/jpeg",
            headers={"Content-Disposition": "inline; filename=detected_people.jpg"},
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar imagem: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port, workers=1)
