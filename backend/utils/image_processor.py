import cv2
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        # Carregar classificador de faces do OpenCV
        try:
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        except Exception as e:
            logger.error(f"Erro ao carregar classificador de faces: {e}")
            self.face_cascade = None
    
    def load_image_from_file(self, file):
        """Carrega imagem de um arquivo upload"""
        try:
            # Ler bytes do arquivo
            image_bytes = file.read()
            
            # Converter para PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Converter para RGB se necessário
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
            
        except Exception as e:
            logger.error(f"Erro ao carregar imagem: {e}")
            return None
    
    def detect_faces(self, pil_image):
        """Detecta faces na imagem"""
        try:
            if self.face_cascade is None:
                return {'count': 0, 'error': 'Classificador não disponível'}
            
            # Converter PIL para OpenCV
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Detectar faces
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            face_data = []
            for (x, y, w, h) in faces:
                face_data.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'confidence': 0.85  # OpenCV não retorna confidence, valor fixo
                })
            
            return {
                'count': len(faces),
                'faces': face_data,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Erro na detecção de faces: {e}")
            return {'count': 0, 'error': str(e)}
    
    def analyze_quality(self, pil_image):
        """Analisa qualidade técnica da imagem"""
        try:
            # Converter para OpenCV
            opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Calcular nitidez (Laplacian variance)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Calcular brilho médio
            brightness = np.mean(gray)
            
            # Calcular contraste (desvio padrão)
            contrast = np.std(gray)
            
            # Analisar ruído (usando Gaussian blur difference)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            noise_level = np.mean(np.abs(gray.astype(float) - blurred.astype(float)))
            
            # Classificar qualidade
            quality_score = self._calculate_quality_score(sharpness, brightness, contrast, noise_level)
            
            return {
                'sharpness': float(sharpness),
                'brightness': float(brightness),
                'contrast': float(contrast),
                'noise_level': float(noise_level),
                'quality_score': quality_score,
                'resolution': f"{pil_image.width}x{pil_image.height}",
                'aspect_ratio': round(pil_image.width / pil_image.height, 2)
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de qualidade: {e}")
            return {'error': str(e)}
    
    def _calculate_quality_score(self, sharpness, brightness, contrast, noise):
        """Calcula score de qualidade (0-100)"""
        # Normalizar métricas
        sharpness_norm = min(sharpness / 1000, 1.0)  # Valores típicos 0-1000+
        brightness_norm = 1.0 - abs(brightness - 127.5) / 127.5  # Ideal próximo a 127.5
        contrast_norm = min(contrast / 70, 1.0)  # Valores típicos 0-70+
        noise_norm = max(0, 1.0 - noise / 20)  # Menos ruído é melhor
        
        # Pesos para cada métrica
        weights = {
            'sharpness': 0.4,
            'brightness': 0.2,
            'contrast': 0.3,
            'noise': 0.1
        }
        
        score = (
            sharpness_norm * weights['sharpness'] +
            brightness_norm * weights['brightness'] +
            contrast_norm * weights['contrast'] +
            noise_norm * weights['noise']
        ) * 100
        
        return round(score, 1)

    def resize_image(self, pil_image, max_size=800):
        """Redimensiona imagem mantendo proporção"""
        try:
            width, height = pil_image.size
            
            if max(width, height) <= max_size:
                return pil_image
            
            if width > height:
                new_width = max_size
                new_height = int((height * max_size) / width)
            else:
                new_height = max_size
                new_width = int((width * max_size) / height)
            
            return pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
        except Exception as e:
            logger.error(f"Erro ao redimensionar: {e}")
            return pil_image