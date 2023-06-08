const Service = require('../models/serviceModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const esClient = require('../elasticSearch');

exports.getAllServices = catchAsync(async (req, res, next) => {
  const reqTextSearch = req.query.search ? req.query.search : ''
  const reqGeolocation = req.query.sortGeo;
  const reqRating = req.query.sortRating;
  const reqPrice = req.query.sortPrice;
  const reqCategory = Number(req.query.category);
  const reqDiscount = req.query.isDiscount;

  let queryBody = {
    size: 300,
    query: {
    bool: {
      should: [
        {
          multi_match: {
            query: reqTextSearch,
            zero_terms_query: 'all',
            type: 'best_fields',
            operator: 'and',
            fields: ['title', 'description', 'serviceName', 'phoneNumber']
          }
        },
      ],
    }
    },
    sort: [
      {
        ratingsAverage: reqRating,
        price: reqPrice
      }
    ],
};

if (reqCategory) {
  queryBody.query.bool.filter = [
    {
      term: {
        category: reqCategory
      }
    }
  ];
}
  if (reqDiscount) {
   queryBody.query.bool.filter = [
    {
      term: {
        isDiscount: reqDiscount
      }
    }
  ];
}

  const apiResult = await esClient.search({
    index: 'search-family-services',
    body: queryBody
  })

  res.json(apiResult.hits.hits);
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
  const newService = await Service.create({ ...req.body });

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

exports.getServiceByProvider = catchAsync(async (req, res, next) => {
  const service = await Service.find({ providerId: req.params.id })

  if (!service) {
    return next(new AppError('No service found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { service }
  });
})
