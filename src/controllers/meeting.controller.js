const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { meetingService } = require('../services');

const createMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.body);
  res.status(httpStatus.CREATED).send(meeting);
});

const getMeetings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await meetingService.queryMeetings(filter, options);
  res.send(result);
});

const getMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.id);
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(meeting);
});

const updateMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.updateMeetingById(req.params.id, req.body);
  res.send(meeting);
});

const deleteMeeting = catchAsync(async (req, res) => {
  await meetingService.deleteMeetingById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
};
