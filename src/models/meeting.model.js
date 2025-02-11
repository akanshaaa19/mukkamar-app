const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');

const meetingSchema = mongoose.Schema(
    {
        id: {
            type: String,
            unique: true,
            trim: true,
            required: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        topic: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: false,
            trim: true,
        },
        noOfParticipants: {
            type: Number,
            required: true,
            trim: true,
        },
        interactionsRawData: {
            type: String,
            required: false,
            trim: true,
        },
        status: {
            type: String,
            required: false,
            trim: true,
        },
        duration: {
            type: String,
            required: false,
            trim: true,
        },
        heldOn: {
            type: Date,
            required: true
        },
        hub: {
            type: String,
            required: false,
            trim: true,
        },
        meetingTranscriptRaw:{
            type: String,
            required: false,
            trim: true,
        }
    },
    {
        timestamps: true,
    }
);

/**
 * Check if meetingId is taken
 * @param {string} MeetingId - The MeetingId
 * @param {ObjectId} [excludeMeetingId] - The id of the meeting to be excluded
 * @returns {Promise<boolean>}
 */
meetingSchema.statics.isMeetingIdTaken = async function (meetingId,excludeMeetingId) {
    const meeting = await this.findOne({ id : meetingId , _id: { $ne: excludeMeetingId } });
    return !!meeting;
  };

meetingSchema.virtual('interactionsData', {
    ref: 'Interaction', //The Model to use
    localField: '_id', //Find in Model, where localField 
    foreignField: 'meeting', // is equal to foreignField
 });

 meetingSchema.virtual('meetingStats', {
    ref: 'Meeting-Stats', //The Model to use
    localField: '_id', //Find in Model, where localField 
    foreignField: 'meeting', // is equal to foreignField
 });

meetingSchema.set('toObject', { virtuals: true });
meetingSchema.set('toJSON', { virtuals: true });

// add plugin that converts mongoose to json
meetingSchema.plugin(toJSON);
meetingSchema.plugin(paginate);


/**
 * @typedef Meeting
 */
const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
/*  */