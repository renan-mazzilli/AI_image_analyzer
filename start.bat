@echo off
color 0B
echo.
echo ========================================
echo    🚀 AI IMAGE ANALYZER - INICIANDO
echo ========================================
echo.

REM Verificar se setup foi executado
if not exist "backend\venv" (
    echo ❌ Ambiente não configurado!
    echo 🔧 Execute 'setup.bat' primeiro
    pause
    exit /b 1
)

echo [1/3] Iniciando servidor backend...
cd backend
start "🔬 Backend Python" cmd /k "venv\Scripts\activate && echo 🚀 Iniciando servidor backend... && python app.py"
cd ..

REM Aguardar backend iniciar
echo [2/3] Aguardando backend inicializar...
echo ⏳ Aguarde 10 segundos...
timeout /t 10 /nobreak > nul

REM Verificar se backend está rodando
echo 🔍 Verificando backend...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Backend pode estar inicializando ainda...
    echo 💡 Se der erro, aguarde mais um pouco
)

echo [3/3] Iniciando frontend...
cd frontend

REM Tentar live-server primeiro, senão usar Python
where live-server >nul 2>&1
if not errorlevel 1 (
    start "🌐 Frontend Live-Server" cmd /k "echo 🌐 Iniciando frontend... && npx live-server --port=3000 --no-browser"
) else (
    REM Usar servidor Python como alternativa
    start "🌐 Frontend Python" cmd /k "echo 🌐 Iniciando frontend... && python -m http.server 3000"
)
cd ..

REM Aguardar frontend iniciar
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo    ✅ SISTEMA INICIADO!
echo ========================================
echo.
echo 🌐 Frontend:  http://localhost:3000
echo 🔬 Backend:   http://localhost:5000
echo 📊 API Test:  http://localhost:5000/api/health
echo.
echo 💡 INSTRUÇÕES:
echo    • Mantenha ambas as janelas abertas
echo    • Acesse http://localhost:3000 no navegador
echo    • Para parar: feche as janelas ou Ctrl+C
echo.
echo 🎯 Abrindo navegador...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo 📝 Pressione qualquer tecla para fechar esta janela
echo    (o sistema continuará rodando nas outras janelas)
pause >nul