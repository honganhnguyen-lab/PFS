const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');



const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
    
  res.status(200).json({
    status: 'success',
    data: {
      newUser
    }
  });
    if (!newUser) {
    return next(
      new AppError('Cannot signup new account', 500)
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { phoneNumber, password } = req.body;

  // 1) Check if phoneNumber and password exist
  if (!phoneNumber || !password) {
    return next(new AppError('Please provide phoneNumber and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ phoneNumber }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect phoneNumber or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.sendOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.body;
  const formattedPhoneNumber = '+84' + phoneNumber.replace(/^0/, '');
  const client = require("twilio")(process.env.ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  client.verify.v2
  .services(process.env.VERIFY_SID)
  .verifications.create({ to: formattedPhoneNumber, channel: "sms"})
    .then((veri) => {
      res.status(200).json({
      status: 'success',
  });
    }).catch((err) => {
    console.log(err)
  })

})

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber, code } = req.body;
  const formattedPhoneNumber = '+84' + phoneNumber.replace(/^0/, '');
  const client = require("twilio")(process.env.ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  client.verify.v2.services(process.env.VERIFY_SID)
      .verificationChecks
      .create({to: formattedPhoneNumber, code})
      .then(verification_check => {
        res.status(200).json({
        status: 'success',
        });
      })
      .catch(err => {
        return next(
        new AppError('Wrong formatted code', 400)
      );
      })
   


})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};


