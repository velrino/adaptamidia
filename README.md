# YOLO People Detection API

Uma API FastAPI para detecção de pessoas em imagens usando YOLO e análise facial com DeepFace.

## 🚀 Funcionalidades

- **Detecção de pessoas** usando modelo YOLO (YOLOv8n)
- **Análise facial avançada** com DeepFace (idade, gênero, raça, emoção)
- **Visualização com bounding boxes** em pessoas detectadas
- **API RESTful** com documentação automática
- **Containerização** com Docker

## 📋 Dependências

- FastAPI 0.104.1
- Ultralytics 8.3.0 (YOLO)
- DeepFace 0.0.92
- OpenCV e Pillow para processamento de imagens
- TensorFlow/Keras para modelos de IA

## 🛠️ Instalação

### Usando Docker (Recomendado)

```bash
docker build -t yolo-api .
docker run -p 8000:8000 yolo-api
```

### Instalação Local

```bash
pip install -r requirements.txt
python main.py
```

## 📚 API Routes

### `GET /`
Endpoint de status da API com informações de deploy.

**Resposta:**
```json
{
  "message": "Detection API",
  "time": {
    "start": "2025-07-26T01:21:30.140+00:00",
    "end": "2025-07-26T22:24:03.137+00:00",
    "years": 0,
    "months": 0,
    "days": 0,
    "hours": 21,
    "minutes": 2,
    "seconds": 32
  }
}
```

### `POST /detect-yolo`
Detecta pessoas em uma imagem usando YOLO.

**Parâmetros:**
- `file`: Arquivo de imagem (multipart/form-data)

**Resposta:**
```json
{
  "people": 3,
  "confidence": 0.87
}
```

### `POST /detect-deepface`
Analisa faces em uma imagem usando DeepFace.

**Parâmetros:**
- `file`: Arquivo de imagem (multipart/form-data)

**Resposta:**
```json
{
  "gender": {"Woman": 2, "Man": 1},
  "race": {
    "asian": 0,
    "indian": 0,
    "black": 1,
    "white": 2,
    "middle eastern": 0,
    "latino hispanic": 0
  },
  "emotion": {
    "angry": 0,
    "disgust": 0,
    "fear": 0,
    "happy": 3,
    "sad": 0,
    "surprise": 0,
    "neutral": 0
  },
  "men": 1,
  "women": 2,
  "total": 3,
  "age": {
    "max": 45,
    "min": 25,
    "average": 35
  }
}
```

### `POST /detect-people-bbox`
Detecta pessoas e retorna a imagem com bounding boxes desenhados.

**Parâmetros:**
- `file`: Arquivo de imagem (multipart/form-data)

**Resposta:**
- Imagem JPEG com bounding boxes das pessoas detectadas

## 🔧 Como Usar

### Exemplo com curl

```bash
# Detectar pessoas
curl -X POST "http://localhost:8000/detect-yolo" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sua_imagem.jpg"

# Análise facial
curl -X POST "http://localhost:8000/detect-deepface" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sua_imagem.jpg"

# Imagem com bounding boxes
curl -X POST "http://localhost:8000/detect-people-bbox" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sua_imagem.jpg" \
  --output resultado.jpg
```

### Documentação Interativa

Acesse `http://localhost:8000/docs` para a documentação automática do Swagger UI.

## 🏗️ Arquitetura

- **FastAPI**: Framework web assíncrono
- **YOLO**: Detecção de objetos em tempo real
- **DeepFace**: Análise facial com múltiplas características
- **Lazy Loading**: Modelos carregados apenas quando necessário
- **Warm-up**: Pré-carregamento de modelos no startup

## ⚡ Performance

- Modelos são carregados uma única vez no startup
- Cache de modelos em memória
- Processamento otimizado de imagens
- Fallbacks para casos de erro

## 📝 Notas

- Suporta formatos de imagem: JPEG, PNG, etc.
- Detecção baseada no dataset COCO (classe 0 = pessoa)
- Análise facial funciona mesmo sem detecção explícita de faces
- API retorna estruturas consistentes mesmo em caso de erro