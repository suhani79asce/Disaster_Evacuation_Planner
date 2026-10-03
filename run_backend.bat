@echo off
if exist "python-embed\python.exe" (
    python-embed\python.exe run_backend.py
) else (
    python run_backend.py
)
pause
