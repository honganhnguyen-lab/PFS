const Service = require("../models/serviceModel");
const User = require("./../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const esClient = require("../elasticSearch");
const multer = require("multer");
const cloudinary = require("../cloudinary");

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
  try {
    const apiResult = await esClient.search({
      index: "search-services",
      body: queryBody
    });

    const formattedResults = apiResult.hits.hits.map((hit) => {
      const distance = hit.fields ? hit.fields["location.distance"] : null;
      return {
        ...hit._source,
        distance: distance !== null ? distance[0] : 0
      };
    });

    res.json(formattedResults);
  } catch (err) {
    console.log("err", err);
  }
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
    const provider = returnServices.find((p) => p._id === service._id);
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
  const uploadFunction = multer({ dest: "services/" }).single("image");
  uploadFunction(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(500).json({ message: "Something wrong happened" });
    } else if (err) {
      res.status(500).json({ message: err });
    } else {
      console.log("req.path", req.file.path);
      console.log("req.body", req.body);
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `${req.body.title}_avatar`,
        width: 500,
        height: 500,
        crop: "fill"
      });
      const secureImageUrl =
        result && result.url && result.url.length > 0
          ? result.url.replace(/^http:/i, "https:")
          : "";
      req.body.picture = secureImageUrl;

      const newService = await Service.create(req.body);
      await newService
        .populate({ path: "providerId", select: "-__v -passwordChangedAt" })
        .execPopulate();

      res.status(201).json({
        status: "success",
        data: {
          service: newService
        }
      });
    }
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  console.log("hello");
  const uploadFunction = multer({ dest: "services/" }).single("image");
  console.log("hi");
  uploadFunction(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.log(err);
      res.status(500).json({ message: "Something wrong happened" });
    } else if (err) {
      console.log("return 2");
      res.status(500).json({ message: err });
    } else {
      console.log("return 3");
      console.log("req.path", req.file.path);

      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `${req.query.id}picture`,
        width: 500,
        height: 500,
        crop: "fill"
      });
      const secureImageUrl =
        result && result.url && result.url.length > 0
          ? result.url.replace(/^http:/i, "https:")
          : "";
      req.body.picture = secureImageUrl;

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
