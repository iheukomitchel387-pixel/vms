const Visit = require('../models/Visit');
const { sendBadgeEmail, sendHostRequestEmail } = require('../utils/sendEmail');
const { encryptPayload, decryptPayload } = require('../utils/qrCrypto');

const makeBadge = () => `B-${Date.now().toString().slice(-6)}`;
const DAY = 24 * 60 * 60 * 1000;

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (title, body) =>
  `<!doctype html><html><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>` +
  `<style>body{font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:0 16px;color:#1f2937}` +
  `button{display:block;width:100%;border:0;border-radius:8px;padding:14px 22px;font-size:16px;color:#fff;cursor:pointer;margin:0 0 16px}` +
  `.accept{background:#16a34a;margin-top:24px}.decline{background:#dc2626}</style></head>` +
  `<body><h2>${esc(title)}</h2>${body}</body></html>`;

// Regular employees only see visits where they are the host
const scopeFor = (req) => (req.user.role === 'employee' ? { host: req.user.id } : {});

// Emails the encrypted QR pass to the visitor. Never throws.
const notifyVisitor = async (visit) => {
  try {
    await visit.populate([
      { path: 'visitor', select: 'name email' },
      { path: 'host', select: 'name' },
    ]);

    if (!visit.visitor?.email) return false;

    const qrData = encryptPayload({
      id: visit._id.toString(),
      badge: visit.badgeNumber,
      exp: Date.now() + DAY,
    });

    await sendBadgeEmail({
      to: visit.visitor.email,
      visitorName: visit.visitor.name,
      badgeNumber: visit.badgeNumber,
      hostName: visit.host?.name || 'Reception',
      purpose: visit.purpose,
      checkInTime: visit.checkInTime,
      qrData,
    });
    return true;
  } catch (err) {
    console.error('Badge email failed:', err.message);
    return false;
  }
};

// Emails the host a request to accept or decline. Never throws.
const notifyHost = async (visit) => {
  try {
    await visit.populate([
      { path: 'visitor', select: 'name company' },
      { path: 'host', select: 'name email' },
    ]);

    if (!visit.host?.email) return false;

    const token = encryptPayload({
      type: 'host-response',
      id: visit._id.toString(),
      exp: Date.now() + DAY,
    });
    const base = process.env.BACKEND_URL || 'http://localhost:5000';

    await sendHostRequestEmail({
      to: visit.host.email,
      hostName: visit.host.name,
      visitorName: visit.visitor?.name || 'A visitor',
      company: visit.visitor?.company,
      purpose: visit.purpose,
      link: `${base}/api/visits/respond?t=${token}`,
    });
    return true;
  } catch (err) {
    console.error('Host email failed:', err.message);
    return false;
  }
};

const readHostToken = (t) => {
  try {
    const p = decryptPayload(String(t || '').trim());
    if (p.type !== 'host-response') return { error: 'This link is not valid.' };
    if (p.exp && Date.now() > p.exp) return { error: 'This link has expired.' };
    return { id: p.id };
  } catch {
    return { error: 'This link is not valid.' };
  }
};

