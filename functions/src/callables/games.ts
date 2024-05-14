import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {validateCallableContext} from "../validation/context";
import {validateIsHostInExistentLobbyAsync, validateIsInExistentLobbyAsync} from "../validation/lobbies";
import {validateDocExistsAsync} from "../validation/generic";
import {clearPlayersAsync, getRoleInLobbyAsync, shufflePlayersAsync} from "../providers/lobbies";
import {
  getGameAsync,
  getTeamAndPlayerWithActiveTurnAvailableAsync,
  handleTurnEndAsync,
  joinGameAsync,
  processTurnAsync,
  setUpInitialGameStateAsync,
  upsertGameAsync,
} from "../providers/games";
import {
  validateIsRecentGameReadyForStartAsync,
} from "../validation/game";
import {GameMode} from "../interfaces";


const validTeamIds = ["team1", "team2"];
const validTurnTypes = ["tap", "scrap", "jack"];

/**
 * The host edits the lobby game.
 * @param {string} lobbyId ID of lobby.
 * @param {string} modeId ID of game mode.
 * @param {boolean | undefined} isFreeTeamJoin Option allows lobby participants to join the game, free from host.
 * @param {boolean | undefined} isAutoPopulate Option allows game to be populated automatically with all lobby users.
 * @param {boolean | undefined} isShuffle Option to only execute a shuffling of the teams.
 * @param {boolean | undefined} isClear Option to only execute a clearing of the teams.
 */
exports.edit = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsHostInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  const db = admin.firestore();
  if (data.isClear === true) {
    await clearPlayersAsync(lobbyId);
    return;
  } else if (data.isShuffle === true) {
    await shufflePlayersAsync(lobbyId);
    return;
  }

  let modeSnap;
  const modeId: string | undefined = data.modeId;
  try {
    modeSnap = await validateDocExistsAsync("modes", modeId, "modeId", "Mode");
  } catch (e) {
    return;
  }

  const modeData = modeSnap.data() as GameMode;
  if (!modeData) {
    throw new functions.https.HttpsError("internal", "failed to fetch game mode data");
  }

  const isFreeTeamJoin = data.isFreeTeamJoin as boolean | undefined ?? true;
  const isAutoPopulate = data.isAutoPopulate as boolean | undefined ?? false;

  const writeBatch = db.batch();
  await upsertGameAsync(writeBatch, lobbyId, isFreeTeamJoin, isAutoPopulate, modeSnap);
  await writeBatch.commit();
});

/**
 * A user joins a team in the lobby game.
 * @param {string} lobbyId ID of lobby.
 * @param {string} teamId ID of team in lobby.
 */
exports.join = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const teamId: string | undefined = data.teamId;
  if (!teamId || !validTeamIds.includes(teamId)) {
    throw new functions.https.HttpsError("invalid-argument", "required field teamId is invalid");
  }

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap || gameSnap.data()?.startDate) {
    throw new functions.https.HttpsError("failed-precondition", "game must exist and not be started");
  }

  if (lobbySnap.data()?.hostUser !== uid && !gameSnap.data()?.isFreeTeamJoin) {
    throw new functions.https.HttpsError("failed-precondition", "free team joining is disabled");
  }

  const db = admin.firestore();
  const playersQuerySnap = await db.collection(`lobbies/${lobbyId}/games/game/teams/${teamId}/players`).get();
  if (playersQuerySnap.size >= 4) {
    throw new functions.https.HttpsError("failed-precondition", "team is full");
  }

  const writeBatch = db.batch();
  await joinGameAsync(uid, lobbyId, teamId, writeBatch);

  await writeBatch.commit();
});

/**
 * A player in the lobby game toggles their ready status.
 * @param {string} lobbyId ID of lobby.
 */
exports.ready = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  lobbyId = (await validateIsInExistentLobbyAsync(lobbyId, uid)).id;

  const role = await getRoleInLobbyAsync(lobbyId, uid);
  if (!role || role.type !== "player") {
    throw new functions.https.HttpsError("failed-precondition", "must be active player in lobby game");
  }

  const isReadySnap = role.snap.data()?.isReady as boolean;
  await role.snap.ref.update({isReady: !isReadySnap});
});

/**
 * The host starts the lobby game.
 * @param {string} lobbyId ID of lobby.
 */
exports.start = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsHostInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  await validateIsRecentGameReadyForStartAsync(lobbyId);

  await setUpInitialGameStateAsync(lobbyId);
});

/**
 * A player takes their turn in the active lobby game.
 * @param {string} lobbyId ID of lobby.
 * @param {string} turnType Selected turn type (tap, scrap, or jack).
 */
exports.turn = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const turnType: string | undefined = data.turnType;
  if (!turnType || !validTurnTypes.includes(turnType)) {
    throw new functions.https.HttpsError("invalid-argument", "required turnType field is invalid");
  }

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap || !gameSnap.data()?.startDate || gameSnap.data()?.endDate) {
    throw new functions.https.HttpsError("failed-precondition", "game must exist and be in progress");
  }

  const {teamSnap, playerSnap} = await getTeamAndPlayerWithActiveTurnAvailableAsync(lobbyId);
  if (playerSnap.id !== uid) {
    throw new functions.https.HttpsError("failed-precondition", "player must have turn available");
  }

  await processTurnAsync(turnType, lobbyId, gameSnap, teamSnap, playerSnap);
  await handleTurnEndAsync(lobbyId);
});

/**
 * The player leaves the lobby game and becomes a spectator.
 * @param {string} lobbyId ID of lobby.
 */
exports.leave = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  const oldRole = await getRoleInLobbyAsync(lobbyId, uid);
  if (!oldRole || oldRole.type !== "player") {
    throw new functions.https.HttpsError("failed-precondition", "must be active player in lobby game");
  }

  const gameSnap = await getGameAsync(lobbyId);
  if (gameSnap.data()?.startDate && !gameSnap.data()?.endDate) {
    throw new functions.https.HttpsError("failed-precondition", "cannot leave game in progress");
  }

  const newSpectatorRoleRef = admin.firestore().doc(`lobbies/${lobbyId}/spectators/${uid}`);

  const writeBatch = admin.firestore().batch();
  writeBatch.delete(oldRole.snap.ref);

  writeBatch.set(newSpectatorRoleRef, {
    photoURL: oldRole.snap.data()?.photoURL,
    joinDate: new Date(),
  });

  await writeBatch.commit();
});
