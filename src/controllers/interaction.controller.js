const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { interactionService } = require('../services');

const createInteraction = catchAsync(async (req, res) => {
  const inetraction = await interactionService.createInteraction(req.body);
  res.status(httpStatus.CREATED).send(inetraction);
});

const getInteractions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await interactionService.queryInteractions(filter, options);
  res.send(result);
});

const getInteraction = catchAsync(async (req, res) => {
  const inetraction = await interactionService.getInteractionById(req.params.id);
  if (!inetraction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }
  res.send(inetraction);
});

const updateInteraction = catchAsync(async (req, res) => {
  const inetraction = await interactionService.updateInteractionById(req.params.id, req.body);
  res.send(user);
});

const deleteInteraction = catchAsync(async (req, res) => {
  await interactionService.deleteInteractionById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInteraction,
  getInteractions,
  getInteraction,
  updateInteraction,
  deleteInteraction,
};
