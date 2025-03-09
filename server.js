const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Craps game server running at http://localhost:${port}`);
}); 