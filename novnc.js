/**
 * Selenoid VNC Client - Simple web client for connecting to Selenoid browser sessions via VNC
 * 
 * @author Eliel Floriano Resende do Prado
 * @license MIT
 * @repository https://github.com/elielprado/selenoidVncViewer
 */

const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const bodyParser = require('body-parser');

// Configuration (use environment variables if available)
const app = express();
const PORT = process.env.PORT || 8080;
const SELENIUM_GRID_HOST = process.env.SELENIUM_HOST || '192.168.100.6:4444';
const DEFAULT_SESSION_ID = process.env.SESSION_ID || '';
const VNC_SECRET = process.env.VNC_SECRET || 'selenoid';

// Set up middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/novnc', express.static(path.join(__dirname, 'novnc')));

// Home page with session ID form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Selenoid VNC Viewer</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 50px auto;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          margin-top: 0;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
          font-size: 16px;
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #45a049;
        }
        .info {
          margin-top: 20px;
          padding: 10px;
          background-color: #e7f3fe;
          border-left: 4px solid #2196F3;
        }
        .advanced-options {
          margin-top: 10px;
          font-size: 14px;
          color: #666;
          cursor: pointer;
        }
        .advanced-panel {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Selenoid VNC Viewer</h1>
        <form action="/connect" method="post">
          <div class="form-group">
            <label for="sessionId">Session ID:</label>
            <input type="text" id="sessionId" name="sessionId" value="${DEFAULT_SESSION_ID}" required>
          </div>
          
          <div class="advanced-options" onclick="toggleAdvanced()">
            ▶ Advanced options
          </div>
          
          <div id="advancedPanel" class="advanced-panel">
            <div class="form-group">
              <label for="vncSecret">VNC Secret (leave empty for default):</label>
              <input type="text" id="vncSecret" name="vncSecret" placeholder="Use default">
            </div>
          </div>
          
          <button type="submit" style="margin-top: 15px;">Connect to VNC</button>
        </form>
        <div class="info">
          <p>Enter the Selenoid session ID to connect to the browser session via VNC.</p>
          <p>The session ID can be found in your test logs or the Selenoid UI.</p>
        </div>
      </div>
      
      <script>
        function toggleAdvanced() {
          const panel = document.getElementById('advancedPanel');
          const options = document.querySelector('.advanced-options');
          
          if (panel.style.display === 'block') {
            panel.style.display = 'none';
            options.innerHTML = '▶ Advanced options';
          } else {
            panel.style.display = 'block';
            options.innerHTML = '▼ Advanced options';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Process form submission and redirect to VNC page
app.post('/connect', (req, res) => {
  const sessionId = req.body.sessionId || DEFAULT_SESSION_ID;
  const vncSecret = req.body.vncSecret ? req.body.vncSecret : null;
  
  if (!sessionId) {
    return res.status(400).send('Session ID is required');
  }
  
  const redirectUrl = vncSecret 
    ? `/vnc?sessionId=${sessionId}&vncSecret=${vncSecret}` 
    : `/vnc?sessionId=${sessionId}`;
    
  res.redirect(redirectUrl);
});

// VNC viewer page
app.get('/vnc', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.redirect('/');
  }
  
  const vncSecret = req.query.vncSecret || VNC_SECRET;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Selenoid VNC - Session ${sessionId.substring(0, 8)}...</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        header {
          background-color: #333;
          color: white;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .session-info {
          font-size: 14px;
        }
        .actions a {
          color: white;
          margin-left: 15px;
          text-decoration: none;
        }
        .actions a:hover {
          text-decoration: underline;
        }
        #vnc_frame {
          width: 100%;
          height: calc(100% - 40px);
          border: none;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="session-info">
          Session ID: ${sessionId}
        </div>
        <div class="actions">
          <a href="/" title="Back to home">New Connection</a>
          <a href="#" onclick="toggleFullscreen()" title="Toggle fullscreen">Fullscreen</a>
        </div>
      </header>
      
      <iframe id="vnc_frame" 
              src="/novnc/vnc.html?host=${req.headers.host}&path=selenoid-websockify/${sessionId}&password=${vncSecret}&autoconnect=true&resize=scale&quality=6&reconnect=true" 
              allowfullscreen>
      </iframe>
      
      <script>
        function toggleFullscreen() {
          const iframe = document.getElementById('vnc_frame');
          
          if (!document.fullscreenElement) {
            if (iframe.requestFullscreen) {
              iframe.requestFullscreen();
            } else if (iframe.webkitRequestFullscreen) { 
              iframe.webkitRequestFullscreen();
            } else if (iframe.msRequestFullscreen) { 
              iframe.msRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Set up WebSocket proxy for VNC connection
app.use('/selenoid-websockify/:sessionId', (req, res, next) => {
  const sessionId = req.params.sessionId;
  
  console.log(`Creating WebSocket proxy for session ${sessionId}`);
  
  // Create a proxy for this session
  const selenoidProxy = createProxyMiddleware({
    target: `ws://${SELENIUM_GRID_HOST}`,
    ws: true,
    pathRewrite: (path) => `/vnc/${sessionId}`,
    changeOrigin: true,
    logLevel: 'debug',
    timeout: 30000,       // Increase timeout for better reliability
    buffer: false,        // Disable buffering for real-time streaming
    onError: (err, req, res) => {
      console.error(`WebSocket proxy error: ${err.message}`);
      if (!res.writableEnded) {
        res.writeHead(502, {
          'Content-Type': 'text/plain'
        });
        res.end(`Connection error to Selenoid: ${err.message}`);
      }
    }
  });
  
  selenoidProxy(req, res, next);
});

// Start the server
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Connecting to Selenoid at ${SELENIUM_GRID_HOST}`);
  console.log(`Open your browser and access: http://localhost:${PORT}`);
});