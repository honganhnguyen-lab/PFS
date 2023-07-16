const moment = require("moment");
const mongoose = require("mongoose");

const defineStatus = {
  notPayYet: 0,
  pending: 1,
  confirm: 2,
  reject: 3,
  processing: 4,
  done: 5
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
      default: defineStatus.notPayYet
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String
    },
    appointmentDate: {
      type: String,
      required: [true, "An appointment must has date"]
    },
    appointmentStartTime: {
      type: String
    },
    appointmentEndTime: {
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

appointmentSchema.pre(/^find/, async function (next) {
  const currentDate = moment().startOf("day");
  const appointmentDate = moment(this.getQuery().appointmentDate, "YYYY/MM/DD");
  console.log(currentDate, appointmentDate);
  if (appointmentDate.isSame(currentDate, "day")) {
    try {
      await Appointment.updateMany(
        { _id: { $in: this.getQuery()._id } },
        { $set: { status: defineStatus.processing } }
      );
      console.log("Appointment status updated successfully");
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  }

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
