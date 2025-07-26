from fastapi import FastAPI, File, UploadFile, HTTPException
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI(title="YOLO People Detection API", version="1.0.0")

# Inicializar modelo como None, será carregado no primeiro uso
model = None

def get_model():
    """Carrega o modelo YOLO de forma lazy"""
    global model
    if model is None:
        # Usa yolov8n.pt que é mais estável
        model = YOLO("yolov8n.pt")
    return model


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
        
        # Calcular estatísticas
        people_count = len(people_detections)
        avg_confidence = sum(people_detections) / len(people_detections) if people_detections else 0.0
        
        return {
            "yolo": {
                "people_count": people_count,
                "confidence": avg_confidence,
                "detections": people_detections
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar imagem: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
