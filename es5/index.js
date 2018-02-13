"use strict";

require("babel-core/register");
require("babel-polyfill");

var AudioPlayer = require('./AudioPlayer');

module.exports = AudioPlayer.default;