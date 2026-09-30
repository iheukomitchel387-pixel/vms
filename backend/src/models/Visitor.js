const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    company: { type: String, trim: true },
    idType: { type: String, trim: true },   // e.g. National ID, Driver's License
    idNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visitor', visitorSchema);