const Service = require("../models/serviceModel");
const User = require("./../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const esClient = require("../elasticSearch");

exports.getAllServicesByElastic = catchAsync(async (req, res, next) => {
  const reqTextSearch = req.query.search ? req.query.search : "";

  const isSortByLocation = req.query.isGeo;
  const reqRating = req.query.sortRating;
  const reqPrice = req.query.sortPrice;
  const reqCategory = Number(req.query.category);
  const reqDiscount = req.query.isDiscount;
  const lat = req.query.lat;
  const lon = req.query.lon;

  let queryBody = {
    size: 300,
    _source: true,
    script_fields: {
      distance: {
        script: {
          source:
            "if (doc.containsKey('location')) { doc['location'].arcDistanceInKm(doc['location'].coordinates[0], doc['location'].coordinates[1]) } else { doc }",
          params: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
          }
        }
      }
    },
    query: {
      bool: {
        should: [
          {
            multi_match: {
              query: reqTextSearch,
              zero_terms_query: "all",
              type: "best_fields",
              operator: "and",
              fields: ["title", "description", "phoneNumber"]
            }
          }
        ]
      }
    },
    sort: [
      {
        ratingsAverage: reqRating && "desc",
        price: reqPrice && "desc"
      }
    ]
  };

  if (isSortByLocation && lat && lon) {
    queryBody.sort.push({
      _geo_distance: {
        coords: {
          lat,
          lon
        },
        order: "asc",
        unit: "km",
        mode: "min",
        distance_type: "arc",
        ignore_unmapped: true
      }
    });
  }

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
    index: "search-services",
    body: queryBody
  });

  const formattedResults = apiResult.hits.hits.map((hit) => ({
    ...hit._source,
    distance: hit.fields.distance[0]
  }));

  res.json(formattedResults);
});

exports.getAllServiceByCategories = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const { latlng } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitutr and longitude in the format lat,lng.",
        400
      )
    );
  }

  const query = {};

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } }
    ];
  }

  const services = await Service.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $addFields: {
        distance: {
          $add: ["$distance", 0]
        }
      }
    },
    { $match: query },
    { $group: { _id: "$providerId", services: { $push: "$$ROOT" } } }
  ]);

  const providerIds = services.map((service) => service._id);

  const returnServices = await User.find({ _id: { $in: providerIds } });

  services.forEach((service) => {
    const provider = returnServices.find(
      (p) => p._id?.toString() === service._id?.toString()
    );
    service.provider = provider;
  });

  res.status(200).json({
    status: "success",
    results: services.length,
    data: {
      services
    }
  });
});

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate("providerId");

  if (!service) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      service
    }
  });
});
exports.createService = catchAsync(async (req, res, next) => {
  const newService = (await Service.create({ ...req.body })).populate({
    path: "providerId",
    select: "-__v -passwordChangedAt"
  });

  if (!newService) {
    return next(new AppError("Add new service fail", 400));
  }

  res.status(201).json({
    status: "success",
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
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      service
    }
  });
});

exports.deleteService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getServiceByProvider = catchAsync(async (req, res, next) => {
  const services = await Service.find({ providerId: req.params.id }).populate(
    "providerId"
  );

  if (!services) {
    return next(new AppError("No service found with that ID", 404));
  }

  const provider = await User.findById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      provider,
      services
    }
  });
});
