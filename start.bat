@echo off
echo Starting Rast-Red System...
echo.

echo [1/3] Starting Backend...
cd backend
start "Backend" cmd /k "python main.py"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend...
cd ../frontend
start "Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser...
start http://localhost:5173

echo.
echo System started successfully!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause >nul
