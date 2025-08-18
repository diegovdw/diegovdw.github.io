const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const PAD_SPELERS = path.join(__dirname, 'docs/data/spelers.json');

app.use(express.static('docs'));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
