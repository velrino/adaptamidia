# AI Vision Detection API

API completa para detecção e análise de pessoas e faces usando múltiplas tecnologias de ML/AI.

## 🚀 Funcionalidades

### Detecção de Pessoas

- **YOLO**: Detecção rápida de pessoas com contagem
- **Bounding Boxes**: Visualização com caixas delimitadoras

### Análise Facial

- **MediaPipe**: Detecção básica e rápida de faces
- **InsightFace**: Análise de idade e gênero com ONNX
- **DeepFace**: Análise completa (idade, gênero, raça, emoção)

## 📋 Dependências

- FastAPI 0.104.1
- Ultralytics 8.3.0 (YOLO)
- MediaPipe 0.10.14 (Google)
- InsightFace 0.7.3 (ONNX)
- DeepFace 0.0.92 (TensorFlow)
- OpenCV e Pillow para processamento de imagens

## 🛠️ Instalação

### Google Cloud Run (Produção)

Deployment automático via GitHub Actions para Cloud Run:

- **Auto scaling**: 0-3 instâncias conforme demanda
- **Serverless**: Pay-per-request, $0 quando sem tráfego
- **HTTPS nativo**: SSL automático
- **Hardware**: 16Gi RAM + 4 CPUs + 1 GPU (NVIDIA L4)
- **CUDA**: 12.2 + cuDNN 8 para máxima performance

### Usando Docker (Local)

```bash
docker build -t yolo-api .
docker run -p 8000:8000 yolo-api
```

### Instalação Local

**Para desenvolvimento (macOS/CPU):**

```bash
pip install -r requirements-mac.txt
python main.py
```

**Para produção (Linux/GPU):**

```bash
pip install -r requirements.txt
python main.py
```

## 📡 Endpoints

### `/detect-yolo` - Detecção de Pessoas (YOLO)

```bash
curl -X POST -F "file=@image.jpg" https://your-api.com/detect-yolo
```

**Resposta:**

```json
{
  "people": 3,
  "confidence": 0.85
}
```

### `/detect-mediapipe` - Detecção Básica de Faces

```bash
curl -X POST -F "file=@image.jpg" https://your-api.com/detect-mediapipe
```

**Resposta:**

```json
{
  "total_faces": 2,
  "method": "MediaPipe",
  "note": "Basic face detection only"
}
```

### `/detect-insightface` - Análise de Faces (Idade + Gênero)

```bash
curl -X POST -F "file=@image.jpg" https://your-api.com/detect-insightface
```

**Resposta:**

```json
{
  "gender": { "Woman": 1, "Man": 1 },
  "men": 1,
  "women": 1,
  "total": 2,
  "age": { "max": 35, "min": 25, "average": 30 },
  "method": "InsightFace"
}
```

### `/detect-deepface` - Análise Completa de Faces

```bash
curl -X POST -F "file=@image.jpg" https://your-api.com/detect-deepface
```

**Resposta:**

```json
{
  "gender": { "Woman": 1, "Man": 1 },
  "race": {
    "asian": 0,
    "indian": 0,
    "black": 0,
    "white": 2,
    "middle eastern": 0,
    "latino hispanic": 0
  },
  "emotion": {
    "angry": 0,
    "disgust": 0,
    "fear": 0,
    "happy": 2,
    "sad": 0,
    "surprise": 0,
    "neutral": 0
  },
  "men": 1,
  "women": 1,
  "total": 2,
  "age": { "max": 35, "min": 25, "average": 30 },
  "method": "DeepFace"
}
```

### `/detect-people-bbox` - Pessoas com Bounding Boxes

```bash
curl -X POST -F "file=@image.jpg" https://your-api.com/detect-people-bbox
```

**Resposta:** Imagem JPEG com bounding boxes desenhadas

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

- **Produção**: `https://api-vision-xxxx-uc.a.run.app/docs`
- **Local**: `http://localhost:8000/docs`

## 🏗️ Arquitetura

### Cloud Run (Produção)

- **Serverless**: Auto scaling 1-3 instâncias
- **Container**: Docker com YOLO + DeepFace
- **Pay-per-request**: Custo apenas durante uso
- **Cold start**: ~3-5 segundos para primeira requisição

### Aplicação

- **FastAPI**: Framework web assíncrono
- **YOLO**: Detecção de objetos em tempo real
- **DeepFace**: Análise facial com múltiplas características
- **Lazy Loading**: Modelos carregados apenas quando necessário
- **Warm-up**: Pré-carregamento de modelos no startup

## ⚡ Performance Analysis

### Hardware Requirements

| Componente | Especificação         | Status        |
| ---------- | --------------------- | ------------- |
| **GPU**    | NVIDIA L4 (24GB VRAM) | ✅ Excelente  |
| **RAM**    | 16 GiB                | ✅ Suficiente |
| **CPU**    | 4 cores               | ✅ Adequado   |
| **CUDA**   | 12.2 + cuDNN 8        | ✅ Compatível |

### Performance por Endpoint

