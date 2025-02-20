const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const { authService, userService, tokenService, emailService } = require('../services');

const { getRedemptionOptionsFromSheets, rechargePhone, getOperatorDetails } = require('./utils.js');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const refershApp = catchAsync(async (req, res) => {
  res.send({ msg: 'App Refershed..' });
});

const addPoints = catchAsync(async (req, res) => {
  var eventName = req.body.event_name;

  switch (eventName) {
    case 'get-operator':
      console.log('---- Handling event:' + eventName + ' -------');
      getOperatorDetails(req, res);
      break;

    case 'redeem-points':
      console.log('---- Handling event:' + eventName + ' -------');
      rechargePhone(req, res);
      break;
    case 'recharge-options':
      console.log('---- Handling event:' + eventName + ' -------');
      getRedemptionOptionsFromSheets(req, res);
      break;
    default:
  }
});

module.exports = {
  register,
  refershApp,
  login,
  addPoints,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
