from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging
from utils.ai_models import AIModelManager
from utils.image_processor import ImageProcessor

# Configuração da aplicação
app = Flask(__name__)
CORS(app)

# Configurações
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Criar diretório de uploads
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Inicializar componentes
ai_manager = AIModelManager()
image_processor = ImageProcessor()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': ai_manager.get_model_status()
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Endpoint principal para análise de imagens"""
    try:
        # Verificar se há arquivo na requisição
        if 'image' not in request.files:
            return jsonify({'error': 'Nenhuma imagem fornecida'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Formato de arquivo não suportado'}), 400
        
        # Processar imagem
        try:
            image = image_processor.load_image_from_file(file)
            if image is None:
                return jsonify({'error': 'Erro ao processar imagem'}), 400
            
        except Exception as e:
            logger.error(f"Erro ao carregar imagem: {e}")
            return jsonify({'error': 'Erro ao carregar imagem'}), 400
        
        # Executar análises
        results = {}
        
        # Classificação de imagem
        try:
            classification = ai_manager.classify_image(image)
            results['classification'] = classification
        except Exception as e:
            logger.error(f"Erro na classificação: {e}")
            results['classification'] = {'error': 'Erro na classificação'}
        
        # Geração de descrição
        try:
            description = ai_manager.generate_caption(image)
            results['description'] = description
        except Exception as e:
            logger.error(f"Erro na geração de descrição: {e}")
            results['description'] = 'Não foi possível gerar descrição'
        
        # Detecção de faces
        try:
            face_analysis = image_processor.detect_faces(image)
            results['faces'] = face_analysis
        except Exception as e:
            logger.error(f"Erro na detecção de faces: {e}")
            results['faces'] = {'count': 0, 'error': 'Erro na detecção'}
        
        # Análise de qualidade
        try:
            quality_metrics = image_processor.analyze_quality(image)
            results['quality'] = quality_metrics
        except Exception as e:
            logger.error(f"Erro na análise de qualidade: {e}")
            results['quality'] = {'error': 'Erro na análise'}
        
        # Análise de sentimento visual
        try:
            sentiment = ai_manager.analyze_sentiment(image)
            results['sentiment'] = sentiment
        except Exception as e:
            logger.error(f"Erro na análise de sentimento: {e}")
            results['sentiment'] = 'Neutro'
        
        return jsonify(results)
        
    except Exception as e:
        logger.error(f"Erro geral na análise: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/models', methods=['GET'])
def get_model_info():
    """Informações sobre os modelos carregados"""
    return jsonify(ai_manager.get_model_info())

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'Arquivo muito grande. Máximo 16MB.'}), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    logger.info("🚀 Iniciando servidor...")
    logger.info("📥 Carregando modelos de IA...")
    
    try:
        ai_manager.initialize_models()
        logger.info("✅ Modelos carregados com sucesso!")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelos: {e}")
    
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    )