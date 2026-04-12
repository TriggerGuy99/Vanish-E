const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ciphertext: {
    type: String,
    required: true,
  },
  duressCipher: {
    type: String,
    default: null,  // only present for Level 3 (Duress Protocol) drops
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // 24 hours in seconds
  },
});

module.exports = mongoose.model('Message', messageSchema);
