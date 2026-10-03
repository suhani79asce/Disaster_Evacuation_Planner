"""
Convenience launcher for Disaster Evacuation Planner Flask Server
Usage:
  python run_backend.py
or
  .\\python-embed\\python.exe run_backend.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from backend.app import app
    port = int(os.environ.get("PORT", 5000))
    print(f"\n=======================================================")
    print(f"  Disaster Evacuation Planner - Flask + Python Server")
    print(f"  Running on: http://127.0.0.1:{port}/")
    print(f"  Technology Stack: Python, Flask, React, Leaflet")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
