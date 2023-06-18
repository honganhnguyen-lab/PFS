const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Service = require('./serviceModel');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide your phoneNumber'],
    unique: true,
    minlength: 10,
    maxlength: 11,
    validate: {
      validator: function(phone) {
        return validator.isMobilePhone(phone, 'vi-VN');
      },
      message: 'Please provide a valid phoneNumber'
    }
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'provider'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: false,
    select: false
  },
  appointmentNumber: Number,
  description: String,
  category: {
    type: Array,
    required: function() {
      return this.role === 'provider';
    }
  }
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre('save', function (next) {
  const providerRequiredField = ['category', 'description', 'services']
  if (this.role === 'provider' && !this.category) {
    const error = new Error('Admin field is required.');
    return next(error);
  }
  
  next();
});

//Virtual populate
userSchema.virtual('services', {
  ref: 'Service',
  foreignField: 'providerId',
  localField: '_id'
});

userSchema.virtual('appointments', {
  ref: 'Appointment',
  foreignField: 'providerId',
  localField: '_id'
});



const User = mongoose.model('User', userSchema);

module.exports = User;
