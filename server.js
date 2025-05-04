const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Handle all routes and send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
  console.log(`Open this URL in your browser to play the game without CORS issues`);
}); 