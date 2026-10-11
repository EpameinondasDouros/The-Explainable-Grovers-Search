"""Serve the game on http://localhost:8800 (static files only; the simulation runs in the browser)."""
import functools
import http.server
import sys
from pathlib import Path

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(Path(__file__).parent))
print(f"The Explainable Grover's Search: http://localhost:{port}")
http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
