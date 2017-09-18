require("babel-core/register");
require("babel-polyfill");

const AudioPlayer = require('./AudioPlayer');

module.exports = AudioPlayer.default;
