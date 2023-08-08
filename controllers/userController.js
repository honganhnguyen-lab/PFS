const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const multer = require("multer");

const fs = require("fs");
const cloudinary = require("../cloudinary");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "phoneNumber");

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null
  });
});

exports.getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).populate("services");

  if (!user) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user
    }
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!"
  });
};
exports.updateUser = catchAsync(async (req, res) => {
  const userUpdate = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!userUpdate) {
    return next(new AppError("No service found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: userUpdate
    }
  });
});
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!"
  });
};

exports.uploadAvatar = catchAsync(async (req, res) => {
  const uploadFunction = multer({ dest: "uploads/" }).single("avatar");

  uploadFunction(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(500).json({ message: "Something wrong happened" });
    } else if (err) {
      res.status(500).json({ message: err });
    } else {
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: `${req.params.id}_avatar`,
        width: 500,
        height: 500,
        crop: "fill"
      });
      const secureImageUrl =
        result && result.url && result.url.length > 0
          ? result.url.replace(/^http:/i, "https:")
          : "";

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { photo: secureImageUrl },
        { new: true, runValidators: true }
      );
      console.log(result.url);

      res.status(200).json({
        status: "success",
        data: {
          avatarUrl: user.photo
        }
      });
    }
  });
});
