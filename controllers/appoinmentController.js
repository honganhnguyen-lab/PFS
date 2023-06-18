const Appointment = require('../models/appointmentModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


exports.createAppoinment = catchAsync(async (req, res, next) => {
  const newAppointment = (await Appointment.create({ ...req.body }))

    if (!newAppointment) {
    return next(new AppError('Add new service fail', 400));
  }

  res.status(201).json({
    status: 'success',
    data: {
      service: newAppointment
    }
  });
});

exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id).populate('userId')
  .populate('providerId')

  if (!appointment) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      appointment
    }
  });
})