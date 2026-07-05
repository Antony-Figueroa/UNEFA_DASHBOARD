@echo off
cd /d "%~dp0"
echo Starting offline server...
npx tsx src/server-offline.ts
