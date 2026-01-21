#!/usr/bin/env python3
"""Simple HTTP server for serving the visualization."""
import http.server
import socketserver

PORT = 8000

# Allow port reuse
socketserver.TCPServer.allow_reuse_address = True

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
})

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
