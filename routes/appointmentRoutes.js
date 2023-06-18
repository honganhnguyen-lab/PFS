const express = require('express');
const AppointmentController = require('../controllers/appoinmentController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .post(AppointmentController.createAppoinment)

router
  .route('/:id')
  .get(AppointmentController.getAppointment)
;

module.exports = router;