const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createInteraction = {
  body: Joi.object().keys({
    interactionSequence: Joi.number().integer()
  }),
};

const getInteractions = {
  query: Joi.object().keys({
    interactionSequence: Joi.number().integer()
  }),
};

const getInteraction = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateInteraction = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      interactionSequence: Joi.number().integer()
    })
    .min(1),
};

const deleteInteraction = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createInteraction,
  getInteraction,
  getInteractions,
  updateInteraction,
  deleteInteraction,
};
