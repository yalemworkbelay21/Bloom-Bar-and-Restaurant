@echo off
title Bloom Bar & Restaurant - TCP Print Bridge
color 0A
echo ========================================================
echo   Bloom Bar & Restaurant - Cloud & Local TCP Print Bridge
echo   Connecting Cloud POS to All Order Printers
echo   Printer Target: 10.241.18.48:9100 (HP LaserJet / ESC/POS)
echo ========================================================
echo.
cd /d "%~dp0"
node bloom-agent.js
pause
