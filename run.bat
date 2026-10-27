@echo off
echo ========================================================
echo  Starting SmartScan AI - Lumina Preview
echo ========================================================
echo.

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using Windows Python Launcher (py)...
    py run_preview.py
    goto end
)

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using Python...
    python run_preview.py
    goto end
)

if exist "..\SmartScanAI\.venv\Scripts\python.exe" (
    echo Using project virtual environment Python...
    "..\SmartScanAI\.venv\Scripts\python.exe" run_preview.py
    goto end
)

echo Python command not found in PATH.
echo Opening standalone web dashboard directly in your browser...
start "" "%~dp0standalone\index.html"

:end
