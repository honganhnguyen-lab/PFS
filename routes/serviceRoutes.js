const express = require("express");
const multer = require("multer");
const Service = require("../models/serviceModel");

const serviceController = require("../controllers/serviceController");
const authController = require("../controllers/authController");
const AppError = require("./../utils/appError");

const router = express.Router();

// router.route("/top-3-outstanding").get(serviceController.aliasTopServices);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// router.route("/").post(upload.single("file"), serviceController.createService);

router.route("/").post(upload.single("file"), async (req, res, next) => {
  try {
    console.log(req.body.values); // Access other form data if needed
    console.log(req.file); // Access the uploaded file

    // Extract form data from the request body
    const { category, title, description, price, priceDiscount } =
      req.body.values;

    // Create the new service with the form data
    const newServiceData = {
      category: 1,
      title,
      description,
      price,
      priceDiscount,
      providerId: "6485d103e299ea61cf412742"
    };

    if (req.file) {
      newServiceData.image = {
        filename: req.file.filename,
        path: req.file.path
      };
    }
    console.log("newServiceData"), newServiceData;

    const newService = await Service.create(newServiceData);

    res.status(201).json({
      status: "success",
      data: {
        service: newService
      }
    });
  } catch (error) {
    console.error("Create service failed:", error);
    return next(new AppError("Add new service failed", 400));
  }
});
router
  .route("/distances/:latlng")
  .get(serviceController.getAllServiceByCategories);

router.route("/elastic").get(serviceController.getAllServicesByElastic);

router
  .route("/:id")
  .get(serviceController.getService)
  .patch(
    authController.protect,
    authController.restrictTo("provider"),
    serviceController.updateService
  )
  .delete(
    authController.protect,
    authController.restrictTo("provider"),
    serviceController.deleteService
  );

module.exports = router;
