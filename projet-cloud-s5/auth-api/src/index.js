const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-api' });
});

// Route de login (exemple simple)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // À remplacer par une véritable authentification
  if (username && password) {
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({ token });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
});
