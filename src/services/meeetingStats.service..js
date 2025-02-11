const httpStatus = require('http-status');
const { MeetingStats } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a meetingStats
 * @param {Object} meetingBody
 * @returns {Promise<Meeting>}
 */
const createMeetingStats = async (meetingStatsBody) => {
  const meetingStats = await MeetingStats.create(meetingStatsBody);
  return meetingStats;
};

/**
 * Query for meetingsStats
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryMeetingStats = async (filter, options) => {
  const meetingStats = await MeetingStats.paginate(filter, options);
  return meetingStats;
};

/**
 * Get meetingStats by id
 * @param {ObjectId} id
 * @returns {Promise<Meeting>}
 */
const getMeetingStatsById = async (id) => {
  return MeetingStats.findById(id);
};

/**
 * Get meetingStats by meetingId
 * @param {string} meetingStatsId
 * @returns {Promise<MeetingStats>}
 */
const getMeetingStatsByMeetingStatsId = async (meetingStatsId) => {
  return MeetingStats.findOne({ id: meetingStatsId });
};

/**
 * Update meetingStats by id
 * @param {ObjectId} Id
 * @param {Object} updateBody
 * @returns {Promise<MeetingStats>}
 */
const updateMeetingStatsById = async (Id, updateBody) => {
  const meetingStats = await getMeetingStatsById(Id);
  if (!meetingStats) {
    throw new ApiError(httpStatus.NOT_FOUND, 'MeetingStats not found');
  }
 
  Object.assign(meetingStats, updateBody);
  await meetingStats.save();
  return meetingStats;
};

/**
 * Delete meetingStats by id
 * @param {ObjectId} Id
 * @returns {Promise<Meeting>}
 */
const deleteMeetingStatsById = async (Id) => {
  const meetingStats = await getMeetingStatsById(Id);
  if (!meetingStats) {
    throw new ApiError(httpStatus.NOT_FOUND, 'MeetingStats not found');
  }
  await meetingStats.remove();
  return meetingStats;
};


/*
* Calculates partcipation metrics by analysing the interctaions data
*
* Returns an array where each key is the metric and value is the computaed value of that metric 
* 
*/
const getParticipationStats = (interactionData, totalParticipants) => {
    let meetingMetrics = {};
	   let activeParticipantsStats = getActiveParticipantsPercentage(interactionData, totalParticipants);
	   let partialParticipantsStats = getPartialParticipantsPercentage(interactionData, totalParticipants);
	   let noParticipationStats = getNoParticipantsPercentage(interactionData, totalParticipants);	   
	   meetingMetrics['total_participants'] = totalParticipants;
	   meetingMetrics['active_participatants'] = activeParticipantsStats.activeParticipants;
	   meetingMetrics['active_participation_percent'] = activeParticipantsStats.activeParticipantsPer;
	   meetingMetrics['partial_participation'] = partialParticipantsStats.partialParticipants;
	   meetingMetrics['partial_participation_percent'] = partialParticipantsStats.partialParticipantsPer;
	   meetingMetrics['no_participation'] = noParticipationStats.noParticipation; 
	   meetingMetrics['no_participation_percent'] = noParticipationStats.noParticipationPer; 
    return meetingMetrics;
}

/*
* Calculates collaboration metrics by analysing the interctaions data
*
* Returns an array where each key is the metric and value is the computaed value of that metric 
* 
*/
const getCollaborationStats = (interactionData) => {
    let meetingMetrics = {};
  	let spokeToSpokeStats = getSpokeToSpokePercentage(interactionData);
	let spokeToHubStats = getSpokeToHubPercentage(interactionData);
	  meetingMetrics['sopke_to_spoke_collaboration'] = spokeToSpokeStats.spokeToSpokeInteractions;
	  meetingMetrics['sopke_to_spoke_collaboration_percent'] = spokeToSpokeStats.spokeToSpokeInteractionsPer;
	  meetingMetrics['sopke_to_hub_collaboration'] = spokeToHubStats.spokeToHubInteractions;
	  meetingMetrics['sopke_to_hub_collaboration_percent'] = spokeToHubStats.spokeToHubInteractionsper;
	  meetingMetrics['total_interactions'] = spokeToHubStats.totalInteractions;
    return meetingMetrics;
}

