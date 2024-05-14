import * as functions from "firebase-functions";
import {getPlayerInLobbyAsync, getSpectatorInLobbyAsync} from "../providers/lobbies";
import {validateDocExistsAsync} from "./generic";
import {Lobby} from "../interfaces";


/**
 * Validates whether the use is the host in a lobby that exists.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 */
export async function validateIsHostInExistentLobbyAsync(lobbyId: string | undefined, uid: string):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  const lobbySnap = await validateIsInExistentLobbyAsync(lobbyId, uid);

  if ((lobbySnap.data() as Lobby)?.hostUser !== uid) {
    throw new functions.https.HttpsError("failed-precondition", "must be host");
  }

  return lobbySnap;
}

/**
 * Validates whether the use is in a lobby that exists.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 */
export async function validateIsInExistentLobbyAsync(lobbyId: string | undefined, uid: string):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  const lobbySnap = await validateLobbyExistsAsync(lobbyId);

  await validateIsInLobbyAsync(lobbySnap.id, uid);
  return lobbySnap;
}

/**
 * Validates whether a lobby exists.
 * @param {string | undefined} lobbyId ID of document to check.
 */
export async function validateLobbyExistsAsync(lobbyId: string | undefined):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  return await validateDocExistsAsync("lobbies", lobbyId, "lobbyId", "Lobby");
}

/**
 * Determines whether the user is in the lobby. Can be either a spectator or player. Throws error if neither.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 */
export async function validateIsInLobbyAsync(lobbyId: string, uid: string): Promise<void> {
  const getSpectatorPromise = getSpectatorInLobbyAsync(lobbyId, uid);
  const getPlayerPromise = getPlayerInLobbyAsync(lobbyId, uid);

  const participantResults = await Promise.all([getSpectatorPromise, getPlayerPromise]);

  if (!participantResults[0]?.exists && !participantResults[1]?.snap?.exists) {
    throw new functions.https.HttpsError("failed-precondition", "user must be in lobby");
  }
}
