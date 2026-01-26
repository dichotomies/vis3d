#!/usr/bin/env python3
"""HTTP server for serving the visualization with API endpoints for SfM."""
import http.server
import socketserver
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PORT = 8000

class SfMRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with API endpoints for SfM functionality."""
    
    def do_GET(self):
        """Handle GET requests including API endpoints."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/images':
            # Return list of available images
            self.send_json_response(self.get_images())
        elif parsed_path.path == '/api/intrinsics':
            # Return camera intrinsics from COLMAP reconstruction
            self.send_json_response(self.get_intrinsics())
        else:
            # Serve static files
            super().do_GET()
    
    def get_images(self):
        """Get list of available images in the dataset."""
        images_dir = Path('data/fern/images_8')
        images = []
        if images_dir.exists():
            for img_path in sorted(images_dir.glob('*.png')):
                images.append({
                    'name': img_path.name,
                    'path': f'/data/fern/images_8/{img_path.name}'
                })
        return {'images': images}
    
    def get_intrinsics(self):
        """Get camera intrinsics from the COLMAP reconstruction."""
        reconstruction_path = Path('data/fern/reconstruction.json')
        if reconstruction_path.exists():
            with open(reconstruction_path) as f:
                data = json.load(f)
                return {'camera_intrinsics': data.get('camera_intrinsics', {})}
        return {'camera_intrinsics': {}}
    
    def send_json_response(self, data):
        """Send a JSON response."""
        response = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response))
        self.end_headers()
        self.wfile.write(response)


# Allow port reuse
socketserver.TCPServer.allow_reuse_address = True

SfMRequestHandler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
})

with socketserver.TCPServer(("", PORT), SfMRequestHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
