const Service = require("../models/serviceModel");
const User = require("./../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const esClient = require("../elasticSearch");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const moment = require("moment");

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

exports.getAllService = catchAsync(async (req, res, next) => {
  const service = await Service.find();
  res.status(200).json({
    status: "success",
    results: service.length,
    data: {
      service
    }
  });
});

exports.getAllServiceByCategories = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const { latlng } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = 0.0001;

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

  let services = await Service.aggregate([
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
    { $match: query }
  ]);
  const providerIds = services.map((service) => service.providerId);

  const returnProviderDetail = await User.find({ _id: { $in: providerIds } });

  services = services.map((service) => {
    const provider = returnProviderDetail.find(
      (provider) => provider._id.toString() === service.providerId.toString()
    );
    return { ...service, provider };
  });

  res.status(200).json({
    status: "success",
    results: services.length,
    data: {
      services
    }
  });
});

const findAvailableTime = (
  timeRange,
  unavailableTime,
  duration,
  dayAppointment
) => {
  const [startTimeStr, endTimeStr] = timeRange.split("-");
  const startTime = moment(startTimeStr, "HH:mm");
  const endTime = moment(endTimeStr, "HH:mm");

  console.log("unavailableTime", unavailableTime);
  const unavailableRanges = unavailableTime
    .filter((slot) => moment(slot.day).isSame(dayAppointment, "day"))
    .map((slot) => slot.rangeTime);

  console.log("unavailableRanges", unavailableRanges);

  const availableSlots = [];
  let currentTime = startTime.clone();

  while (currentTime.isSameOrBefore(endTime)) {
    const slotEnd = currentTime.clone().add(duration, "hours");
    let overlaps = false;

    for (const range of unavailableRanges) {
      const [rangeStartStr, rangeEndStr] = range.split("-");
      const rangeStart = moment(rangeStartStr, "HH:mm");
      const rangeEnd = moment(rangeEndStr, "HH:mm");

      if (currentTime.isBefore(rangeEnd) && slotEnd.isAfter(rangeStart)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps && slotEnd.isSameOrBefore(endTime)) {
      availableSlots.push({
        start: currentTime.format("HH:mm"),
        end: slotEnd.format("HH:mm")
      });
    }

    currentTime.add(30, "minutes");
  }
  console.log("availableSlots", availableSlots);

  return availableSlots;
};

exports.getRangeTime = catchAsync(async (req, res, next) => {
  const duration = req.body.duration;
  const dayAppointment = req.body.currentDate;
  const service = await Service.findById(req.params.id).populate("providerId");
  const providerId = service.providerId;

  const timeRange = providerId ? providerId.timeRange : "";
  const unavailableTime = providerId ? providerId.unavailableTime : [];

  const availableTimeRange = findAvailableTime(
    timeRange,
    unavailableTime,
    duration,
    dayAppointment
  );
  res.status(200).json({
    status: "success",
    data: {
      availableTimeRange
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
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `${req.body.title}_avatar`,

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
  const uploadFunction = multer({ dest: "services/" }).single("image");

  uploadFunction(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.log(err);
      res.status(500).json({ message: "Something wrong happened" });
    } else if (err) {
      console.log("return 2");
      res.status(500).json({ message: err });
    } else {
      if (req.file && req.file.path) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          public_id: `${req.params.id}picture`,
          crop: "fill"
        });
        const secureImageUrl =
          result && result.url && result.url.length > 0
            ? result.url.replace(/^http:/i, "https:")
            : "";
        req.body.picture = secureImageUrl;
      }

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
  console.log("param", req.params.id);
  const services = await Service.find({ providerId: req.params.id }).populate(
    "providerId"
  );
  console.log("services", services);

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
