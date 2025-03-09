const http = require('http');
const WebSocket = require('ws');
const os = require('os'); // To get network interfaces

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running\n');
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Object to store rooms and their connected clients
const rooms = {};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'join') {
        const room = data.room;
        if (!rooms[room]) rooms[room] = [];
        rooms[room].push(ws);
        ws.room = room;
        console.log(`Client joined room: ${room}`);
      } else if (data.type === 'action') {
        const room = ws.room;
        if (room && rooms[room]) {
          rooms[room].forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      }
    } catch (error) {
      console.error('Invalid message received:', message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

// Get the container's IP address
function getServerAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost'; // Fallback if no external IP is found
}

// Start the server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  const address = getServerAddress();
  console.log(`Server listening on http://${address}:${PORT}`);
  console.log(`Use this WebSocket address: ws://${address}:${PORT}`);
});
