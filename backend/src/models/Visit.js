const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: { type: String, required: true, trim: true },
    badgeNumber: String,
    status: {
      type: String,
      enum: ['pre-registered', 'checked-in', 'checked-out', 'cancelled'],
      default: 'pre-registered',
    },
    checkInTime: Date,
    checkOutTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);