const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosastic = require('mongoosastic');
const ElasticClient = require('../elasticSearch');

const defineCategory = {
  'repairServices': 0,
  'maidServices': 1,
  'cleanServices': 2,
  'tutorServices': 3
}

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A service must have a title'],
      unique: true,
      trim: true,
      maxlength: [40, 'A service title must have less or equal then 40 characters'],
      minlength: [10, 'A service title must have more or equal then 10 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'A service must have a description'],
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
        values: [defineCategory.cleanServices, defineCategory.maidServices, defineCategory.repairServices, defineCategory.tutorServices],
        message: 'Service type is either: repairServices, maidServices, cleanServices, tutorServices'
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
    },
    isDiscount: {
      type: Boolean,
      default: false
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


serviceSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  console.log('priceDiscount', this.priceDiscount)
  this.isDiscount = this.priceDiscount ? true : false
  next();
});

serviceSchema.pre('find', function (next) { 
  this.populate("providerId")
  next();
});



const Service = mongoose.model('Service', serviceSchema)


module.exports = Service;
