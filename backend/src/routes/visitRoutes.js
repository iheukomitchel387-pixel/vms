const router = require('express').Router();
const { body } = require('express-validator');
const {
  createVisit, getVisits, checkIn, checkOut, getReport, getStats, getToday,
} = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .post(
    authorize('admin', 'receptionist', 'security'),
    [
      body('visitor').isMongoId().withMessage('A valid visitor ID is required'),
      body('host').isMongoId().withMessage('A valid host ID is required'),
      body('purpose').trim().notEmpty().withMessage('Purpose is required'),
    ],
    validate,
    createVisit
  )
  .get(getVisits);

router.get('/stats', getStats);
router.get('/today', getToday);
router.get('/report', authorize('admin', 'manager'), getReport);

router.patch('/:id/check-in', authorize('admin', 'receptionist', 'security'), checkIn);
router.patch('/:id/check-out', authorize('admin', 'receptionist', 'security'), checkOut);

module.exports = router;