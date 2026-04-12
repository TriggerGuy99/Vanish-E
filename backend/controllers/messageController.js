const Message = require('../models/Message');

// POST /api/messages — save ciphertext (+ optional duressCipher), return document
const createDrop = async (req, res) => {
  try {
    const { ciphertext, duressCipher } = req.body;

    if (!ciphertext) {
      return res.status(400).json({ error: 'ciphertext is required' });
    }

    const payload = { ciphertext };
    if (duressCipher) payload.duressCipher = duressCipher;

    const newMessage = await Message.create(payload);
    return res.status(201).json(newMessage);
  } catch (err) {
    console.error('createDrop error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/messages/:id — read once, then permanently delete
const readAndDestroy = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found or already destroyed' });
    }

    // Capture both ciphers before deletion
    const { ciphertext, duressCipher } = message;

    // Permanently remove from the database (atomic burn)
    await Message.findByIdAndDelete(id);

    // Return both fields; duressCipher will be null for Level 1/2 drops
    return res.status(200).json({ ciphertext, duressCipher: duressCipher || null });
  } catch (err) {
    console.error('readAndDestroy error:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createDrop, readAndDestroy };