// POST /api/visits
// Creates the visit and emails the host to accept or decline
exports.createVisit = async (req, res) => {
  try {
    const { visitor, host, purpose, walkIn } = req.body;

    const visit = await Visit.create({
      visitor, host, purpose, walkIn: !!walkIn, approval: 'pending',
    });
    const hostEmailSent = await notifyHost(visit);

    res.status(201).json({ ...visit.toObject(), hostEmailSent });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/visits?status=checked-in
exports.getVisits = async (req, res) => {
  try {
    const filter = { ...scopeFor(req) };
    if (req.query.status) filter.status = req.query.status;

    const visits = await Visit.find(filter)
      .populate('visitor', 'name phone company')
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/visits/:id/check-in  (reception override, or check-in of an accepted visit)
exports.checkIn = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    if (visit.status !== 'pre-registered') {
      return res.status(400).json({ message: `Cannot check in a visit that is ${visit.status}` });
    }

    visit.status = 'checked-in';
    visit.approval = 'accepted';
    visit.checkInTime = new Date();
    visit.badgeNumber = makeBadge();
    await visit.save();

    const emailSent = await notifyVisitor(visit);

    res.json({ ...visit.toObject(), emailSent });
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
    const scope = scopeFor(req);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [onSite, today, total] = await Promise.all([
      Visit.countDocuments({ ...scope, status: 'checked-in' }),
      Visit.countDocuments({ ...scope, createdAt: { $gte: startOfDay } }),
      Visit.countDocuments(scope),
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

    const visits = await Visit.find({
      ...scopeFor(req),
      createdAt: { $gte: start, $lte: end },
    })
      .populate('visitor', 'name phone company')
      .populate('host', 'name email')
      .sort({ createdAt: -1 });

    res.json({ total: visits.length, visits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/visits/scan   body: { "code": "<text read from the QR>" }
exports.scanCode = async (req, res) => {
  try {
    let payload;
    try {
      payload = decryptPayload(String(req.body.code).trim());
    } catch {
      return res.status(400).json({ message: 'Invalid or tampered code' });
    }

    if (payload.exp && Date.now() > payload.exp) {
      return res.status(400).json({ message: 'This code has expired' });
    }

    const visit = await Visit.findById(payload.id)
      .populate('visitor', 'name phone company')
      .populate('host', 'name email');

    if (!visit || !payload.badge || visit.badgeNumber !== payload.badge) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.json(visit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/visits/respond?t=...   (public, opened from the host's email)
exports.showResponsePage = async (req, res) => {
  try {
    const t = readHostToken(req.query.t);
    if (t.error) return res.status(400).send(page('Link problem', `<p>${esc(t.error)}</p>`));

    const visit = await Visit.findById(t.id)
      .populate('visitor', 'name company')
      .populate('host', 'name');
    if (!visit) return res.status(404).send(page('Not found', '<p>This visit no longer exists.</p>'));

    if (visit.approval !== 'pending' || visit.status !== 'pre-registered') {
      return res.send(page('Already handled', `<p>This request has already been ${esc(visit.approval)}.</p>`));
    }

    res.send(
      page(
        'Visitor waiting for you',
        `<p><b>${esc(visit.visitor?.name)}</b>${visit.visitor?.company ? ` from ${esc(visit.visitor.company)}` : ''} is at reception.</p>` +
          `<p><b>Purpose of the meeting:</b><br>${esc(visit.purpose)}</p>` +
          `<form method="POST" action="/api/visits/respond">` +
          `<input type="hidden" name="t" value="${esc(req.query.t)}">` +
          `<button class="accept" name="action" value="accept">Accept</button>` +
          `<button class="decline" name="action" value="decline">Decline</button>` +
          `</form>`
      )
    );
  } catch (err) {
    res.status(500).send(page('Error', '<p>Something went wrong. Please try again.</p>'));
  }
};

// POST /api/visits/respond   (public, form submitted from the page above)
exports.handleResponse = async (req, res) => {
  try {
    const t = readHostToken(req.body.t);
    if (t.error) return res.status(400).send(page('Link problem', `<p>${esc(t.error)}</p>`));

    const action = req.body.action;
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).send(page('Link problem', '<p>Invalid choice.</p>'));
    }

    const visit = await Visit.findById(t.id);
    if (!visit) return res.status(404).send(page('Not found', '<p>This visit no longer exists.</p>'));

    if (visit.approval !== 'pending' || visit.status !== 'pre-registered') {
      return res.send(page('Already handled', `<p>This request has already been ${esc(visit.approval)}.</p>`));
    }

    if (action === 'decline') {
      visit.approval = 'declined';
      visit.status = 'cancelled';
      await visit.save();
      return res.send(page('Visit declined', '<p>Reception has been informed. You can close this page.</p>'));
    }

    visit.approval = 'accepted';
    if (visit.walkIn) {
      visit.status = 'checked-in';
      visit.checkInTime = new Date();
      visit.badgeNumber = makeBadge();
    }
    await visit.save();
    if (visit.walkIn) await notifyVisitor(visit);

    res.send(page('Visit accepted', '<p>Thank you. The visitor has been checked in. You can close this page.</p>'));
  } catch (err) {
    res.status(500).send(page('Error', '<p>Something went wrong. Please try again.</p>'));
  }
};