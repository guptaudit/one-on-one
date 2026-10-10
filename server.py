import os
import sys
import http.server
import socketserver

PORT = 3000
DIRECTORY = "dist"

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Ensure we are serving assets relative to the correct build output folder
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Resolve the filesystem path for the requested resource
        path = self.translate_path(self.path)
        
        # If the file or path doesn't exist on the server disk,
        # redirect request to index.html to let React client-side router handle it.
        if not os.path.exists(path) and not path.endswith('/'):
            self.path = '/index.html'
            
        return super().do_GET()

def main():
    # Verify that the build folder is compiled
    if not os.path.exists(DIRECTORY):
        print("=" * 60)
        print(" ❌ ERROR: 'dist' folder not found!")
        print("=" * 60)
        print("Please build your React application first before starting the Python server:")
        print("  1. Run:  npm install")
        print("  2. Run:  npm run build")
        print("  These commands will generate the production files inside the 'dist' folder.")
        print("=" * 60)
        sys.exit(1)

    print("=" * 60)
    print(" 🚀 1:1 Ledger Offline Python Server")
    print("=" * 60)
    print(f" Serving production assets from: {os.path.abspath(DIRECTORY)}")
    print(f" Local Address:                  http://localhost:{PORT}")
    print(f" Network Address:                http://0.0.0.0:{PORT}")
    print("=" * 60)
    print(" Press Ctrl+C to stop the local server at any time.")
    print("-" * 60)

    # Allow immediate port reuse to bypass "Address already in use" lock-outs
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), SPARequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped successfully. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")

if __name__ == "__main__":
    main()
