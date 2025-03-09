const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server to satisfy Render's requirements
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running\n');
});

// Create a WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Object to store rooms and their connected clients
const rooms = {};

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle incoming messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle 'join' message: add client to the specified room
      if (data.type === 'join') {
        const room = data.room;
        if (!rooms[room]) rooms[room] = [];
        rooms[room].push(ws);
        ws.room = room;
        console.log(`Client joined room: ${room}`);
      }

      // Handle 'action' message: broadcast action to other clients in the same room
      else if (data.type === 'action') {
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

  // Handle client disconnection: remove client from room
  ws.on('close', () => {
    console.log('Client disconnected');
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
      if (rooms[room].length === 0) {
        delete rooms[room];
        console.log(`Room ${room} deleted`);
      }
    }
  });
});

// Set the server to listen on the port provided by Render or default to 8080
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Listen on all network interfaces
server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
