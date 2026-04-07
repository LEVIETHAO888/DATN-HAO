@echo off
setlocal

echo ==========================================
echo    KHOI DONG HE THONG PHIMNET
echo ==========================================

set "BACKEND_DIR=D:\DoAnTotNghiep\phimnet_be"
set "FRONTEND_DIR=D:\DoAnTotNghiep\Frontend"
set "MVN_CMD=C:\Users\NItro\.m2\wrapper\dists\apache-maven-3.9.9\977a63e90f436cd6ade95b4c0e10c20c\bin\mvn.cmd"

echo [1/2] Dang chay Backend (Spring Boot)...
start "PhimNet Backend" /D "%BACKEND_DIR%" cmd /k ""%MVN_CMD%" spring-boot:run"

echo [2/2] Dang chay Frontend (React/Vite)...
start "PhimNet Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo ==========================================
echo  DA GUI LENH CHAY THANH CONG!
echo ==========================================
pause
