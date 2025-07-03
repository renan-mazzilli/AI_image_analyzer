@echo off
color 0A
echo.
echo ========================================
echo    🚀 AI IMAGE ANALYZER - SETUP
echo ========================================
echo.

REM Verificar se Python está instalado
echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo 📥 Baixe em: https://www.python.org/downloads/
    echo ⚠️ Marque "Add Python to PATH" durante a instalação
    pause
    exit /b 1
)
echo ✅ Python encontrado!

REM Verificar se Node.js está instalado
echo [2/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo 📥 Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado!

REM Configurar backend
echo [3/4] Configurando backend Python...
cd backend
if not exist "venv" (
    echo 📦 Criando ambiente virtual...
    python -m venv venv
)
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate
echo 📋 Instalando dependências...
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ❌ Erro ao instalar dependências Python!
    echo 💡 Tente executar manualmente: pip install -r requirements.txt
    pause
    exit /b 1
)
cd ..
echo ✅ Backend configurado!

REM Configurar frontend
echo [4/4] Configurando frontend...
cd frontend
if exist "package.json" (
    echo 📋 Instalando dependências Node.js...
    npm install --silent
    if errorlevel 1 (
        echo ⚠️ Aviso: Erro no npm install (opcional)
        echo 💡 Frontend pode funcionar sem dependências npm
    )
) else (
    echo ℹ️ package.json não encontrado, pulando npm install
)
cd ..
echo ✅ Frontend configurado!

echo.
echo ========================================
echo    🎉 CONFIGURAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo 🌟 Projeto pronto para usar!
echo 🚀 Execute 'start.bat' para iniciar
echo 📖 Leia o README.md para mais informações
echo.
pause