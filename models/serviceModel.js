const mongoose = require('mongoose');
const slugify = require('slugify');
const mongoosastic = require('mongoosastic')

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A service must have a title'],
      unique: true,
      trim: true,
      maxlength: [40, 'A service title must have less or equal then 40 characters'],
      minlength: [10, 'A service title must have more or equal then 10 characters'],
      es_indexed: true
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'A service must have a description'],
      es_indexed: true
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
      },
      es_indexed: true
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      es_indexed: true
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


serviceSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

serviceSchema.plugin(mongoosastic, {
  host: 'localhost', // Elasticsearch server host
  port: 9200 // Elasticsearch server port
});

const Service = mongoose.model('Service', serviceSchema)

Service.createMapping((err, mapping) => {
console.log('hello');
});


module.exports = Service;
