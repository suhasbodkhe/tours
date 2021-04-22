const crypto = require('crypto');
const util = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY_TIME,
  });

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRY * 24 * 3600 * 1000 // converting to milliseconds
    ),
    httpOnly: true,
  };

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  cookieOptions.secure =
    req.secure || req.headers('x-forwarded-proto') === 'https';

  res.cookie('jwt', token, cookieOptions);

  // Remove password field from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  // Below way of creating a user will ensure that only the required values are picked up.
  // If we use the way mentioned above to reate user, someone can, for example, add any desired role and login

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    photo: req.body.photo,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if the email and password exist.
  if (!email || !password) {
    next(
      new AppError(
        'Please ensure both the email and password fields are not empty',
        400
      )
    );
  }

  // 2. Check if the user exists and the password is correct.
  const user = await User.findOne({ email }).select('+password'); // "select +" here adds the password field back to the query results.

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. If everything is OK, send the JWT back to the client.
  createAndSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

// This middleware Protects a route from unauthorized access.
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Getting token and check if it's available/exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to get access', 401)
    );
  }

  // 2. Verification token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user (belonging to this token) no longer exists', 401)
    );
  }

  // 4. Check if user changed password after the JWT is issued.
  if (currentUser.afterPasswordChanged(decoded.iat)) {
    // iat is "issued at" and "eat" is "expires at"
    return next(
      new AppError(
        'User has recently changed the password. Please login again',
        401
      )
    );
  }

  // Grants access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// This middleware is used only for rendered pages and hence no errors are expected here.
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1. Verify token
      const decoded = await util.promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3. Check if user changed password after the JWT is issued.
      if (currentUser.afterPasswordChanged(decoded.iat)) {
        // iat is "issued at" and "eat" is "expires at"
        return next();
      }

      // Execution reached here and it means the User is logged in
      res.locals.user = currentUser; // pug templates can now access the user from a variable on locals (which is "user")
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError("You're not authorized to perform this action", 403)
    );
  }

  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with the email address provided', 404)
    );
  }

  // 2. Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  //******** Note the option in save method *********/
  await user.save({ validateBeforeSave: false });

  // 3. Send it to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    // console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save({ validateBeforeSave: false });

    next(
      new AppError('There was an error sending an email. Try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the resetToken
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: Date.now() },
  });

  // 2. If token has not expired and the user exists, setthe new password
  if (!user) {
    return next(
      new AppError(
        'Password reset request/token is either invalid or expired',
        400
      )
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save(); // We used "save" and not "findByIdandUpdate" method because we want all teh validations to happen

  // 3. Update passwordChangedAt property for the current user. This is being done through the middleware
  // 4. Log the user in, i.e. send the JWT
  createAndSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get use from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('The password you provided is wrong', 401));
  }

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log the user in, send JWT
  createAndSendToken(user, 200, req, res);
});
