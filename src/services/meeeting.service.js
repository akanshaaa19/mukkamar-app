const httpStatus = require('http-status');
const { Meeting, Interaction,MeetingStats } = require('../models');
const meetinStatsService = require('./meeetingStats.service.');
const ApiError = require('../utils/ApiError');

/**
 * Create a meeting
 * @param {Object} meetingBody
 * @returns {Promise<Meeting>}
 */
const createMeeting = async (meetingBody) => {
  if (await Meeting.isMeetingIdTaken(meetingBody.id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Meeting Id already taken');
  }
  let interactionRawData = JSON.parse(meetingBody.interactionsRawData);

  if(!interactionRawData.hasOwnProperty('videos') && interactionRawData['videos'].length <= 0)
  {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Interaction Raw Data.');
  }
  const meeting = await Meeting.create(meetingBody);
  /**
   * 
   * index is hardcoded to 0 for Now. Revist during cleanup.
   * 
   */
  let interactionSequenceList  = interactionRawData['videos'][0]['data'];
  let seqSeed = 1;
  let interactionsList = [];
  var interactionInsert = new Promise((resolve, reject) => {
     interactionSequenceList.forEach(async (interactionInstance) => {
      interactionInstance.meeting = meeting;
      interactionInstance.interactionSequence = seqSeed;
        seqSeed = seqSeed+ 1;
         const interaction =  await Interaction.create(interactionInstance);
        if (interactionSequenceList.length < seqSeed) resolve();
    }); 
  });
  var meetingStatsInsert = new Promise(async (resolve, reject) => {
   let participationStats = meetinStatsService.getParticipationStats(interactionRawData, meeting.noOfParticipants);
   let collaborationStats = meetinStatsService.getCollaborationStats(interactionRawData);
   let timeDurationDist = meetinStatsService.getTimespentDistribution(interactionRawData);
   let meetingStatsData = {};
   meetingStatsData.meeting  = meeting;
   meetingStatsData.noOfParticipants = meeting.noOfParticipants;

   meetingStatsData.activeParticipants = participationStats.active_participatants;
   meetingStatsData.activeParticipantsPer= participationStats.active_participation_percent;
   meetingStatsData.partialParticipants= participationStats.partial_participation;
   meetingStatsData.partialParticipantsPer= participationStats.partial_participation_percent;
   meetingStatsData.noParticipants= participationStats.no_participation;
   meetingStatsData.noParticipantsPer= participationStats.no_participation_percent;


   meetingStatsData.spokeToSpokeCollaboration= collaborationStats.sopke_to_spoke_collaboration;
   meetingStatsData.spokeToSpokeCollaborationPer= collaborationStats.sopke_to_spoke_collaboration_percent;
   meetingStatsData.spokeToHubCollaboration= collaborationStats.sopke_to_hub_collaboration;
   meetingStatsData.spokeToHubCollaborationPer= collaborationStats.sopke_to_hub_collaboration_percent;
   meetingStatsData.totalInteractions= collaborationStats.total_interactions;
   meetingStatsData.timeDurationStats= JSON.stringify(timeDurationDist);

   const meetinStats =  await MeetingStats.create(meetingStatsData);
   resolve();
  });

  await Promise.all([interactionInsert,meetingStatsInsert]);
  return meeting;
};

/**
 * Query for meetings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMeetings = async (filter, options) => {
  const meetings = await Meeting.paginate(filter, options);
  return meetings;
};

/**
 * Get meeting by id
 * @param {ObjectId} id
 * @returns {Promise<Meeting>}
 */
const getMeetingById = async (id) => {
  return Meeting.findById(id).populate('interactionsData').populate('meetingStats');
};

/**
 * Get meeting by meetingId
 * @param {string} meetingId
 * @returns {Promise<Meeting>}
 */
const getMeetingByMeetingId = async (meetingId) => {
  return Meeting.findOne({ id: meetingId }).populate('interactionsData');
};

/**
 * Update meeting by id
 * @param {ObjectId} Id
 * @param {Object} updateBody
 * @returns {Promise<Meeting>}
 */
const updateMeetingById = async (Id, updateBody) => {
  const meeting = await getMeetingById(Id);
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  if (updateBody.id && (await Meeting.isMeetingIdTaken(updateBody.id, Id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Meeting Id already taken');
  }
  Object.assign(meeting, updateBody);
  await meeting.save();
  return meeting;
};

/**
 * Delete meeting by id
 * @param {ObjectId} Id
 * @returns {Promise<Meeting>}
 */
const deleteMeetingById = async (Id) => {
  const meeting = await getMeetingById(Id);
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  await meeting.remove();
  return meeting;
};

module.exports = {
  createMeeting,
  queryMeetings,
  getMeetingById,
  getMeetingByMeetingId,
  updateMeetingById,
  deleteMeetingById,
};
