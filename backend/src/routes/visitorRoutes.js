const router = require('express').Router();
const { body } = require('express-validator');
const { createVisitor, getVisitors, getVisitor } = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router
  .route('/')
  .post(
    authorize('admin', 'receptionist', 'security'),
    [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('phone').trim().notEmpty().withMessage('Phone is required'),
      body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    ],
    validate,
    createVisitor
  )
  .get(getVisitors);

router.get('/:id', getVisitor);

module.exports = router;