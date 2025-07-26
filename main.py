from fastapi import FastAPI, File, UploadFile, HTTPException
from ultralytics import YOLO
from PIL import Image
from deepface import DeepFace
import numpy as np
import io

app = FastAPI(title="YOLO People Detection API", version="1.0.0")

# Inicializar modelo como None, será carregado no primeiro uso
model = None

@app.on_event("startup")
async def startup_event():
    """Carrega os modelos durante o startup para evitar delay no primeiro request"""
    print("🚀 Carregando modelos...")
    
    # Pré-carrega YOLO
    get_model()
    print("✅ YOLO carregado")
    
    # Pré-carrega DeepFace com uma imagem dummy
    try:
        import tempfile
        import cv2
        # Cria uma imagem dummy pequena
        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
        DeepFace.analyze(dummy_img, actions=['age'], enforce_detection=False)
        print("✅ DeepFace carregado")
    except:
        print("⚠️ DeepFace warm-up falhou, mas continuando...")
    
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
            actions=['age', 'gender', 'race', 'emotion'],
            enforce_detection=False
        )
        
        # Se não é lista, transformar em lista
        if not isinstance(results, list):
            results = [results]
        
        # Inicializar contadores
        gender_counts = {"Woman": 0, "Man": 0}
        race_counts = {"asian": 0, "indian": 0, "black": 0, "white": 0, "middle eastern": 0, "latino hispanic": 0}
        emotion_counts = {"angry": 0, "disgust": 0, "fear": 0, "happy": 0, "sad": 0, "surprise": 0, "neutral": 0}
        ages = []
        
        # Processar cada face detectada
        for face in results:
            # Gênero
            dominant_gender = face['dominant_gender']
            if dominant_gender in gender_counts:
                gender_counts[dominant_gender] += 1
            
            # Raça
            dominant_race = face['dominant_race']
            if dominant_race in race_counts:
                race_counts[dominant_race] += 1
            
            # Emoção
            dominant_emotion = face['dominant_emotion']
            if dominant_emotion in emotion_counts:
                emotion_counts[dominant_emotion] += 1
            
            # Idade
            ages.append(int(face['age']))
        
        # Calcular estatísticas de idade
        age_stats = {}
        if ages:
            age_stats = {
                "max": max(ages),
                "min": min(ages),
                "average": round(sum(ages) / len(ages))
            }
        
        total_faces = len(results)
        
        return {
            "gender": gender_counts,
            "race": race_counts,
            "emotion": emotion_counts,
            "men": gender_counts["Man"],
            "women": gender_counts["Woman"],
            "total": total_faces,
            "age": age_stats
        }
        
    except Exception as e:
        # Se DeepFace falhar, retornar estrutura vazia
        return {
            "gender": {"Woman": 0, "Man": 0},
            "race": {"asian": 0, "indian": 0, "black": 0, "white": 0, "middle eastern": 0, "latino hispanic": 0},
            "emotion": {"angry": 0, "disgust": 0, "fear": 0, "happy": 0, "sad": 0, "surprise": 0, "neutral": 0},
            "men": 0,
            "women": 0,
            "total": 0,
            "age": {"max": 0, "min": 0, "average": 0},
            "error": str(e)
        }


@app.get("/")
def read_root():
    return {"message": "YOLO People Detection API", "version": "1.0.0"}


@app.post("/detect-people")
async def detect_people(file: UploadFile = File(...)):
    """
    Detecta pessoas em uma imagem usando YOLO11
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
        avg_confidence = sum(people_detections) / len(people_detections) if people_detections else 0.0
        
        # Analisar faces com DeepFace
        deepface_results = analyze_faces_deepface(image)
        
        return {
            "yolo": {
                "people_count": people_count,
                "confidence": avg_confidence
            },
            "deepface": deepface_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
