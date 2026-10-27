"""
SmartScan AI - Instant Local Preview Runner
------------------------------------------
Runs a lightweight, zero-dependency local web server hosting the complete
SmartScan AI web application (matching https://lumina-ruby-omega.vercel.app).

Usage on Windows:
    python run_preview.py
"""

import os
import sys
import webbrowser
import http.server
import socketserver

PORT = 3000
STANDALONE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "standalone")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STANDALONE_DIR, **kwargs)

def run():
    os.chdir(STANDALONE_DIR)
    print("=" * 70)
    print("  SmartScan AI: Smart Scan Strategy for Electronic Warfare")
    print("  Exact local prototype matching https://lumina-ruby-omega.vercel.app")
    print("=" * 70)
    print(f"\n[+] Serving interactive dashboard from: {STANDALONE_DIR}")
    print(f"[+] Opening local URL: http://127.0.0.1:{PORT}")
    print("\nPress Ctrl+C to stop the server.\n")

    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
            try:
                webbrowser.open(f"http://127.0.0.1:{PORT}")
            except Exception:
                pass
            httpd.serve_forever()
    except OSError:
        # Fallback to alternate port if 3000 is taken
        alt_port = 5050
        print(f"[!] Port {PORT} is busy, trying port {alt_port}...")
        with socketserver.TCPServer(("127.0.0.1", alt_port), CustomHandler) as httpd:
            try:
                webbrowser.open(f"http://127.0.0.1:{alt_port}")
            except Exception:
                pass
            httpd.serve_forever()

if __name__ == "__main__":
    run()
