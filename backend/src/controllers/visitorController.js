const Visitor = require('../models/Visitor');

// POST /api/visitors
exports.createVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.create(req.body);
    res.status(201).json(visitor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/visitors?search=john
exports.getVisitors = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safe, 'i');
      filter = { $or: [{ name: regex }, { phone: regex }] };
    }

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/visitors/:id
exports.getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};