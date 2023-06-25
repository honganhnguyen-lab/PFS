const mongoose = require("mongoose");

const defineStatus = {
  pending: 0,
  confirm: 1,
  reject: 2
};

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An appointment must have its customer"]
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "An appointment must have its service"]
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "An appointment must have its provider"]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    status: {
      type: Number,
      enum: Object.values(defineStatus),
      default: defineStatus.pending
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number]
    },
    appoinmentDate: {
      type: String,
      required: [true, "An appointment must has date"]
    },
    appointmentStartTime: {
      type: String
    },
    duration: {
      type: String
    },
    checkInAt: {
      type: Date
    },
    checkOutAt: {
      type: Date
    },
    isValid: {
      type: Boolean
    },
    totalPrice: {
      type: Number
    },
    isProceed: {
      type: Boolean
    },
    rating: {
      type: String
    },
    userPoint: Number,
    providerPoint: Number
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

appointmentSchema.pre("save", function (next) {
  if (this.isProceed) {
    this.userPoint = this.price * 0.1;
  }
  next();
});

appointmentSchema.pre(/^find/, function (next) {
  this.populate({
    path: "userId"
  })
    .populate({
      path: "serviceId"
    })
    .populate({
      path: "providerId"
    })
    .lean();

  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
