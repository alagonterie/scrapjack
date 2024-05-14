import {initializeApp} from "firebase-admin";

initializeApp();

exports.presence = require("./callables/presence");
exports.lobbies = require("./callables/lobbies");
exports.profiles = require("./callables/profiles");
exports.games = require("./callables/games");

exports.triggerPresence = require("./triggers/presence");
exports.triggerLobbies = require("./triggers/lobbies");
