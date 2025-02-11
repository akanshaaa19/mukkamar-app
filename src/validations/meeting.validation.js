const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createMeeting = {
  body: Joi.object().keys({
    id: Joi.string(),
    name: Joi.string(),
    topic: Joi.string(),
    noOfParticipants: Joi.number().integer(),
    interactionsRawData: Joi.string(),
    heldOn: Joi.date(),
    hub: Joi.string(),
    duration: Joi.string()
  }),
};

const getMeetings = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getMeeting = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateMeeting = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      id: Joi.string(),
      name: Joi.string(),
      topic: Joi.string(),
      noOfParticipants: Joi.number().integer(),
      interactionsRawData: Joi.string(),
      heldOn: Joi.date(),
      hub: Joi.string(),
      duration: Joi.string()
    })
    .min(1),
};

const deleteMeeting = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createMeeting,
  getMeeting,
  getMeetings,
  updateMeeting,
  deleteMeeting,
};
