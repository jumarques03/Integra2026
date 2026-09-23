@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title AI Mistery - Iniciar

echo.
echo  ===== AI MISTERY - INTEGRA 2026 =====
echo.

rem ---------- 1. Pre-requisitos ----------
python --version >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Python nao encontrado. Instale o Python 3 em python.org e marque "Add python.exe to PATH".
  goto :erro
)
node --version >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale o Node.js em nodejs.org.
  goto :erro
)

rem ---------- 2. Fecha execucoes antigas ----------
echo Fechando execucoes antigas, se houver...
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -match 'uvicorn app\.main:app|npm run dev -- --port 5173' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

rem ---------- 3. Backend: ambiente Python ----------
set "PY=%~dp0backend\.venv\Scripts\python.exe"
if exist "%PY%" (
  "%PY%" -c "import sys" >nul 2>nul
  if errorlevel 1 (
    echo Ambiente Python invalido nesta maquina. Recriando...
    rmdir /s /q "%~dp0backend\.venv"
  )
)
if not exist "%PY%" (
  echo Criando ambiente Python, so na primeira vez...
  python -m venv "%~dp0backend\.venv"
  if errorlevel 1 goto :erro
)
"%PY%" -c "import fastapi, uvicorn, openai, aiosqlite, dotenv" >nul 2>nul
if errorlevel 1 (
  echo Instalando dependencias do backend, so na primeira vez...
  "%PY%" -m pip install -q -r "%~dp0backend\requirements.txt"
  if errorlevel 1 goto :erro
)

rem ---------- 4. Arquivos .env ----------
if not exist "backend\.env" copy "backend\.env.example" "backend\.env" >nul
findstr /C:"sk-coloque-sua-chave-aqui" "backend\.env" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo [ATENCAO] Falta colocar a chave da OpenAI em backend\.env ^(OPENAI_API_KEY^).
  echo O Bloco de Notas vai abrir: cole a chave, salve, feche e volte aqui.
  notepad "backend\.env"
  pause
)
if not exist "frontend\.env" copy "frontend\.env.example" "frontend\.env" >nul

rem ---------- 5. Frontend: dependencias ----------
if exist "frontend\node_modules\.bin\vite.cmd" goto :front_ok
echo Instalando dependencias do frontend, so na primeira vez...
pushd "frontend"
call npm install --no-audit --no-fund
if errorlevel 1 goto :erro
popd
:front_ok

rem ---------- 6. Sobe backend e frontend ----------
echo Iniciando o backend...
start "AI Mistery - Backend" /min /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
echo Iniciando o frontend...
start "AI Mistery - Frontend" /min /D "%~dp0frontend" cmd /k "npm run dev -- --port 5173 --strictPort"

rem ---------- 7. Espera ficar pronto e abre o navegador ----------
echo Aguardando o sistema ficar pronto...
where curl >nul 2>nul
if errorlevel 1 (
  ping -n 9 127.0.0.1 >nul
  goto :pronto
)
set /a TENTATIVAS=0
:esperar
curl -s -f -o nul http://localhost:8000/api/health
if errorlevel 1 goto :aguarda
curl -s -f -o nul http://localhost:5173/
if not errorlevel 1 goto :pronto
:aguarda
set /a TENTATIVAS+=1
if %TENTATIVAS% GEQ 60 goto :sem_resposta
ping -n 2 127.0.0.1 >nul
goto :esperar

:pronto
echo.
echo Tudo no ar! Abrindo o navegador em http://localhost:5173
if not defined NAO_ABRIR_NAVEGADOR start "" "http://localhost:5173"
echo.
echo Para encerrar, de duplo clique em parar.bat ^(ou feche as duas janelas pretas^).
ping -n 6 127.0.0.1 >nul
exit /b 0

:sem_resposta
echo.
echo [ERRO] O sistema nao respondeu a tempo. Veja as janelas do Backend e do Frontend para o motivo.
goto :erro

:erro
echo.
echo Nao foi possivel concluir. Corrija o problema acima e rode iniciar.bat de novo.
pause
exit /b 1
