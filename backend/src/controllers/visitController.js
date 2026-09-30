const Visit = require('../models/Visit');

const makeBadge = () => `B-${Date.now().toString().slice(-6)}`;

// POST /api/visits
// Send "walkIn": true to check the visitor in immediately
exports.createVisit = async (req, res) => {
  try {
    const { visitor, host, purpose, walkIn } = req.body;

    const data = { visitor, host, purpose };
    if (walkIn) {
      data.status = 'checked-in';
      data.checkInTime = new Date();
      data.badgeNumber = makeBadge();
    }

    const visit = await Visit.create(data);
    res.status(201).json(visit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/visits?status=checked-in
exports.getVisits = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};

    const visits = await Visit.find(filter)
      .populate('visitor', 'name phone company')
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/visits/:id/check-in
exports.checkIn = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    if (visit.status !== 'pre-registered') {
      return res.status(400).json({ message: `Cannot check in a visit that is ${visit.status}` });
    }

    visit.status = 'checked-in';
    visit.checkInTime = new Date();
    visit.badgeNumber = makeBadge();
    await visit.save();

    res.json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/visits/:id/check-out
exports.checkOut = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    if (visit.status !== 'checked-in') {
      return res.status(400).json({ message: 'Visitor is not currently checked in' });
    }

    visit.status = 'checked-out';
    visit.checkOutTime = new Date();
    await visit.save();

    res.json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/visits/report?from=2026-09-01&to=2026-09-30
exports.getReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'from and to dates are required (YYYY-MM-DD)' });
    }

    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: 'Invalid date format, use YYYY-MM-DD' });
    }
    end.setHours(23, 59, 59, 999);

    const visits = await Visit.find({ createdAt: { $gte: start, $lte: end } })
      .populate('visitor', 'name phone company')
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.json({ total: visits.length, visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/visits/stats
exports.getStats = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [onSite, today, total] = await Promise.all([
      Visit.countDocuments({ status: 'checked-in' }),
      Visit.countDocuments({ createdAt: { $gte: startOfDay } }),
      Visit.countDocuments(),
    ]);

    res.json({ onSite, today, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/visits/today
exports.getToday = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const visits = await Visit.find({ createdAt: { $gte: start, $lte: end } })
      .populate('visitor', 'name phone company')
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.json({ total: visits.length, visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};