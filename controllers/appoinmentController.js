const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.createAppoinment = catchAsync(async (req, res, next) => {
  const newAppointment = await Appointment.create({ ...req.body });

  if (!newAppointment) {
    return next(new AppError("Add new service fail", 400));
  }
  const newAppointmentId = newAppointment.id;

  res.status(201).json({
    status: "success",
    data: {
      newAppointmentId
    }
  });
});

exports.getAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: {
      appointments
    }
  });
});

exports.updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (req.body.status && req.body.status === 2) {
    const startTime = appointment.appointmentStartTime;
    const endTime = appointment.appointmentEndTime;
    const date = appointment.appointmentDate;
    const provider = appointment.providerId;
    console.log("appointment", startTime, endTime, date, provider);
  }

  if (!appointment) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});

exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getAppointmentByProvider = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.find({ providerId: req.params.id });

  if (!appointment) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { appointment }
  });
});

exports.getAppointmentByCustomer = catchAsync(async (req, res, next) => {
  console.log("id", req.params.id);

  const appointment = await Appointment.find({ userId: req.params.id });

  res.status(200).json({
    status: "success",
    data: {
      appointment
    }
  });
});
