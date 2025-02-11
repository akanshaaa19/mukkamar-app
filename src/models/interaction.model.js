const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const interactionSchema = mongoose.Schema(
    {
        meeting: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Meeting',
            required: true,
        },
        interactionSequence: {
            type: Number,
            required: true,
            index: true,
        },
        durationsInSecounds: {
            type: Number
        },
        speechLanguage: {
            type: String
        },
        pId: {
            type: String
        },
        pName: {
            type: String
        },
        pType: {
            type: String
        },
        dio: {
            type: String
        },
        ci_graph: {
            type: String
        },
        vs: {
            type: Number
        },
        id: {
            type: Number
        },
        cdoi: {
            type: Number
        },
        ia: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
interactionSchema.plugin(toJSON);
interactionSchema.plugin(paginate);


/**
 * @typedef Interaction
 */
const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
