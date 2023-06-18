const mongoose = require('mongoose');

const defineStatus = {
  'pending': 0,
  'confirm': 1,
  'reject': 2,
}

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'An appointment must have its customer']
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'An appointment must have its provider']
  },
  createdAt: {
      type: Date,
      default: Date.now(),
      select: false
  },
  status: {
    type: Number,
    required: [true, 'An appointment must have its status'],
    enum: {
      values: [defineStatus.pending, defineStatus.confirm, defineStatus.reject],
      message: 'Appontment status must among these type'
    },
    default: defineStatus.pending
  },
  location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number]
  },
  appoinmentDate: {
    type: Date,
    required: [true, 'An appointment must has date']
  },
  appointmentStartTime: {
    type: Date
  },
  appointmentEndTime: {
    type: Date
  },
  checkInAt: {
    type: Date
  },
  checkOutAt: {
    type: Date
  },
  isVerification: {
    type: Boolean
  }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;