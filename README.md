# 🔍 AI Image Analyzer

Sistema de análise de imagens com inteligência artificial que combina múltiplos modelos para classificação inteligente, detecção de objetos, análise de sentimento e qualidade.

## 🚀 Características

- **🧠 Classificação Inteligente**: Combina COCO-SSD, ViT e BLIP para máxima precisão
- **👁️ Detecção de Objetos**: Identifica e localiza objetos na imagem  
- **😊 Análise de Sentimento**: Avalia o sentimento visual baseado em cores, contexto e postura
- **📊 Análise de Qualidade**: Métricas técnicas (nitidez, brilho, contraste, score)
- **🎨 Extração de Cores**: Paleta de cores dominantes
- **📝 Descrição Automática**: Geração de legendas com modelo BLIP

## ⚡ Instalação e Execução

### 🖥️ Windows:
```batch
# 1. Configurar (apenas na primeira vez)
setup.bat

# 2. Executar
start.bat
```

## 📋 Pré-requisitos

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js** (opcional, melhora a experiência) ([Download](https://nodejs.org/))

## 🌐 Acesso

Após executar `start.bat`:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📁 Estrutura do Projeto

```
AI_IMAGE_ANALYZER/
├── 📄 README.md
├── ⚙️ setup.bat       # Configuração automática
├── 🚀 start.bat         # Iniciar sistema
├── 📁 backend/
│   ├── 🐍 app.py                    # Servidor Flask principal
│   ├── 📋 requirements.txt          # Dependências Python
│   ├── 📁 models/                   # Modelos (vazio, baixados automaticamente)
│   ├── 📁 uploads/                  # Imagens temporárias
│   └── 📁 utils/
│       ├── ai_models.py             # Modelos ViT, BLIP, análise sentimento
│       └── image_processor.py       # OpenCV, detecção faces, qualidade
└── 📁 frontend/
    ├── 🌐 index.html                # Interface principal
    ├── ⚙️ script.js                 # Classificação inteligente + TensorFlow.js
    ├── 🎨 style.css                 # Estilos responsivos
    └── 📋 package.json              # Dependências opcionais
```

## 🧪 Como Testar

1. **Execute** o sistema com `start.bat`
2. **Acesse** http://localhost:3000
3. **Marque** "🧠 Classificação Inteligente" (recomendado)
4. **Selecione** uma imagem ou arraste para a área de upload
5. **Visualize** os resultados em tempo real

### 📸 Tipos de Imagem Recomendados:
- **👥 Pessoas**: Detecta faces, postura e sentimento ("pessoa celebrando")
- **🐕 Animais**: Classificação precisa (cães, gatos)
- **🏞️ Paisagens**: Análise de cores e sentimento positivo
- **🍕 Comida**: Classificação de objetos alimentares
- **📄 Documentos**: Análise de qualidade técnica

## 🤖 Modelos de IA Utilizados

### Frontend (TensorFlow.js):
- **COCO-SSD**: Detecção de 80 classes de objetos
- **MobileNet**: Classificação filtrada (remove resultados ruins)
- **ColorThief**: Extração de paleta de cores

### Backend (Python):
- **ViT (Vision Transformer)**: Classificação contextual avançada
- **BLIP**: Geração de legendas automáticas
- **OpenCV**: Detecção de faces e análise de qualidade
- **Análise Customizada**: Sentimento baseado em cores, brilho e contexto

### 🧠 Classificação Inteligente:
Combina todos os modelos automaticamente:
1. **COCO-SSD** (prioridade 1): "person 95%"
2. **BLIP Semântico** (prioridade 2): "pessoa celebrando" (detecta postura)
3. **ViT Backend** (prioridade 2): "sweatshirt 37%" (contexto)
4. **MobileNet Filtrado** (prioridade 4): Remove "salmon", "cellphone"

## 🔧 Solução de Problemas

### ❌ "Python não encontrado":
- **Windows**: Baixe em python.org e marque "Add to PATH"
- **Linux**: `sudo apt install python3 python3-pip python3-venv`
- **Mac**: `brew install python3`

### ❌ Backend não inicia:
```bash
# Verificar se porta 5000 está livre
netstat -an | findstr :5000  # Windows
lsof -i :5000                # Linux/Mac

# Ativar ambiente e testar manualmente
cd backend
source venv/bin/activate     # Linux/Mac
venv\Scripts\activate        # Windows
python app.py
```

### ❌ Frontend não carrega:
- **Alternativa 1**: Abrir `frontend/index.html` direto no navegador
- **Alternativa 2**: `cd frontend && python -m http.server 3000`

### ⏳ Modelos demoram para carregar:
- **Primeira execução**: Modelos são baixados (~2GB, pode demorar)
- **Localização**: Ficam em cache para próximas execuções
- **Progresso**: Veja logs no terminal do backend

## 📊 Tecnologias

### Backend:
- **Flask + CORS**: API REST
- **PyTorch + Transformers**: Modelos ViT e BLIP  
- **OpenCV**: Processamento de imagem
- **Pillow**: Manipulação de imagem
- **NumPy**: Computação numérica

### Frontend:
- **JavaScript ES6+**: Classificação inteligente
- **TensorFlow.js**: IA no navegador
- **HTML5 + CSS3**: Interface responsiva
- **Fetch API**: Comunicação com backend

## 🎓 Conceitos Acadêmicos Demonstrados

- **Visão Computacional**: Múltiplos modelos combinados
- **Transfer Learning**: Modelos pré-treinados especializados  
- **Ensemble Methods**: Classificação inteligente combina resultados
- **RESTful APIs**: Arquitetura cliente-servidor
- **Processamento de Imagem**: OpenCV para análise técnica
- **Interface Responsiva**: UX/UI moderno
- **Análise de Sentimento Visual**: Algoritmo customizado

## 🏆 Resultados

### (Classificação Inteligente):
```
✅ "person" (95%) - COCO-SSD
✅ "pessoa celebrando" (85%) - BLIP Semântico  
✅ "sweatshirt" (37%) - ViT Contextual
```

## 📧 Suporte

Para dúvidas sobre execução, consulte este README ou verifique:
- Logs no terminal do backend
- Console do navegador (F12)
- Status da API: http://localhost:5000/api/health

---

## Desenvolvido Por
- [Renan Mazzilli Dias](https://github.com/renan-mazzilli)
- [Felipe Bayona]()