| Endpoint        | Tempo (L4) | VRAM Usage | Precisão | Use Case         |
| --------------- | ---------- | ---------- | -------- | ---------------- |
| **MediaPipe**   | ~50ms      | ~0GB       | ⭐⭐     | Contagem rápida  |
| **InsightFace** | ~200ms     | ~1GB       | ⭐⭐⭐   | Idade + gênero   |
| **DeepFace**    | ~800ms     | ~3GB       | ⭐⭐⭐⭐ | Análise completa |
| **YOLO**        | ~300ms     | ~2GB       | ⭐⭐⭐   | Detecção pessoas |

### Throughput Estimado

**Configuração Cloud Run:**

- `--concurrency 2`: 2 requests simultâneos
- `--memory 16Gi`: Toda RAM disponível
- `--cpu 4`: Todas CPUs
- `--gpu 1`: L4 dedicada

**Capacidade por minuto:**

| Endpoint    | Requests/min | Limitação   |
| ----------- | ------------ | ----------- |
| MediaPipe   | ~600         | CPU bound   |
| InsightFace | ~300         | GPU memory  |
| DeepFace    | ~75          | GPU compute |
| YOLO        | ~200         | GPU compute |

### Uso de Recursos

```
┌─────────────────────────────────────┐
│ Memory Usage Distribution (16GB)    │
├─────────────────────────────────────┤
│ DeepFace:      ████████ 6GB        │
│ TensorFlow:    ███ 3GB             │
│ YOLO:          ██ 2GB              │
│ InsightFace:   █ 1GB               │
│ Sistema:       ██ 2GB              │
│ Buffer:        ██ 2GB              │
└─────────────────────────────────────┘
```

## 🏗️ Arquitetura

### Stack Tecnológico

- **Framework**: FastAPI + Uvicorn
- **ML Libraries**:
  - YOLO (Ultralytics) - Detecção de pessoas
  - MediaPipe (Google) - Detecção de faces
  - InsightFace - Análise facial com ONNX
  - DeepFace - Análise completa com TensorFlow
- **GPU**: CUDA 12.2 + cuDNN 8
- **Container**: NVIDIA CUDA Docker image

### Modelo de Carregamento

- **Lazy Loading**: Modelos carregados sob demanda
- **Singleton Pattern**: Instância única por modelo
- **Memory Sharing**: GPU compartilhada entre modelos

### Cloud Run Configuration

```yaml
Memory: 16Gi
CPU: 4
GPU: nvidia-l4 (1x)
Timeout: 3600s
Concurrency: 2
Min instances: 0
Max instances: 3
```

## 📊 Monitoramento

### Health Checks

- `/health` - Status da API
- `/ready` - Prontidão do serviço
- `/` - Informações gerais + endpoints

### Métricas Importantes

- **Cold Start**: 60-90s (primeiro request)
- **Warm Request**: Conforme tabela de performance
- **Memory Peak**: ~13GB durante uso intenso
- **GPU Utilization**: 60-80% durante processamento

## 🔧 Otimizações

### Para Alto Volume (100+ requests/min)

1. **Aumentar instâncias**: `--max-instances 6`
2. **Batch Processing**: Processar múltiplas imagens
3. **Model Optimization**: TensorRT para DeepFace
4. **Caching**: Redis para resultados frequentes

### Para Reduzir Custos

1. **Usar apenas MediaPipe**: Mais barato, básico
2. **Scale to Zero**: `--min-instances 0`
3. **Menor GPU**: T4 para workloads leves

## 🚨 Limitações

- **Startup Time**: 60-90s para carregar todos os modelos
- **Memory**: 16GB suficiente para ~2 requests simultâneos
- **DeepFace**: Mais lento, mas mais preciso
- **Race/Emotion**: DeepFace pode ter viés em algumas etnias

## 📈 Casos de Uso

### Recomendações por Use Case

| Cenário                 | Endpoint Recomendado | Motivo                |
| ----------------------- | -------------------- | --------------------- |
| **Contagem rápida**     | MediaPipe            | Velocidade            |
| **Análise demográfica** | InsightFace          | Precisão + velocidade |
| **Pesquisa completa**   | DeepFace             | Máxima precisão       |
| **Detecção pessoas**    | YOLO                 | Especializado         |
| **Visualização**        | YOLO Bbox            | Interface visual      |

### Exemplos de Integração

**Monitoramento de multidões:**

```bash
# Contagem rápida
curl -X POST -F "file=@crowd.jpg" /detect-mediapipe
```

**Análise de público-alvo:**

```bash
# Dados demográficos
curl -X POST -F "file=@audience.jpg" /detect-insightface
```

**Pesquisa de mercado:**

```bash
# Análise completa
curl -X POST -F "file=@focus_group.jpg" /detect-deepface
```

## 📝 Notas Técnicas

- Suporta formatos: JPEG, PNG, WebP, BMP
- YOLO baseado no dataset COCO (classe 0 = pessoa)
- Lazy loading evita carregar modelos desnecessários
- Fallbacks garantem respostas consistentes mesmo com erros
- Container otimizado com CUDA 12.2 + cuDNN 8

---

**Versão**: 2.0.0  
**Última atualização**: 2025-01-27  
**GPU Testada**: NVIDIA L4  
**Status**: Produção ✅
