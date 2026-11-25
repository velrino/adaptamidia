from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw
import numpy as np
import io
import cv2
from datetime import datetime, timezone
import os
import sys

# Configurações globais
sys.setrecursionlimit(3000)

app = FastAPI(title="AI Vision Detection API", version="2.0.0")

# Inicializar modelos como None, serão carregados na inicialização
model = None
insightface_app = None

# Tempo de início do deploy (quando o app inicia)
DEPLOY_START_TIME = datetime.now(timezone.utc)


@app.on_event("startup")
async def startup_event():
    """Carrega modelos na inicialização para evitar cold starts"""
    print("🚀 API iniciando...")
    print("📦 Carregando modelos...")
    
    # Pré-carregar YOLO
    try:
        print("⚡ Carregando YOLO...")
        get_model()
        print("✅ YOLO carregado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao carregar YOLO: {e}")
    
    
    # Pré-carregar InsightFace
    try:
        print("⚡ Carregando InsightFace...")
        preload_insightface()
        print("✅ InsightFace carregado com sucesso")
    except Exception as e:
        print(f"❌ Erro ao carregar InsightFace: {e}")
    
    print("🎯 API pronta para receber requests!")


def get_model():
    """Carrega o modelo YOLO de forma lazy"""
    global model
    if model is None:
        # Import YOLO only when needed
        from ultralytics import YOLO
        # Usa yolov8n.pt que é mais estável
        model = YOLO("yolov8n.pt")
    return model



def preload_insightface():
    """Pré-carrega InsightFace para evitar cold start"""
    global insightface_app
    if insightface_app is None:
        import insightface
        insightface_app = insightface.app.FaceAnalysis(
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        insightface_app.prepare(ctx_id=0, det_size=(640, 640))




def analyze_faces_insightface(image):
    """Analisa faces com InsightFace - análise de idade e gênero"""
    try:
        global insightface_app
        
        # Se não foi pré-carregado, carregar agora
        if insightface_app is None:
            preload_insightface()
        
        # Converter PIL para numpy array
        img_array = np.array(image)
        
        # Ensure image is in BGR format for InsightFace
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Analyze faces usando o modelo pré-carregado
        faces = insightface_app.get(img_array)
        
        if not faces:
            return {
                "total": 0,
                "method": "InsightFace"
            }
        
        # Process results
        gender_counts = {"Woman": 0, "Man": 0}
        ages = []
        
        for face in faces:
            # Age
            age = int(face.age)
            ages.append(age)
            
            # Gender (InsightFace returns 0=female, 1=male)
            if face.gender == 0:
                gender_counts["Woman"] += 1
            else:
                gender_counts["Man"] += 1
        
        # Calculate age statistics
        age_stats = {}
        if ages:
            age_stats = {
                "max": max(ages),
                "min": min(ages),
                "average": round(sum(ages) / len(ages)),
            }
        
        total_faces = len(faces)
        
        return {
            "gender": gender_counts,
            "men": gender_counts["Man"],
            "women": gender_counts["Woman"],
            "total": total_faces,
            "age": age_stats,
            "method": "InsightFace"
        }

    except Exception as e:
        import traceback
        error_details = {
            "error_type": type(e).__name__,
            "error_message": str(e),
            "traceback": traceback.format_exc()[-500:]
        }
        
        return {
            "total": 0,
            "method": "InsightFace",
            "error": error_details,
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
        "message": "AI Vision Detection API",
        "version": "2.0.0",
        "endpoints": {
            "yolo": "/detect-yolo - People detection using YOLO",
            "insightface": "/detect-insightface - Face analysis (age, gender) with ONNX",
            "bbox": "/detect-people-bbox - People detection with bounding boxes"
        },
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


@app.get("/warmup")
def warmup():
    """Endpoint para fazer warmup dos modelos"""
    try:
        # Força carregamento dos modelos se ainda não carregados
        get_model()
        preload_insightface()
        
        return {
            "status": "warmed_up",
            "models": {
                "yolo": model is not None,
                "insightface": insightface_app is not None
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "status": "warmup_error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


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
        
        # Converter RGBA para RGB se necessário
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background

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




@app.post("/detect-insightface")
async def detect_insightface(file: UploadFile = File(...)):
    """
    Analisa faces usando InsightFace - completo (idade, gênero)
    """
    # Verificar se é uma imagem
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    try:
        # Ler e processar a imagem
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Converter RGBA para RGB se necessário
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background

        # Analisar faces com InsightFace
        insightface_results = analyze_faces_insightface(image)

        return insightface_results

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
        
        # Converter RGBA para RGB se necessário
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        
        # Converter RGBA para RGB se necessário (para compatibilidade com JPEG)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Criar fundo branco para transparência
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background

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
