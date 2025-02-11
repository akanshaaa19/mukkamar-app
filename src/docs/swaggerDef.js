const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Speaker Diarization Service API documentation',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/intelspace-tech/user-points-service/blob/dev-mongo/LICENSE',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

module.exports = swaggerDef;
