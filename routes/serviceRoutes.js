const express = require('express');
const serviceController = require('../controllers/serviceController');
const authController = require('../controllers/authController');

const router = express.Router();


router
  .route('/')
  .get(serviceController.getAllServices)
  .post(authController.protect, serviceController.createService);

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authController.protect,
    authController.restrictTo('provider'),
    serviceController.updateService)
  .delete(
    authController.protect,
    authController.restrictTo('provider'),
    serviceController.deleteService
);


module.exports = router;
