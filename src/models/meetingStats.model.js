const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const meetingStatsSchema = mongoose.Schema(
    {
        meeting: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Meeting',
            required: true,
        },
        noOfParticipants: {
            type: Number,
            required: true,
            trim: true,
        },
        activeParticipants: {
            type: Number,
            required: true,
            trim: true,
        },
        activeParticipantsPer: {
            type: Number,
            required: true,
            trim: true,
        },
        partialParticipants: {
            type: Number,
            required: true,
            trim: true,
        },
        partialParticipantsPer: {
            type: Number,
            required: true,
            trim: true,
        },
        noParticipants: {
            type: Number,
            required: true,
            trim: true,
        },
        noParticipantsPer: {
            type: Number,
            required: true,
            trim: true,
        },
        spokeToSpokeCollaboration: {
            type: Number,
            required: true,
            trim: true,
        },
        spokeToSpokeCollaborationPer: {
            type: Number,
            required: true,
            trim: true,
        },
        spokeToHubCollaboration: {
            type: Number,
            required: true,
            trim: true,
        },
        spokeToHubCollaborationPer: {
            type: Number,
            required: true,
            trim: true,
        },
        totalInteractions:{
            type: Number,
            required: true,
            trim: true,
        },
        timeDurationStats:{
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
meetingStatsSchema.plugin(toJSON);
meetingStatsSchema.plugin(paginate);


/**
 * @typedef MeetingStats
 */
const MeetingStats = mongoose.model('Meeting-Stats', meetingStatsSchema);

module.exports = MeetingStats;
