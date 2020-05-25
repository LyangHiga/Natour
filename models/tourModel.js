const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour Must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour max length 40 chars'],
      minlength: [10, 'Tour min length 10 chars'],
      //   validate: [validator.isAlpha, 'Only Aplha Chars'],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      required: [true, 'Tour Must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour Must have a group size'],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    difficulty: {
      type: String,
      required: [true, 'Tour Must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Must to be easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Min Rating 1.0'],
      max: [5, 'Max Rating 5.0'],
      set: (val) => Math.round(val * 10) / 10, //4.66666667 => 47 => 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour mmust have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // this only points to current doc on NEW document creation
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount ({VALUE}) must be smaller than the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour mmust have a price'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour mmust have a cover image'],
    },
    images: [String],
    createdAT: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    startLocation: {
      // Geo Location
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Geo Location, embedded
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides embedded
    // guides: Array,
    // guides with ref
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// compound
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// geo Location index
tourSchema.index({ startLocation: '2dsphere' });

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// document middleware: runs before save() and create() not to update
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Document Middleware to save guides as an array of documents
// ony works to save and create, not to update
// tourSchema.pre('save', async function (next) {
//   const guidesPromisses = this.guides.map(
//     async (id) => await User.findById(id)
//   );
//   //   arrays of ids to arry of documents
//   this.guides = await Promise.all(guidesPromisses);
//   next();
// });

// query middleware:
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// query Middleware to get guides field populated, guides in ref mode
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
