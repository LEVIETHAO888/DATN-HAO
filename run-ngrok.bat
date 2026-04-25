@echo off
setlocal

echo ==========================================
echo    KHOI DONG NGROK - PHIMNET VNPAY
echo ==========================================
echo.
echo  Domain: limpness-acting-eagle.ngrok-free.dev
echo  Forward: localhost:5173 (Frontend Vite)
echo.
echo  Luu y: VNPay ReturnUrl da cau hinh tro ve
echo  domain nay trong VNPayConfig.java
echo.
echo ==========================================
echo.

ngrok http 5173 --domain=limpness-acting-eagle.ngrok-free.dev

pause
