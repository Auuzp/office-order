@echo off
chcp 65001 > nul
title ระบบสั่งซื้ออุปกรณ์สำนักงาน - Office Order App
set PATH=C:\Program Files\nodejs;%PATH%

echo =======================================================
echo     ระบบสั่งซื้อและเบิกอุปกรณ์สำนักงาน (Office Order)
echo     รองรับเครือ Illu / LL / True ^| อนุมัติโดย พี่น้ำ
echo =======================================================
echo.
echo กำลังตรวจสอบและสร้างไฟล์ build ล่าสุด...
if not exist "dist" (
    call npm run build
)

echo กำลังเริ่มทำงานเซิร์ฟเวอร์...
echo เปิดเว็บเบราว์เซอร์ที่: http://localhost:3001
echo.
timeout /t 2 /nobreak > nul
start "" "http://localhost:3001"

node server/index.js
pause
