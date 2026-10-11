"""Serve the game on http://localhost:8800, exactly as it will be uploaded (dist/).

Rebuilds dist/ from index.html, main.css and js/ on every page load, so edits show up on refresh.
There is no Qiskit or `backend` here, so measurements fall back to the exact simulation.
"""
import functools
import http.server
import sys
from pathlib import Path

from build import DIST, build


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html"):
            build()
        super().do_GET()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
build()
handler = functools.partial(Handler, directory=str(DIST))
print(f"The Explainable Grover's Search: http://localhost:{port}")
http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