/*
* Calculates Time distribution metrics by analysing the interctaions data
*
* Returns an array where each key is the time duration and value is the computaed value of that metric 
* 
*/
const getTimespentDistribution = (interactionData) => {
  let timeDurationDist = new Array(); 
  timeDurationDist = computeTimespentDistribution(interactionData);
  return timeDurationDist;
}

/**
* Returns the active participation percentage based on the users participation.
* 
* Counts number of intercations of each participant, finds number of intercations that are matched as per the threshold passed. 
*
*/
const getActiveParticipantsPercentage = (interactions, totalParticipants) =>{
	
	// Read this from config file and later from database
	let activeThreshold = 3;
	
	// get participant wise intercations data
	let participants = getParticipantsWiseInteractions(interactions);
	
	// Find people who spoke as per the threshold
	let activeParticipants = 0;
	for (var participantName in participants){
		let partInts =  participants[participantName];
		if(partInts.length > activeThreshold){
			activeParticipants++;
		}
	}
	// Canculate percentage
	let percentage = (activeParticipants/totalParticipants)*100;
	let data = {};
	data.activeParticipants = activeParticipants;
	data.activeParticipantsPer = percentage;
		
	return data;
}

/**
* Returns the partial participation percentage based on the users participation. 
*  
* Counts number of intercations of each participant, finds number of intercations that are matched as per the threshold passed. 
*
*/
const getPartialParticipantsPercentage = (interactions, totalParticipants) =>{
	
	// Read this from config file and later from database
	let thresholdMin = 1;
	let thresholdMax = 3;
	
	// get participant wise intercations data
	let participants = getParticipantsWiseInteractions(interactions);
	
	// Find people who spoke within the defined threshold
	let partialParticipants = 0;
	for (var participantName in participants){
		let partInts =  participants[participantName];
		if(partInts.length >= thresholdMin && partInts.length <= thresholdMax){
			partialParticipants++;
		}
	}
	// Canculate percentage
	let percentage = (partialParticipants/totalParticipants)*100;
	
	let data = {};
	data.partialParticipants = partialParticipants;
	data.partialParticipantsPer = percentage;
	
	return data;
}

/**
* Returns the value of percentage where there is no participation 
*  
* Counts number of intercations of each participant, finds the count of users where there is no participation 
*
*/
const getNoParticipantsPercentage = (interactions, totalParticipants) =>{
	
	// get participant wise intercations data
	let participants = getParticipantsWiseInteractions(interactions);
	let noParticipationUsers = totalParticipants - Object.keys(participants).length;

	// Canculate percentage
	let percentage = (noParticipationUsers/totalParticipants)*100;
	
	console.log("noParticipationUsers:"+noParticipationUsers);
	console.log("percentage:"+percentage);
	
	let data = {};
	data.noParticipation = noParticipationUsers;
	data.noParticipationPer = percentage;

	return data;
}


/**
* Returns the spoke to spoke percentage  
*  
* Counts number of intercations where the response was to the hub 
*
*/
const getSpokeToSpokePercentage = (interactions) => {
	
	let totalInteractions = interactions['videos'][0]['data'].length;
	let spokeToSpokeInteractions = 0;
	let hubInteraction = getHubInteraction(interactions);
	let hubPersonId = hubInteraction['pid']; 
	for (var i = 0; i < interactions['videos'][0]['data'].length; i++){
		let ptype = interactions['videos'][0]['data'][i]['ptype'];
		// Take only intercations where spoke is involved
		if(ptype == 'spoke')
		{
			let intAfterPersonid = interactions['videos'][0]['data'][i]['ia'];
			if(intAfterPersonid != hubPersonId) {
				spokeToSpokeInteractions++;
			}
		}
	}

	// Canculate percentage
	let percentage = (spokeToSpokeInteractions/totalInteractions)*100;
	
	let data = {};

	data.totalInteractions = totalInteractions;
	data.spokeToSpokeInteractions = spokeToSpokeInteractions;
	data.spokeToSpokeInteractionsPer = percentage;

	return data;
}

