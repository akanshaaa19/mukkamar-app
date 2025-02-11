const httpStatus = require('http-status');
const { Interaction } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a interaction
 * @param {Object} interactionBody
 * @returns {Promise<Interaction>}
 */
const createInteraction = async (interactionBody) => {
  const interaction = await Meeting.create(interactionBody);
  return interaction;
};

/**
 * Query for interaction
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInteractions = async (filter, options) => {
  const interactions = await Interaction.paginate(filter, options);
  return interactions;
};

/**
 * Get ineteraction by id
 * @param {ObjectId} id
 * @returns {Promise<Inetraction>}
 */
const getInteractionById = async (id) => {
  return Interaction.findById(id);
};



/**
 * Update interaction by id
 * @param {ObjectId} Id
 * @param {Object} updateBody
 * @returns {Promise<Interaction>}
 */
const updateInteractionById = async (Id, updateBody) => {
  const interaction = await getInteractionById(Id);
  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }
  
  Object.assign(interaction, updateBody);
  await interaction.save();
  return interaction;
};

/**
 * Delete meeting by id
 * @param {ObjectId} Id
 * @returns {Promise<Meeting>}
 */
const deleteInteractionById = async (Id) => {
  const interaction = await getInteractionById(Id);
  if (!interaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Interaction not found');
  }
  await interaction.remove();
  return interaction;
};

module.exports = {
  createInteraction,
  queryInteractions,
  getInteractionById,
  updateInteractionById,
  deleteInteractionById,
};
