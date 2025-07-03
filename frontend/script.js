class AIImageAnalyzer {
    constructor() {
        this.backendUrl = 'http://localhost:5000';
        this.models = {
            mobilenet: null,
            cocoSsd: null
        };
        this.isLoading = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadModels();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    async loadModels() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = 'block';
        this.isLoading = true;

        try {
            console.log('🤖 Carregando MobileNet...');
            this.models.mobilenet = await mobilenet.load();
            console.log('✅ MobileNet carregado!');

            console.log('🎯 Carregando COCO-SSD...');
            this.models.cocoSsd = await cocoSsd.load();
            console.log('✅ COCO-SSD carregado!');

            console.log('🚀 Todos os modelos carregados com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao carregar modelos:', error);
            this.showError('Erro ao carregar modelos de IA. Verifique sua conexão.');
        } finally {
            loadingIndicator.style.display = 'none';
            this.isLoading = false;
        }
    }

    async handleFiles(files) {
        if (this.isLoading) {
            alert('⏳ Aguarde o carregamento dos modelos...');
            return;
        }

        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await this.processImage(file);
            }
        }
    }

    async processImage(file) {
        const resultsContainer = document.getElementById('results');
        const imageCard = this.createImageCard(file);
        resultsContainer.appendChild(imageCard);

        const imgElement = imageCard.querySelector('.preview-image');
        const resultsDiv = imageCard.querySelector('.analysis-results');

        imgElement.onload = async () => {
            try {
                await this.runAnalysis(imgElement, resultsDiv);
            } catch (error) {
                console.error('Erro na análise:', error);
                this.showError('Erro ao analisar a imagem.', resultsDiv);
            }
        };

        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    createImageCard(file) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <div class="image-section">
                <img class="preview-image" alt="Preview">
                <div class="image-info">
                    <h3>${file.name}</h3>
                    <p>Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </div>
            <div class="analysis-results">
                <div class="loading">🔄 Analisando imagem...</div>
            </div>
        `;
        return card;
    }

        async runAnalysis(imgElement, resultsDiv) {
        const analyses = [];

        // Classificação Inteligente (combina todos os modelos)
        if (document.getElementById('smartClassification').checked) {
            const smartClassification = await this.getSmartClassification(imgElement);
            if (smartClassification.length > 0) {
                analyses.push({
                    title: '🧠 Classificação Inteligente',
                    type: 'smart_classification',
                    data: smartClassification
                });
            }
        }

        // Detecção de objetos com COCO-SSD
        if (document.getElementById('cocoSsd').checked && this.models.cocoSsd) {
            const detections = await this.detectObjects(imgElement);
            analyses.push({
                title: '👁️ Detecção de Objetos',
                type: 'detection',
                data: detections
            });
        }

        // Análise de cores
        if (document.getElementById('colorAnalysis').checked) {
            const colorAnalysis = this.analyzeColors(imgElement);
            analyses.push({
                title: '🎨 Análise de Cores',
                type: 'colors',
                data: colorAnalysis
            });
        }

        // Análise backend
        if (document.getElementById('backendAI').checked) {
            const backendAnalysis = await this.analyzeWithBackend(imgElement);
            if (backendAnalysis) {
                analyses.push({
                    title: '🔬 Análise Avançada',
                    type: 'advanced',
                    data: backendAnalysis
                });
            }
        }

        this.displayResults(resultsDiv, analyses);
    }

    async getSmartClassification(imgElement) {
        try {
            console.log('🧠 Iniciando classificação inteligente...');
            const results = [];
            
            // Método 1: COCO-SSD 
            if (this.models.cocoSsd) {
                console.log('🔍 Analisando com COCO-SSD...');
                const detections = await this.models.cocoSsd.detect(imgElement);
                
                // Pegar objetos com alta confiança
                const highConfidenceObjects = detections
                    .filter(det => det.score > 0.6)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 2);
                
                highConfidenceObjects.forEach(obj => {
                    results.push({
                        label: obj.class,
                        confidence: obj.score,
                        source: 'COCO-SSD',
                        priority: 1,
                        description: 'Detecção precisa de objeto'
                    });
                });
                
                console.log(`✅ COCO-SSD encontrou ${highConfidenceObjects.length} objetos`);
            }
            
            // Método 2: Backend ViT (para contexto e classificação refinada)
            try {
                console.log('🔬 Consultando backend...');
                const originalFile = document.getElementById('fileInput').files[0];
                
                if (originalFile) {
                    const formData = new FormData();
                    formData.append('image', originalFile);
                    
                    const response = await fetch(`${this.backendUrl}/api/analyze`, {
                        method: 'POST',
                        mode: 'cors',
                        body: formData
                    });
                    
                    if (response.ok) {
                        const backendData = await response.json();
                        
                        // Classificação do backend
                        if (backendData.classification && !backendData.classification.error) {
                            const backendClass = backendData.classification;
                            if (backendClass.confidence > 0.2) {
                                results.push({
                                    label: backendClass.class,
                                    confidence: backendClass.confidence,
                                    source: 'ViT-Backend',
                                    priority: 2,
                                    description: 'Análise contextual avançada'
                                });
                            }
                            
                            // Top predictions do backend
                            if (backendClass.top_predictions) {
                                backendClass.top_predictions.slice(1, 3).forEach(pred => {
                                    if (pred.confidence > 0.15) {
                                        results.push({
                                            label: pred.class,
                                            confidence: pred.confidence,
                                            source: 'ViT-Backend',
                                            priority: 3,
                                            description: 'Possibilidade alternativa'
                                        });
                                    }
                                });
                            }
                        }
                        
                        // Usar descrição para classificação semântica
                        if (backendData.description) {
                            const semanticClass = this.extractSemanticClass(backendData.description);
                            if (semanticClass) {
                                results.push({
                                    label: semanticClass.label,
                                    confidence: semanticClass.confidence,
                                    source: 'BLIP-Semantic',
                                    priority: 2,
                                    description: `Baseado na descrição: "${backendData.description}"`
                                });
                            }
                        }
                    }
                }
                console.log('✅ Backend analisado');
            } catch (e) {
                console.log('⚠️ Backend não disponível para classificação');
            }
            
            // Método 3: MobileNet filtrado (backup inteligente)
            if (this.models.mobilenet) {
                console.log('📱 Analisando com MobileNet...');
                const mobilenetPredictions = await this.models.mobilenet.classify(imgElement);
                
                const filteredMobilenet = mobilenetPredictions
                    .filter(pred => pred.probability > 0.25)
                    .filter(pred => this.isValidMobilenetClassification(pred.className))
                    .slice(0, 2);
                
                filteredMobilenet.forEach(pred => {
                    // Só adicionar se não for redundante
                    const exists = results.some(r => 
                        r.label.toLowerCase().includes(pred.className.toLowerCase()) ||
                        pred.className.toLowerCase().includes(r.label.toLowerCase())
                    );
                    
                    if (!exists) {
                        results.push({
                            label: pred.className,
                            confidence: pred.probability,
                            source: 'MobileNet',
                            priority: 4,
                            description: 'Classificação visual básica'
                        });
                    }
                });
                console.log('✅ MobileNet filtrado');
            }
            
            // 🔄 Processar e ranquear resultados
            const processedResults = this.rankAndProcessResults(results);
            
            console.log('🎯 Classificação inteligente concluída:', processedResults);
            return processedResults;
            
        } catch (error) {
            console.error('❌ Erro na classificação inteligente:', error);
            return [];
        }
    }

    extractSemanticClass(description) {
        // Extrai classificação semântica da descrição
        const desc = description.toLowerCase();
        
        // Mapear descrições para classes
        const semanticMap = {
            'woman': { label: 'pessoa (mulher)', confidence: 0.8 },
            'man': { label: 'pessoa (homem)', confidence: 0.8 },
            'person': { label: 'pessoa', confidence: 0.7 },
            'child': { label: 'criança', confidence: 0.8 },
            'baby': { label: 'bebê', confidence: 0.9 },
            'dog': { label: 'cachorro', confidence: 0.8 },
            'cat': { label: 'gato', confidence: 0.8 },
            'car': { label: 'veículo', confidence: 0.7 },
            'building': { label: 'arquitetura', confidence: 0.6 },
            'food': { label: 'comida', confidence: 0.7 },
            'flower': { label: 'planta/flor', confidence: 0.8 }
        };
        
        // Detectar postura/ação
        if (desc.includes('arms up') || desc.includes('fists raised')) {
            return { label: 'pessoa celebrando', confidence: 0.85 };
        }
        if (desc.includes('sitting')) {
            return { label: 'pessoa sentada', confidence: 0.7 };
        }
        if (desc.includes('running') || desc.includes('walking')) {
            return { label: 'pessoa em movimento', confidence: 0.75 };
        }
        
        // Buscar palavras-chave
        for (let [keyword, result] of Object.entries(semanticMap)) {
            if (desc.includes(keyword)) {
                return result;
            }
        }
        
        return null;
    }

    isValidMobilenetClassification(className) {
        // Filtra classificações ruins do MobileNet
        const name = className.toLowerCase();
        
        // Lista de classificações problemáticas
        const badKeywords = [
            'salmon', 'fish', 'coho', 'cohoe',
            'cellular', 'cellphone', 'mobile phone', 'phone',
            'dishwasher', 'washing machine',
            'specific fish species', 'marine life',
            'very technical terms'
        ];
        
        // Rejeitar se contém palavras ruins
        for (let bad of badKeywords) {
            if (name.includes(bad)) {
                return false;
            }
        }
        
        // Aceitar classificações válidas
        const goodKeywords = [
            'person', 'human', 'people',
            'clothing', 'shirt', 'jacket', 'dress',
            'animal', 'dog', 'cat',
            'vehicle', 'car', 'truck',
            'building', 'house',
            'food', 'fruit', 'vegetable',
            'furniture', 'chair', 'table'
        ];
        
        for (let good of goodKeywords) {
            if (name.includes(good)) {
                return true;
            }
        }
        
        // Rejeitar classificações muito específicas (>3 palavras)
        return name.split(' ').length <= 3;
    }

    rankAndProcessResults(results) {
        // Rankeia e processa resultados finais
        
        // Remover duplicatas semânticas
        const uniqueResults = [];
        const seenLabels = new Set();
        
        for (let result of results) {
            const normalizedLabel = result.label.toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .trim();
            
            if (!seenLabels.has(normalizedLabel)) {
                seenLabels.add(normalizedLabel);
                uniqueResults.push(result);
            }
        }
        
        // Ordenar por prioridade e confiança
        return uniqueResults
            .sort((a, b) => {
                // Primeiro por prioridade (menor = melhor)
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                // Depois por confiança (maior = melhor)
                return b.confidence - a.confidence;
            })
            .slice(0, 4);
    }

    renderSmartClassification(data) {
        if (!data.length) return '<p>Nenhuma classificação disponível.</p>';
        
        return `
            <div class="smart-predictions">
                ${data.map((item, index) => `
                    <div class="smart-prediction-item ${index === 0 ? 'primary' : ''}">
                        <div class="prediction-header">
                            <span class="label">${item.label}</span>
                            <div class="badges">
                                <span class="source-badge" style="background: ${this.getSourceColor(item.source)}">
                                    ${item.source}
                                </span>
                                <span class="confidence-badge" style="background: ${this.getConfidenceColor(item.confidence)}">
                                    ${Math.round(item.confidence * 100)}%
                                </span>
                            </div>
                        </div>
                        <div class="prediction-description">
                            ${item.description}
                        </div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${item.confidence * 100}%; background: ${this.getConfidenceColor(item.confidence)}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <style>
            .smart-prediction-item {
                margin-bottom: 15px;
                padding: 15px;
                background: white;
                border-radius: 10px;
                border-left: 4px solid #17a2b8;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                transition: transform 0.2s ease;
            }
            .smart-prediction-item:hover {
                transform: translateY(-2px);
            }
            .smart-prediction-item.primary {
                border-left-color: #28a745;
                background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
            }
            .prediction-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            .label {
                font-weight: 600;
                font-size: 1.1em;
                color: #333;
                text-transform: capitalize;
            }
            .badges {
                display: flex;
                gap: 8px;
            }
            .source-badge, .confidence-badge {
                color: white;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.75em;
                font-weight: bold;
            }
            .prediction-description {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 10px;
                font-style: italic;
            }
            .confidence-bar {
                height: 6px;
                background: #e9ecef;
                border-radius: 3px;
                overflow: hidden;
            }
            .confidence-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            </style>
        `;
    }

    getSourceColor(source) {
        const colors = {
            'COCO-SSD': '#28a745',       
            'ViT-Backend': '#007bff',    
            'BLIP-Semantic': '#17a2b8',  
            'MobileNet': '#6c757d'      
        };
        return colors[source] || '#6c757d';
    }

    getConfidenceColor(confidence) {
        if (confidence > 0.7) return '#28a745';  
        if (confidence > 0.5) return '#ffc107'; 
        if (confidence > 0.3) return '#fd7e14';  
        return '#dc3545';                        
    }

    async classifyWithMobileNet(imgElement) {
        try {
            const predictions = await this.models.mobilenet.classify(imgElement);
            return predictions.slice(0, 5).map(pred => ({
                label: pred.className,
                confidence: pred.probability
            }));
        } catch (error) {
            console.error('Erro na classificação:', error);
            return [];
        }
    }

    async detectObjects(imgElement) {
        try {
            const predictions = await this.models.cocoSsd.detect(imgElement);
            return predictions.map(pred => ({
                label: pred.class,
                confidence: pred.score,
                bbox: pred.bbox
            }));
        } catch (error) {
            console.error('Erro na detecção:', error);
            return [];
        }
    }

    analyzeColors(imgElement) {
        try {
            const colorThief = new ColorThief();
            const dominantColor = colorThief.getColor(imgElement);
            const palette = colorThief.getPalette(imgElement, 8);
            
            return {
                dominant: dominantColor,
                palette: palette
            };
        } catch (error) {
            console.error('Erro na análise de cores:', error);
            return null;
        }
    }

    async analyzeWithBackend(imgElement) {
        try {
            console.log('🔄 Iniciando análise com backend...');
            
            // Obter a imagem original do input file ao invés de converter canvas
            const fileInput = document.getElementById('fileInput');
            const originalFile = fileInput.files[0];
            
            if (!originalFile) {
                throw new Error('Arquivo original não encontrado');
            }
            
            console.log('📁 Arquivo original:', originalFile.name, originalFile.type, originalFile.size);
            
            const formData = new FormData();
            formData.append('image', originalFile); 
            
            console.log('📤 Enviando para:', `${this.backendUrl}/api/analyze`);
            
            const response = await fetch(`${this.backendUrl}/api/analyze`, {
                method: 'POST',
                mode: 'cors',
                body: formData
            });
            
            console.log('📥 Resposta:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Dados recebidos:', data);
                return data;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro HTTP:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Erro na análise backend:', error);
            throw error;
        }
    }

    displayResults(container, analyses) {
        container.innerHTML = '';
        
        analyses.forEach(analysis => {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            
            let content = `<h4>${analysis.title}</h4>`;
            
            switch (analysis.type) {
                case 'smart_classification':
                    content += this.renderSmartClassification(analysis.data);
                    break;
                case 'classification':
                    content += this.renderClassification(analysis.data);
                    break;
                case 'detection':
                    content += this.renderDetection(analysis.data);
                    break;
                case 'colors':
                    content += this.renderColors(analysis.data);
                    break;
                case 'advanced':
                    content += this.renderAdvanced(analysis.data);
                    break;
            }
            
            section.innerHTML = content;
            container.appendChild(section);
        });
    }

    renderClassification(data) {
        if (!data.length) return '<p>Nenhuma classificação encontrada.</p>';
        
        return `
            <div class="predictions">
                ${data.map(item => `
                    <div class="prediction-item">
                        <span class="label">${item.label}</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${item.confidence * 100}%"></div>
                            <span class="confidence-text">${Math.round(item.confidence * 100)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDetection(data) {
        if (!data.length) return '<p>Nenhum objeto detectado.</p>';
        
        return `
            <div class="detections">
                ${data.map(item => `
                    <div class="detection-item">
                        <span class="label">${item.label}</span>
                        <span class="confidence">${Math.round(item.confidence * 100)}%</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderColors(data) {
        if (!data) return '<p>Erro na análise de cores.</p>';
        
        return `
            <div class="color-analysis">
                <div class="dominant-color">
                    <span>Cor Dominante:</span>
                    <div class="color-swatch" style="background-color: rgb(${data.dominant.join(',')})"></div>
                    <span>rgb(${data.dominant.join(', ')})</span>
                </div>
                <div class="color-palette">
                    <span>Paleta de Cores:</span>
                    <div class="palette-colors">
                        ${data.palette.map(color => 
                            `<div class="color-swatch" style="background-color: rgb(${color.join(',')})"></div>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderAdvanced(data) {
        let html = '<div class="advanced-analysis">';
        
        // Descrição
        if (data.description) {
            html += `<div class="analysis-item">
                <strong>📝 Descrição:</strong>
                <p>${data.description}</p>
            </div>`;
        }
        
        // Sentimento 
        if (data.sentiment) {
            if (typeof data.sentiment === 'object') {
                const sentiment = data.sentiment.sentiment || 'N/A';
                const score = data.sentiment.score || 0;
                const scorePercent = Math.round(score * 100);
                const scoreColor = score > 0.3 ? '#28a745' : score < -0.3 ? '#dc3545' : '#6c757d';
                
                html += `<div class="analysis-item">
                    <strong>😊 Sentimento:</strong>
                    <div class="sentiment-display">
                        <span class="sentiment-label" style="color: ${scoreColor}; font-weight: bold;">
                            ${sentiment}
                        </span>
                        <span class="sentiment-score" style="color: #666; margin-left: 10px;">
                            (${scorePercent > 0 ? '+' : ''}${scorePercent}%)
                        </span>
                    </div>
                `;
                
                // Mostrar detalhes se disponíveis
                if (data.sentiment.details) {
                    html += '<div class="sentiment-details" style="margin-top: 10px; font-size: 0.9em;">';
                    
                    if (data.sentiment.details.color_analysis && data.sentiment.details.color_analysis.notes) {
                        html += `<div style="margin-bottom: 5px;">
                            <strong>🎨 Cores:</strong> ${data.sentiment.details.color_analysis.notes.join(', ')}
                        </div>`;
                    }
                    
                    if (data.sentiment.details.brightness_analysis && data.sentiment.details.brightness_analysis.notes) {
                        html += `<div style="margin-bottom: 5px;">
                            <strong>💡 Brilho:</strong> ${data.sentiment.details.brightness_analysis.notes.join(', ')}
                        </div>`;
                    }
                    
                    if (data.sentiment.details.classification_analysis && data.sentiment.details.classification_analysis.notes) {
                        html += `<div style="margin-bottom: 5px;">
                            <strong>🏷️ Contexto:</strong> ${data.sentiment.details.classification_analysis.notes.join(', ')}
                        </div>`;
                    }
                    
                    html += '</div>';
                }
                
                html += '</div>';
            } else {
                html += `<div class="analysis-item">
                    <strong>😊 Sentimento:</strong>
                    <span>${data.sentiment}</span>
                </div>`;
            }
        }
        
        // Qualidade 
        if (data.quality && typeof data.quality === 'object' && !data.quality.error) {
            html += `<div class="analysis-item">
                <strong>📊 Qualidade da Imagem:</strong>
                <div class="quality-metrics">
                    <div class="quality-grid">
                        <div class="metric-item">
                            <span class="metric-label">Score Geral:</span>
                            <span class="metric-value" style="font-weight: bold; color: ${data.quality.quality_score > 70 ? '#28a745' : data.quality.quality_score > 40 ? '#ffc107' : '#dc3545'}">
                                ${data.quality.quality_score}/100
                            </span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Resolução:</span>
                            <span class="metric-value">${data.quality.resolution}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Proporção:</span>
                            <span class="metric-value">${data.quality.aspect_ratio}:1</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Brilho:</span>
                            <span class="metric-value">${Math.round(data.quality.brightness)}/255</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Contraste:</span>
                            <span class="metric-value">${Math.round(data.quality.contrast)}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Nitidez:</span>
                            <span class="metric-value">${Math.round(data.quality.sharpness)}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        }
        
        // Faces
        if (data.faces) {
            const faceCount = data.faces.count || 0;
            const faceIcon = faceCount > 0 ? '👥' : '👤';
            html += `<div class="analysis-item">
                <strong>${faceIcon} Detecção de Faces:</strong>
                <span>${faceCount} face${faceCount !== 1 ? 's' : ''} detectada${faceCount !== 1 ? 's' : ''}</span>
                ${data.faces.error ? `<span style="color: #dc3545; margin-left: 10px;">(${data.faces.error})</span>` : ''}
            </div>`;
        }
        
        // Classificação
        if (data.classification && !data.classification.error) {
            const className = data.classification.class || 'N/A';
            const confidence = data.classification.confidence || 0;
            const confidencePercent = Math.round(confidence * 100);
            
            html += `<div class="analysis-item">
                <strong>🏷️ Classificação Principal:</strong>
                <div class="classification-display">
                    <span class="class-name">${className}</span>
                    <span class="confidence-badge" style="background: ${confidencePercent > 50 ? '#28a745' : confidencePercent > 30 ? '#ffc107' : '#dc3545'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-left: 10px;">
                        ${confidencePercent}%
                    </span>
                </div>
            </div>`;
            
            // Top predictions
            if (data.classification.top_predictions && data.classification.top_predictions.length > 1) {
                html += `<div class="analysis-item">
                    <strong>🎯 Outras Possibilidades:</strong>
                    <div class="top-predictions">`;
                
                data.classification.top_predictions.slice(1, 4).forEach(pred => {
                    const predConfidence = Math.round(pred.confidence * 100);
                    html += `<div class="prediction-alt">
                        <span>${pred.class}</span>
                        <span style="color: #666;">${predConfidence}%</span>
                    </div>`;
                });
                
                html += `</div></div>`;
            }
        }
        
        html += '</div>';
        
        // Adicionar CSS inline para melhor formatação
        html += `
        <style>
        .advanced-analysis .analysis-item {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 8px;
            border-left: 3px solid #007bff;
        }
        .quality-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            margin-top: 8px;
        }
        .metric-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px;
            background: #f8f9fa;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .metric-label {
            color: #666;
            font-size: 0.85em;
        }
        .metric-value {
            font-weight: 500;
        }
        .sentiment-display {
            margin-top: 5px;
        }
        .sentiment-details {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border-left: 2px solid #007bff;
        }
        .top-predictions {
            margin-top: 8px;
        }
        .prediction-alt {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            background: #f8f9fa;
            margin-bottom: 4px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .classification-display {
            margin-top: 5px;
            display: flex;
            align-items: center;
        }
        .class-name {
            font-weight: 500;
            text-transform: capitalize;
        }
        </style>`;
        
        return html;
    }

    showError(message, container = null) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `❌ ${message}`;
        
        if (container) {
            container.innerHTML = '';
            container.appendChild(errorDiv);
        } else {
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new AIImageAnalyzer();
});