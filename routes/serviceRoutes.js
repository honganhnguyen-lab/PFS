const express = require("express");
const serviceController = require("../controllers/serviceController");
const authController = require("../controllers/authController");

const router = express.Router();

// router.route("/top-3-outstanding").get(serviceController.aliasTopServices);

router.route("/").post(authController.protect, serviceController.createService);

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
