const express = require("express");
const multer = require("multer");
const Service = require("../models/serviceModel");

const serviceController = require("../controllers/serviceController");
const authController = require("../controllers/authController");
const AppError = require("./../utils/appError");

const router = express.Router();

// router.route("/top-3-outstanding").get(serviceController.aliasTopServices)

router
  .route("/distances/:latlng")
  .get(serviceController.getAllServiceByCategories);

router.route("/");

router
  .route("/")
  .get(serviceController.getAllService)
  .post(serviceController.createService);

router.route("/time/:id").post(serviceController.getRangeTime);

router.route("/elastic").get(serviceController.getAllServicesByElastic);

router
  .route("/:id")
  .get(serviceController.getService)
  .patch(
    // authController.protect,
    // authController.restrictTo("provider"),
    serviceController.updateService
  )
  .delete(
    // authController.protect,
    // authController.restrictTo("provider"),
    serviceController.deleteService
  );

module.exports = router;
