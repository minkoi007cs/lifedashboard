const handler = require('../apps/api/dist/main').default;

module.exports = (req, res) => handler(req, res);