/**
* Returns the spoke to hub percentage  
*  
* Counts number of intercations where the response was to the hub 
*
*/
const getSpokeToHubPercentage = (interactions) => {
	
	let totalInteractions = interactions['videos'][0]['data'].length;
	let spokeToHubInteractions = 0;
	let hubInteraction = getHubInteraction(interactions);
	let hubPersonId = hubInteraction['pid']; 
	for (var i = 0; i < interactions['videos'][0]['data'].length; i++){
		let ptype = interactions['videos'][0]['data'][i]['ptype'];
		let intAfterPersonid = interactions['videos'][0]['data'][i]['ia'];
		if(intAfterPersonid == hubPersonId || ptype == 'hub') {
			spokeToHubInteractions++;
		}
	}

	// Canculate percentage
	let percentage = (spokeToHubInteractions/totalInteractions)*100;
	
	let data = {};

	data.totalInteractions = totalInteractions;
	data.spokeToHubInteractions = spokeToHubInteractions;
	data.spokeToHubInteractionsper = percentage;
	
	return data;
}

/**
* Returns the Hub details from the intercation data
*
*/
const getHubInteraction = (interactions) => {
	
	// First item in the interaction data is assumed to be Hub. 
	// Validate this with meeting metadata 
	let hubInteraction = interactions['videos'][0]['data'][0];
	return hubInteraction;
}

/**
* Iterates over the interations data and returns the data by participant
*
* Returns an array in which ket is the partcipant name and value is array of intercations.
* */
const getParticipantsWiseInteractions = (interactions) =>{
	var participants = new Array();
	for (var i = 0; i < interactions['videos'][0]['data'].length; i++){
		let pname = interactions['videos'][0]['data'][i]['pname'];
		if(!(pname in participants)){
			let participantIntercations = new Array();
			participantIntercations.push(interactions['videos'][0]['data'][i]);
			participants[pname] = participantIntercations;   	
		}else{
			let participantIntercations = participants[pname];
			participantIntercations.push(interactions['videos'][0]['data'][i]);
			participants[pname] = participantIntercations;
		}
	}
	return participants;
}

/**
* Iterates over the interations data and returns distribution of time spent by participants
*
* Returns an array in which ket is the distribution string and value is the count
* */
const computeTimespentDistribution = (interactions) => {
	var timeDuration = {};
	for (var i = 0; i < interactions['videos'][0]['data'].length; i++){
		let durationOfInteraction = interactions['videos'][0]['data'][i]['dio'];
		let minutes = Math.floor(durationOfInteraction / 10);
		let key = minutes+" minutes";
		if(minutes < 1){
			key = "< 1 minute";
		}
		if(minutes > 10){
			key = "> 10 minute";
		}
		
		if(!(key in timeDuration)){
			let participantsCount = 1;
			timeDuration[key] = participantsCount;   	
		}else{
			
			let participantsCount = timeDuration[key];
			participantsCount++;
			timeDuration[key] = participantsCount;
		}
	}
	return timeDuration;
}


module.exports = {
  createMeetingStats,
  queryMeetingStats,
  getMeetingStatsById,
  getMeetingStatsByMeetingStatsId,
  updateMeetingStatsById,
  deleteMeetingStatsById,
  getParticipationStats,
  getCollaborationStats,
  getTimespentDistribution	
};
