const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A service must have a title'],
      unique: true,
      trim: true,
      maxlength: [40, 'A service title must have less or equal then 40 characters'],
      minlength: [10, 'A service title must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'A service must have a description']
    },
    providerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A service must have its provider']
    },
    picture: {
      type: String
    },
    category: {
      type: String,
      required: [true, 'A service must have a category'],
      enum: {
        values: ['repairServices', 'maidServices', 'cleanServices', 'tutorServices'],
        message: 'Service type is either: repairServices, maidServices, cleanServices, tutorServices'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// DOCUMENT MIDDLEWARE: runs before .save() and .create()
serviceSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});



// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

// const Tour = mongoose.model('Tour', tourSchema);
const Service = mongoose.model('Service', serviceSchema)

module.exports = Service;
