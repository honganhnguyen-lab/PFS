const express = require("express");
const AppointmentController = require("../controllers/appoinmentController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .post(AppointmentController.createAppoinment)
  .get(AppointmentController.getAppointments);

router
  .route("/:id")
  .patch(
    // authController.protect,
    // authController.restrictTo("provider"),
    AppointmentController.updateAppointment
  )
  .delete(
    authController.protect,
    authController.restrictTo("provider"),
    AppointmentController.deleteAppointment
  );

router
  .route("/customer/:id")
  .get(AppointmentController.getAppointmentByCustomer);

router
  .route("/provider/:id")
  .get(AppointmentController.getAppointmentByProvider);
module.exports = router;
