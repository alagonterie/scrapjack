import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {validateCallableContext} from "../validation/context";
import {getPublicUserInfoAsync} from "../helpers/auth";
import {
  validateIsHostInExistentLobbyAsync,
  validateIsInExistentLobbyAsync,
  validateLobbyExistsAsync,
} from "../validation/lobbies";
import {cleanProfanity} from "../validation/profanity";
import {getRoleInLobbyAsync} from "../providers/lobbies";
import {autoPopulateAsync, getGameAsync, upsertGameAsync} from "../providers/games";
import {handleLeavingLobby} from "../helpers/lobbies";


const validMoveTypes = ["host", "spec", "team1", "team2", "swap", "kick", "ban"];

/**
 * The user sends a message in the lobby chat.
 * @param {string} lobbyId ID of the lobby.
 * @param {string} text Text content of the message.
 */
exports.sendMessage = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  let lobbyId: string | undefined = data.lobbyId;
  lobbyId = (await validateIsInExistentLobbyAsync(lobbyId, uid)).id;

  const text: string | undefined = data.text;
  if (!text || text.length < 1 || text.length > 280) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "required text field must be at most 280 characters.");
  }

  const sendDate = new Date();
  const {username} = await getPublicUserInfoAsync(uid);

  const lobbyMessageRef = admin.firestore().collection(`lobbies/${lobbyId}/messages`).doc();
  await lobbyMessageRef.set({
    sendDate: sendDate,
    text: cleanProfanity(text),
    username: username,
  });
});

/**
 * The user enters a lobby. TODO: Also join game if auto populate.
 * @param {string} lobbyId ID of the lobby.
 */
exports.enter = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateLobbyExistsAsync(lobbyId);
  lobbyId = lobbySnap.id;

  const uid = authData.uid;
  const db = admin.firestore();
  const isBanned = (await db.doc(`lobbies/${lobbyId}/banned/${uid}`).get()).exists;
  if (isBanned) {
    throw new functions.https.HttpsError("failed-precondition", "banned from lobby");
  }

  const lobbyData = lobbySnap.data();
  if (!lobbyData || lobbyData.userCount >= lobbyData.maxUsers) {
    throw new functions.https.HttpsError("failed-precondition", "cannot join a full lobby");
  }

  const joinDate = new Date();
  const {username, photoURL} = await getPublicUserInfoAsync(uid);

  const userStatusRef = db.doc(`status/${uid}`);
  const lobbyStatusRef = db.collection(`status/${uid}/lobbies`).doc(lobbyId);
  const lobbyMessageRef = db.collection(`lobbies/${lobbyId}/messages`).doc();

  const writeBatch = db.batch();
  writeBatch.set(userStatusRef, {
    isKicked: admin.firestore.FieldValue.delete(),
    isBanned: admin.firestore.FieldValue.delete(),
  }, {merge: true});
  writeBatch.update(lobbySnap.ref, {
    userCount: admin.firestore.FieldValue.increment(1),
  });
  writeBatch.set(lobbyMessageRef, {
    sendDate: joinDate,
    text: `${username} joined the lobby...`,
  });
  writeBatch.set(lobbyStatusRef, {joinDate: joinDate});

  const gameSnap = await getGameAsync(lobbyId);
  if (gameSnap.data()?.isAutoPopulate) {
    await autoPopulateAsync(lobbyId, writeBatch, uid, photoURL);
  } else {
    const lobbySpectatorRef = db.collection(`lobbies/${lobbyId}/spectators`).doc(uid);
    writeBatch.set(lobbySpectatorRef, {
      joinDate: joinDate,
      photoURL: photoURL,
    });
  }

  await writeBatch.commit();
});

/**
 * The user leaves a lobby.
 * @param {string} lobbyId ID of the lobby.
 */
exports.leave = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uid = authData.uid;
  const lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsInExistentLobbyAsync(lobbyId, uid);

  const writeBatch = admin.firestore().batch();

  await handleLeavingLobby(writeBatch, uid, lobbySnap);

  await writeBatch.commit();
});

/**
 * The user creates a lobby.
 * @param {string} lobbyId ID of the lobby.
 */
exports.create = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const lobbyName: string | undefined = data.lobbyName;
  if (!lobbyName || lobbyName.length < 6 || lobbyName.length > 16) {
    throw new functions.https.HttpsError("invalid-argument", "invalid lobby name");
  }

  const maxUsers: number | undefined = data.maxUsers;
  if (!maxUsers || maxUsers < 2 || maxUsers > 8) {
    throw new functions.https.HttpsError("invalid-argument", "invalid lobby max players");
  }

  const db = admin.firestore();
  const modeSnap = await db.doc("modes/default").get();

  const writeBatch = db.batch();
  const lobbyRef = db.collection("lobbies").doc();
  writeBatch.create(lobbyRef, {
    lobbyName: cleanProfanity(lobbyName),
    hostUser: authData.uid,
    createBy: authData.uid,
    createDate: new Date(),
    maxUsers: maxUsers,
    userCount: 0,
  });

  await upsertGameAsync(writeBatch, lobbyRef.id, true, false, modeSnap);
  await writeBatch.commit();

  return {
    lobbyId: lobbyRef.id,
  };
});

