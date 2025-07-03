import torch
from transformers import (
    BlipProcessor, BlipForConditionalGeneration,
    ViTImageProcessor, ViTForImageClassification,
    pipeline
)
from PIL import Image
import logging
import colorsys
import numpy as np
from collections import Counter

logger = logging.getLogger(__name__)

class AIModelManager:
    def __init__(self):
        self.models = {}
        self.processors = {}
        self.pipelines = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🔥 Usando dispositivo: {self.device}")
    
    def initialize_models(self):
        """Carrega todos os modelos de IA"""
        try:
            # Modelo para classificação de imagens
            logger.info("📊 Carregando modelo de classificação...")
            self.processors['classification'] = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
            self.models['classification'] = ViTForImageClassification.from_pretrained('google/vit-base-patch16-224')
            
            # Modelo para geração de legendas
            logger.info("📝 Carregando modelo de legendas...")
            self.processors['caption'] = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self.models['caption'] = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            
            # Pipeline para análise de sentimentos
            logger.info("😊 Carregando modelo de sentimentos...")
            self.pipelines['sentiment'] = pipeline(
                "image-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=0 if self.device == "cuda" else -1
            )
            
            # Mover modelos para GPU se disponível
            if self.device == "cuda":
                for model_name, model in self.models.items():
                    self.models[model_name] = model.to(self.device)
            
            logger.info("✅ Todos os modelos carregados!")
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar modelos: {e}")
            raise
    
    def classify_image(self, image):
        """Classifica uma imagem"""
        try:
            if 'classification' not in self.models:
                return {'error': 'Modelo de classificação não carregado'}
            
            # Preprocessar imagem
            inputs = self.processors['classification'](image, return_tensors="pt")
            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Inferência
            with torch.no_grad():
                outputs = self.models['classification'](**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # Processar resultados
            predicted_class_idx = predictions.argmax().item()
            confidence = predictions[0][predicted_class_idx].item()
            
            # Obter nome da classe
            class_name = self.models['classification'].config.id2label[predicted_class_idx]
            
            return {
                'class': class_name,
                'confidence': confidence,
                'top_predictions': [
                    {
                        'class': self.models['classification'].config.id2label[i],
                        'confidence': predictions[0][i].item()
                    }
                    for i in predictions.argsort(descending=True)[0][:5].tolist()
                ]
            }
            
        except Exception as e:
            logger.error(f"Erro na classificação: {e}")
            return {'error': str(e)}
    
    def generate_caption(self, image):
        """Gera uma legenda para a imagem"""
        try:
            if 'caption' not in self.models:
                return 'Modelo de legendas não disponível'
            
            # Preprocessar
            inputs = self.processors['caption'](image, return_tensors="pt")
            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Gerar legenda
            with torch.no_grad():
                out = self.models['caption'].generate(**inputs, max_length=50)
            
            # Decodificar
            caption = self.processors['caption'].decode(out[0], skip_special_tokens=True)
            
            return caption
            
        except Exception as e:
            logger.error(f"Erro na geração de legenda: {e}")
            return f'Erro: {str(e)}'
    
    def analyze_sentiment(self, image):
        """Analisa o sentimento visual da imagem usando múltiplas técnicas MELHORADAS"""
        try:
            logger.info("🎭 Iniciando análise de sentimento melhorada...")
            
            # Combinar diferentes análises para determinar sentimento
            color_sentiment = self._analyze_color_sentiment(image)
            brightness_sentiment = self._analyze_brightness_sentiment(image)
            classification_sentiment = self._get_classification_sentiment(image)
            
            # Calcular score final
            sentiment_score = (
                color_sentiment['score'] * 0.25 +           
                brightness_sentiment['score'] * 0.25 +      
                classification_sentiment['score'] * 0.5
            )
            
            # Determinar sentimento final
            if sentiment_score >= 0.5:
                sentiment = "Muito Positivo"
            elif sentiment_score >= 0.2:  
                sentiment = "Positivo"
            elif sentiment_score >= -0.2: 
                sentiment = "Neutro"
            elif sentiment_score >= -0.5: 
                sentiment = "Negativo"
            else:
                sentiment = "Muito Negativo"
            
            logger.info(f"✅ Sentimento analisado: {sentiment} (score: {sentiment_score:.3f})")
            
            return {
                'sentiment': sentiment,
                'score': round(sentiment_score, 3),
                'details': {
                    'color_analysis': color_sentiment,
                    'brightness_analysis': brightness_sentiment,
                    'classification_analysis': classification_sentiment
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de sentimento: {e}")
            return {
                'sentiment': 'Neutro',
                'score': 0.0,
                'error': str(e)
            }
    
    def _analyze_color_sentiment(self, image):
        """Analisa sentimento baseado nas cores da imagem"""
        try:
            # Converter para array numpy
            img_array = np.array(image)
            
            # Redimensionar para análise mais rápida
            if img_array.shape[0] > 200:
                step = img_array.shape[0] // 200
                img_array = img_array[::step, ::step]
            
            # Analisar cores dominantes
            pixels = img_array.reshape(-1, 3)
            
            # Calcular médias de cor
            avg_red = np.mean(pixels[:, 0])
            avg_green = np.mean(pixels[:, 1])
            avg_blue = np.mean(pixels[:, 2])
            
            # Converter para HSV para análise de saturação
            hsv_pixels = []
            for pixel in pixels[::100]:
                r, g, b = pixel / 255.0
                h, s, v = colorsys.rgb_to_hsv(r, g, b)
                hsv_pixels.append([h, s, v])
            
            hsv_array = np.array(hsv_pixels)
            avg_saturation = np.mean(hsv_array[:, 1])
            avg_value = np.mean(hsv_array[:, 2])
            
            # Análise de sentimento por cor
            sentiment_score = 0.0
            color_notes = []
            
            # Cores quentes (vermelho, laranja, amarelo) = mais positivo
            warmth_score = (avg_red - avg_blue) / 255.0
            if warmth_score > 0.1:
                sentiment_score += 0.3
                color_notes.append("Cores quentes (energético)")
            elif warmth_score < -0.1:
                sentiment_score -= 0.2
                color_notes.append("Cores frias (calmo)")
            
            # Verde = positivo (natureza)
            if avg_green > max(avg_red, avg_blue) and avg_green > 100:
                sentiment_score += 0.4
                color_notes.append("Verde dominante (natural/relaxante)")
            
            # Saturação alta = mais energético/positivo
            if avg_saturation > 0.6:
                sentiment_score += 0.2
                color_notes.append("Alta saturação (vibrante)")
            elif avg_saturation < 0.3:
                sentiment_score -= 0.1
                color_notes.append("Baixa saturação (sutil)")
            
            # Brilho
            if avg_value > 0.7:
                sentiment_score += 0.2
                color_notes.append("Imagem clara (positivo)")
            elif avg_value < 0.3:
                sentiment_score -= 0.3
                color_notes.append("Imagem escura (sombrio)")
            
            return {
                'score': max(-1.0, min(1.0, sentiment_score)),
                'notes': color_notes,
                'metrics': {
                    'avg_red': round(avg_red, 1),
                    'avg_green': round(avg_green, 1),
                    'avg_blue': round(avg_blue, 1),
                    'saturation': round(avg_saturation, 3),
                    'brightness': round(avg_value, 3)
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de cor: {e}")
            return {'score': 0.0, 'notes': ['Erro na análise'], 'error': str(e)}
    
    def _analyze_brightness_sentiment(self, image):
        """Analisa sentimento baseado no brilho e contraste"""
        try:
            # Converter para grayscale
            img_array = np.array(image.convert('L'))
            
            # Métricas de brilho
            brightness = np.mean(img_array)
            contrast = np.std(img_array)
            
            sentiment_score = 0.0
            notes = []
            
            # Brilho ideal
            if 80 <= brightness <= 180:
                sentiment_score += 0.3
                notes.append("Brilho balanceado")
            elif brightness < 60:
                sentiment_score -= 0.4
                notes.append("Muito escuro (melancólico)")
            elif brightness > 200:
                sentiment_score -= 0.2
                notes.append("Muito claro (pode ser artificial)")
            
            # Contraste adequado
            if 40 <= contrast <= 80:
                sentiment_score += 0.2
                notes.append("Bom contraste (dinâmico)")
            elif contrast < 20:
                sentiment_score -= 0.2
                notes.append("Baixo contraste (monótono)")
            
            return {
                'score': max(-1.0, min(1.0, sentiment_score)),
                'notes': notes,
                'metrics': {
                    'brightness': round(brightness, 1),
                    'contrast': round(contrast, 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de brilho: {e}")
            return {'score': 0.0, 'notes': ['Erro na análise'], 'error': str(e)}
    
    def _get_classification_sentiment(self, image):
        """Analisa sentimento baseado na classificação da imagem + DESCRIÇÃO (MELHORADO)"""
        try:
            # Usar a classificação existente
            classification = self.classify_image(image)
            
            if 'error' in classification:
                return {'score': 0.0, 'notes': ['Classificação não disponível']}
            
            class_name = classification.get('class', '').lower()
            sentiment_score = 0.0
            notes = []
            
            # Mapeamento de classes para sentimentos
            very_positive_keywords = [
                'golden retriever', 'labrador', 'dog', 'puppy',
                'flower', 'garden', 'beach', 'sunset', 'sunrise',
                'baby', 'child', 'wedding', 'celebration', 'party',
                'cake', 'ice cream', 'birthday',
                'butterfly', 'bird', 'rainbow'
            ]
            
            positive_keywords = [
                'food', 'fruit', 'nature', 'tree', 'park',
                'sport', 'football', 'basketball', 'tennis',
                'music', 'guitar', 'piano',
                'vacation', 'travel', 'adventure'
            ]
            
            # Detectar pessoas felizes/ativas
            active_positive_keywords = [
                'sweatshirt', 'hoodie', 'jersey', 'sportswear',
                'running', 'exercise', 'fitness', 'yoga',
                'dance', 'celebration', 'victory', 'polo shirt'
            ]
            
            negative_keywords = [
                'storm', 'rain', 'dark', 'shadow',
                'weapon', 'fire', 'smoke', 'accident',
                'hospital', 'medicine', 'bandage',
                'funeral', 'cemetery', 'prison'
            ]
            
            neutral_keywords = [
                'building', 'street', 'car', 'computer',
                'document', 'book', 'tool', 'furniture',
                'desk', 'chair', 'table'
            ]
            
            # Combinar com análise de descrição
            try:
                description = self.generate_caption(image).lower()
                logger.info(f"📝 Descrição para análise: {description}")
            except:
                description = ""
            
            # Verificar se a descrição indica alegria/atividade
            joy_indicators = [
                'arms up', 'fists raised', 'celebrating', 'cheering',
                'jumping', 'dancing', 'smiling', 'laughing',
                'victory', 'success', 'happy', 'excited',
                'thumbs up', 'waving', 'pointing up', 'hands up'
            ]
            
            sad_indicators = [
                'crying', 'sad', 'depressed', 'down', 'head down',
                'covering face', 'tears', 'grief', 'mourning'
            ]
            
            description_boost = 0.0
            description_notes = []
            
            # Verificar indicadores de alegria
            for indicator in joy_indicators:
                if indicator in description:
                    description_boost += 0.8 
                    description_notes.append(f"Postura positiva detectada: {indicator}")
                    break
            
            # Verificar indicadores de tristeza
            for indicator in sad_indicators:
                if indicator in description:
                    description_boost -= 0.6
                    description_notes.append(f"Postura negativa detectada: {indicator}")
                    break
            
            # Verificar keywords na classificação
            classification_boost = 0.0
            
            for keyword in very_positive_keywords:
                if keyword in class_name:
                    classification_boost += 0.7
                    notes.append(f"Objeto muito positivo: {keyword}")
                    break
            else:
                for keyword in positive_keywords:
                    if keyword in class_name:
                        classification_boost += 0.4
                        notes.append(f"Objeto positivo: {keyword}")
                        break
                else:
                    for keyword in active_positive_keywords:
                        if keyword in class_name:
                            # Para roupas esportivas, usar a descrição para determinar contexto
                            if description_boost > 0:
                                classification_boost += 0.5 
                                notes.append(f"Atividade positiva com {keyword}")
                            else:
                                classification_boost += 0.1  
                                notes.append(f"Roupa casual/esportiva: {keyword}")
                            break
                    else:
                        for keyword in negative_keywords:
                            if keyword in class_name:
                                classification_boost -= 0.4
                                notes.append(f"Objeto negativo: {keyword}")
                                break
                        else:
                            for keyword in neutral_keywords:
                                if keyword in class_name:
                                    classification_boost += 0.1
                                    notes.append(f"Objeto neutro: {keyword}")
                                    break
            
            # Combinar scores
            sentiment_score = classification_boost + description_boost
            
            # Adicionar notas da descrição
            notes.extend(description_notes)
            
            if not notes:
                notes.append(f"Classificação: {class_name}")
            
            logger.info(f"🎯 Classification boost: {classification_boost}, Description boost: {description_boost}")
            
            return {
                'score': max(-1.0, min(1.0, sentiment_score)),
                'notes': notes,
                'classification': class_name,
                'description_analyzed': description,
                'classification_boost': classification_boost,
                'description_boost': description_boost
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de classificação: {e}")
            return {'score': 0.0, 'notes': ['Erro na análise'], 'error': str(e)}
    
    def get_model_status(self):
        """Retorna o status dos modelos"""
        return {
            'classification': 'classification' in self.models,
            'caption': 'caption' in self.models,
            'sentiment': 'sentiment' in self.pipelines,
            'device': self.device
        }
    
    def get_model_info(self):
        """Informações detalhadas dos modelos"""
        return {
            'loaded_models': list(self.models.keys()),
            'loaded_pipelines': list(self.pipelines.keys()),
            'device': self.device,
            'torch_version': torch.__version__,
            'cuda_available': torch.cuda.is_available()
        }