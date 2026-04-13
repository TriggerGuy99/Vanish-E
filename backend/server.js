require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createDrop, readAndDestroy } = require('./controllers/messageController');
const { login, getTelemetry, purgeVault } = require('./controllers/adminController');
const verifyToken = require('./middleware/auth');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.post('/api/messages', createDrop);
app.get('/api/messages/:id', readAndDestroy);

app.get('/api/health', (req, res) => res.status(200).json({ status: 'VAULT_ONLINE', time: new Date() }));

// ── Admin Routes ────────────────────────────────────────────
app.post('/api/admin/login', login);                         // public
app.get('/api/admin/telemetry', verifyToken, getTelemetry);     // protected
app.delete('/api/admin/purge', verifyToken, purgeVault);       // protected

// ── MongoDB Connection & Server Start ──────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vanish-e';
const PORT = process.env.PORT || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀  Vanish-E backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
