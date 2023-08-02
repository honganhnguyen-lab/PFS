const Service = require("../models/serviceModel");
const User = require("./../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const esClient = require("../elasticSearch");
const multer = require("multer");

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
        distance: "30mi",
        coordinates: hit._source.location.coordinates, // Use hit._source.location.coordinates here
        nested_path: "location",
        order: "asc",
        unit: "km",
        mode: "min",
        distance_type: "plane",
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

  const formattedResults = apiResult.hits.hits.map((hit) => {
    const coordinates = hit._source.location.coordinates;
    const distance = hit.fields ? hit.fields["location.distance"] : null;
    console.log("Coordinates:", coordinates);
    console.log("Distance:", hit);
    return {
      ...hit._source,
      distance: distance !== null ? distance[0] : 0
    };
  });

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
  const { category, title, description, price, priceDiscount } = req.body;

  // Create the new service with the form data
  const newServiceData = {
    category,
    title,
    description,
    price,
    priceDiscount
  };

  // If an image was uploaded, add its details to the new service data
  if (req.file) {
    newServiceData.image = {
      filename: req.file.filename,
      path: req.file.path
      // Add other image details if needed (e.g., width, height, mime, etc.)
    };
  }

  // Create the new service with the updated data
  const newService = await Service.create(newServiceData);
  await newService
    .populate({ path: "providerId", select: "-__v -passwordChangedAt" })
    .execPopulate();

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
