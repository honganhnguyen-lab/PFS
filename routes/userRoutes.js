const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const serviceController = require("../controllers/serviceController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/sendOtp", authController.sendOtp);
router.post("/verifyOtp", authController.verifyOtp);

router.post("/login", authController.login);

router.patch("/updateMe", authController.protect, userController.updateMe);
router.delete("/deleteMe", authController.protect, userController.deleteMe);

router.route("/upload-avatar/:id").post(userController.uploadAvatar);

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.route("/:id/services").get(serviceController.getServiceByProvider);

module.exports = router;
