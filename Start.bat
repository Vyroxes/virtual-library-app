@echo off
cd /d "%~dp0\frontend"
start cmd /k "npm run dev"

start http://localhost:5173/