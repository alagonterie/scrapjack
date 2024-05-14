import * as admin from "firebase-admin";
import {getAllPlayersAsTeamsAsync, getGameAsync, joinGameAsync, shuffleArray} from "./games";
import * as functions from "firebase-functions";
import {delayAsync} from "../helpers/general";


/**
 * Determines whether the user is a spectator in the lobby.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 * @return {Promise} Spectator snapshot if it exists.
 */
export async function getSpectatorInLobbyAsync(lobbyId: string, uid: string):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  return (await admin.firestore().doc(`lobbies/${lobbyId}/spectators/${uid}`).get());
}

/**
 * Determines whether the user is a player in one of the teams in the lobby's active (not ended) game.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 * @return {Promise} Player snapshot if it exists.
 */
export async function getPlayerInLobbyAsync(lobbyId: string, uid: string):
  Promise<{
    snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    teamId: string
  } | undefined> {
  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap) {
    return undefined;
  }

  const team1PlayerSnapPromise = admin.firestore()
    .doc(`lobbies/${lobbyId}/games/${gameSnap.id}/teams/team1/players/${uid}`).get();
  const team2PlayerSnapPromise = admin.firestore()
    .doc(`lobbies/${lobbyId}/games/${gameSnap.id}/teams/team2/players/${uid}`).get();

  const [team1PlayerSnap, team2PlayerSnap] = await Promise.all([team1PlayerSnapPromise, team2PlayerSnapPromise]);
  if (team1PlayerSnap.exists) {
    return {snap: team1PlayerSnap, teamId: "team1"};
  } else if (team2PlayerSnap.exists) {
    return {snap: team2PlayerSnap, teamId: "team2"};
  } else {
    return undefined;
  }
}

/**
 * Gets an object describing the user's current role in the lobby.
 * @param {string} lobbyId ID of lobby to check.
 * @param {string} uid ID of user to check.
 * @return {Promise} Object describing the user's current role in the lobby.
 */
export async function getRoleInLobbyAsync(lobbyId: string, uid: string):
  Promise<{
    type: string,
    snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    teamId: string | undefined
  } | undefined> {
  let roleSnap;
  let roleType;
  let teamId;

  const spectatorSnap = await getSpectatorInLobbyAsync(lobbyId, uid);
  if (spectatorSnap?.exists) {
    roleType = "spectator";
    roleSnap = spectatorSnap;
  }

  const player = await getPlayerInLobbyAsync(lobbyId, uid);
  if (player?.snap?.exists) {
    roleType = "player";
    roleSnap = player.snap;
    teamId = player.teamId;
  }

  return roleType && roleSnap ? {type: roleType, snap: roleSnap, teamId: teamId} : undefined;
}

/**
 * Sets the host of the lobby to the next deserving participant.
 * @param {WriteBatch} writeBatch DB write batch.
 * @param {string} uid ID of current host to be replaced.
 * @param {DocumentSnapshot} lobbySnap DB snapshot of current lobby.
 */
export async function setNewLobbyHostAsync(
  writeBatch: FirebaseFirestore.WriteBatch,
  uid: string,
  lobbySnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Promise<void> {
  const players = (await getAllPlayersAsTeamsAsync(lobbySnap.id))
    .map((players) => players.docs)
    .reduce((prev, curr) => [...prev, ...curr])
    .map((player) => {
      return {id: player.id, joinDate: player.data().joinDate.toDate()};
    });

  const spectators = (await admin.firestore().collection(`lobbies/${lobbySnap.id}/spectators`).get()).docs
    .map((spectator) => {
      return {id: spectator.id, joinDate: spectator.data().joinDate.toDate()};
    });

  const users = [...players, ...spectators]
    .sort((a, b) => a.joinDate - b.joinDate)
    .filter((user) => user.id !== uid);

  const nextHostId = users[0].id;
  writeBatch.update(lobbySnap.ref, {hostUser: nextHostId});
}

/**
 * Clears all players from the lobby game, converting them to spectators.
 * @param {string} lobbyId ID of lobby.
 */
export async function clearPlayersAsync(lobbyId: string): Promise<void> {
  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap || gameSnap.data()?.startDate && !gameSnap.data()?.endDate) {
    throw new functions.https.HttpsError("failed-precondition", "game must exist and not be in progress");
  }

  const playerSnaps = await getPlayersAsync(lobbyId);

  const writeBatch = admin.firestore().batch();
  for (const playerSnap of playerSnaps) {
    const spectatorRef = admin.firestore().doc(`lobbies/${lobbyId}/spectators/${playerSnap.id}`);
    writeBatch.set(spectatorRef, {
      photoURL: playerSnap.data().photoURL,
      joinDate: new Date(),
    });

    writeBatch.delete(playerSnap.ref);
  }

  await writeBatch.commit();
}

/**
 * Shuffles all players in the lobby game, randomizing teams.
 * @param {string} lobbyId ID of lobby.
 */
export async function shufflePlayersAsync(lobbyId: string): Promise<void> {
  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap || gameSnap.data()?.startDate && !gameSnap.data()?.endDate) {
    throw new functions.https.HttpsError("failed-precondition", "game must exist and not be in progress");
  }

  const playerSnaps = await getPlayersAsync(lobbyId);
  if (playerSnaps.length === 0) {
    return;
  }

  await gameSnap.ref.update({commentaryText: "Shuffling teams..."});
  await delayAsync(1000);

  shuffleArray(playerSnaps);
  let teamJoinSwitch = Math.random() > 0.5;
  const writeBatch = admin.firestore().batch();
  while (playerSnaps.length > 0) {
    const playerSnap = playerSnaps.pop();
    const teamToJoinId = teamJoinSwitch ? "team1" : "team2";
    await joinGameAsync(playerSnap?.id as string, lobbyId, teamToJoinId, writeBatch, playerSnap, true);

    teamJoinSwitch = !teamJoinSwitch;
  }

  await writeBatch.commit();

  await delayAsync(1000);
  await gameSnap.ref.update({commentaryText: gameSnap.data()?.commentaryText});
}

/**
 * Gets all the players of a lobby.
 * @param {string} lobbyId ID of the lobby.
 */
async function getPlayersAsync(lobbyId: string) {
  return (await getAllPlayersAsTeamsAsync(lobbyId))
    .map((playersSnap) => playersSnap.docs)
    .reduce((prev, curr) => [...prev, ...curr]);
}
