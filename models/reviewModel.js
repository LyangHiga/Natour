const mongoose = require('mongoose');
const Tour = require('./tourModel');

// rating, createdAt, ref to tour,ref to user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Review cannot be empety'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    //   tour ref
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a Tour'],
    },
    //   User ref
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'must to belong to an User'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// create a compound unique index, so only one review per user-tour can be created
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //   console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantaty: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantaty: 0,
      ratingsAverage: 4.5,
    });
  }
};

// doc middleware, is call after some doc is created
reviewSchema.post('save', async function () {
  // this points to current review
  await this.constructor.calcAverageRatings(this.tour);
});

// pre query middleware when a doc is updated or deleted, to get the tour
// findOneAndUpdate & findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
});

// post query middleware when a doc is updated or deleted, to update
// findOneAndUpdate & findOneAndDelete
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// query Middleware to get user and tour fields populated.
reviewSchema.pre(/^find/, function (next) {
  // to avoid nested populate
  //   this.populate({
  //     path: 'user',
  //     select: 'name photo',
  //   }).populate({
  //     path: 'tour',
  //     select: 'name',
  //   });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
