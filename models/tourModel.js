const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a Name'],
      unique: true,
      trim: true,
      // BUILT-IN Validators
      maxlength: [40, 'A tour name must not have more than 40 characters'],
      minlength: [10, 'A tour name must have at least 10 characters'],
      // validate: [validator.isAlpha, 'Name should contain only the Alhabets'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty should be one of easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating cannot be less than 1.0'],
      max: [5, 'Rating cannot be more than 5'],
      set: (val) => Math.round(val * 10) / 10, // Math.round rounds to nearest Integer, hence multiplying and dividing by 10 to ensure decimal rounding
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a Proce'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // The "this" keyword here point to only the currrent doc while creating a NEW document
          return val < this.price;
        },
        message: 'Doscount price ({VALUE}) should be less than regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a cover iage'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date], // An Array of dates
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      // types and coordinates are mandatory
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
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
    // guides: Array, // Embedding
    guides: [
      // Referencing/Normalization
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // This object is an Options object
  {
    toJSON: { virtuals: true },
    toOBJECT: { virtuals: true },
  }
);

tourSchema.index({ price: 1 }); // orderred in ascending order as price value is 1. -1 for desc.
// Compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // tour is a field in the "Review" model
  localField: '_id', // _id is called tour in the foreign/Review model
});

// DOCUMENT MIDDLEWARE: It runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// All queries starting with 'find'
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // "this" here points to the current query
  /** It is equivalent to query at line 54 in tourController, just that it's being applied
   * to all the find queries now even in findMany (getAllTours) where the documents used to
   * show up as just the IDs (i.e. reference data is getting sent as embedded data)
   */
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // remove unwanted fields from being sent in the response
  });
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log('pipeline', this.pipeline());
//   next(); // If we don't call next, the call will be stuck in that middleware
// });

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Execution time: ${Date.now() - this.start} milliseconds`);
  next();
});

// Crating a Model out of the Schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