/**
 The host updates the state of a user in the lobby.
 @param {string} lobbyId ID of the lobby.
 @param {string} uidMove ID of the user to update.
 @param {string} moveType Determines how the user will be updated.
 */
exports.moveUser = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const uidMove: string | undefined = data.uidMove;
  if (!uidMove) {
    throw new functions.https.HttpsError("invalid-argument", "uidMove field is required");
  }

  const uid = authData.uid;
  if (uid === uidMove) {
    throw new functions.https.HttpsError("invalid-argument", "host cannot move themselves");
  }

  const moveType: string | undefined = data.moveType;
  if (!moveType || !validMoveTypes.includes(moveType)) {
    throw new functions.https.HttpsError("invalid-argument", "required moveType field is invalid");
  }

  let lobbyId: string | undefined = data.lobbyId;
  const lobbySnap = await validateIsHostInExistentLobbyAsync(lobbyId, uid);
  lobbyId = lobbySnap.id;

  const oldRoleMove = await getRoleInLobbyAsync(lobbyId, uidMove);
  if (!oldRoleMove) {
    throw new functions.https.HttpsError("failed-precondition", "user to move must be in the lobby");
  }

  if (["swap", "spec"].includes(moveType) && (oldRoleMove.type !== "player" || !oldRoleMove.teamId)) {
    throw new functions.https.HttpsError("failed-precondition", "user must be player for that move");
  }

  if (["team1", "team2"].includes(moveType) && oldRoleMove.type !== "spectator") {
    throw new functions.https.HttpsError("failed-precondition", "user must be spectator for that move");
  }

  const db = admin.firestore();
  const userStatusRef = db.doc(`status/${uidMove}`);

  const isRemove = ["kick", "ban"].includes(moveType);

  const writeBatch = db.batch();
  if (isRemove) {
    await handleLeavingLobby(writeBatch, uidMove, lobbySnap, moveType);

    const isBan = moveType === "ban";
    if (isBan) {
      const userBannedRef = db.collection(`lobbies/${lobbyId}/banned`).doc(uidMove);

      writeBatch.set(userStatusRef, {isBanned: true}, {merge: true});
      writeBatch.set(userBannedRef, {});
    } else {
      writeBatch.set(userStatusRef, {isKicked: true}, {merge: true});
    }
  } else {
    const oldRoleData = oldRoleMove.snap.data();

    if (moveType === "swap") {
      const newTeamId = oldRoleMove.teamId === "team1" ? "team2" : "team1";
      const newRoleMoveRef = db.doc(`lobbies/${lobbyId}/games/game/teams/${newTeamId}/players/${uidMove}`);

      writeBatch.delete(oldRoleMove.snap.ref);
      writeBatch.set(newRoleMoveRef, {
        isReady: oldRoleData?.isReady,
        turnScore: -1,
        turnTapCount: 0,
        isTurnAvailable: false,
        photoURL: oldRoleData?.photoURL,
        joinDate: oldRoleData?.joinDate,
      });
    } else if (["team1", "team2"].includes(moveType)) {
      const newRoleMoveRef = db.doc(`lobbies/${lobbyId}/games/game/teams/${moveType}/players/${uidMove}`);

      writeBatch.delete(oldRoleMove.snap.ref);
      writeBatch.set(newRoleMoveRef, {
        isReady: false,
        turnScore: -1,
        turnTapCount: 0,
        isTurnAvailable: false,
        photoURL: oldRoleData?.photoURL,
        joinDate: new Date(),
      });
    } else if (moveType === "spec") {
      const newRoleMoveRef = db.doc(`lobbies/${lobbyId}/spectators/${uidMove}`);

      writeBatch.delete(oldRoleMove.snap.ref);
      writeBatch.set(newRoleMoveRef, {
        photoURL: oldRoleData?.photoURL,
        joinDate: new Date(),
      });
    } else if (moveType === "host") {
      const lobbyRef = db.doc(`lobbies/${lobbyId}`);

      writeBatch.update(lobbyRef, {hostUser: uidMove});
    } else {
      throw new functions.https.HttpsError("internal", "unexpected move type");
    }
  }

  await writeBatch.commit();
});
