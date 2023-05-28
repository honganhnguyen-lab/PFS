const Service = require('../models/serviceModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllServices = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Service.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const services = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: services.length,
        data: {
            services
        }
    });
});

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate('providerId');

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
})
exports.createService = catchAsync(async (req, res, next) => {
  const newService = await Service.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      service: newService
    }
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service
    }
  });
});

exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});