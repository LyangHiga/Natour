const express = require('express');
const {
  createReview,
  getAllReviews,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');

const {
  protect,
  restrictTo,
  restrictReview,
} = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// all routes are protect
router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, restrictReview, createReview);

router
  .route('/:id')
  .delete(restrictTo('admin', 'user'), deleteReview)
  .patch(restrictTo('admin', 'user'), updateReview)
  .get(getReview);

module.exports = router;
