@echo off
echo ===== REBUILDING AND TESTING REMOTE CONTROL FIXES =====

echo.
echo 1. Building agent with new input controller...
cd DeskLinkAgent
dotnet build -c Release
if %ERRORLEVEL% neq 0 (
    echo ❌ Agent build failed!
    pause
    exit /b 1
)

echo.
echo 2. Copying updated agent to build-resources...
copy /Y "bin\Release\net8.0\win-x64\publish\DeskLinkAgent.exe" "..\build-resources\agent\DeskLinkAgent.exe"
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to copy agent!
    pause
    exit /b 1
)

echo.
echo 3. Rebuilding Electron installer...
cd ..
npm run dist
if %ERRORLEVEL% neq 0 (
    echo ❌ Electron build failed!
    pause
    exit /b 1
)

echo.
echo 4. Starting test script...
node test-remote-control.js

echo.
echo ===== BUILD AND TEST COMPLETED =====
echo.
echo 📦 New installer: dist\DeskLink Setup 1.0.0.exe
echo 🧪 Test script: test-remote-control.js
echo 📋 Debug report: REMOTE_CONTROL_DEBUGGING_REPORT.md
echo.
echo 🎯 Next steps:
echo   1. Install the new installer
echo   2. Start a remote session
echo   3. Test mouse clicks - they should now work!
echo   4. Check agent logs for "[MouseKeyboardController]" messages
echo.
pause
