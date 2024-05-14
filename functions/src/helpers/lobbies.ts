import * as admin from "firebase-admin";
import {getPublicUserInfoAsync} from "./auth";
import {validateLobbyExistsAsync} from "../validation/lobbies";
import {getRoleInLobbyAsync, setNewLobbyHostAsync} from "../providers/lobbies";
import * as functions from "firebase-functions";
import {getGameAsync} from "../providers/games";


/**
 * Cleans up all the user's lobby presence.
 * @param {string} uid ID of the user.
 */
export async function lobbyCleanupAsync(uid: string): Promise<void> {
  const db = admin.firestore();
  const userLobbiesQuerySnap = await db.collection(`status/${uid}/lobbies`).get();
  if (userLobbiesQuerySnap.docs.length === 0) {
    return;
  }

  const writeBatch = admin.firestore().batch();
  for (const userLobbySnap of userLobbiesQuerySnap.docs) {
    const lobbyId = userLobbySnap.id;
    let lobbySnap;
    try {
      lobbySnap = await validateLobbyExistsAsync(lobbyId);
    } catch (e) {
      continue;
    }

    await handleLeavingLobby(writeBatch, uid, lobbySnap);
  }

  await writeBatch.commit();
}

/**
 * Performs all necessary writes to ensure a valid lobby/game after user leaves.
 * @param {WriteBatch} writeBatch DB write batch.
 * @param {string} uid ID of user leaving.
 * @param {DocumentSnapshot} lobbySnap DB snapshot of the lobby.
 * @param {string} removeType Option for showing the user as kicked/banned.
 */
export async function handleLeavingLobby(
  writeBatch: FirebaseFirestore.WriteBatch,
  uid: string,
  lobbySnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  removeType?: string
): Promise<void> {
  const db = admin.firestore();
  const isLobbyEmpty = lobbySnap.data()?.userCount <= 1;
  if (isLobbyEmpty) {
    await db.recursiveDelete(lobbySnap.ref);
  } else {
    const lobbyId = lobbySnap.id;
    const basePath = `lobbies/${lobbyId}`;
    const {username} = await getPublicUserInfoAsync(uid);
    const lobbyMessageRef = db.collection(`${basePath}/messages`).doc();
    const role = await getRoleInLobbyAsync(lobbyId, uid);
    if (!role) {
      throw new functions.https.HttpsError("internal", "failed to fetch user role in lobby");
    }

    if (role.type === "player") {
      const gameSnap = await getGameAsync(lobbyId);
      
      if (gameSnap.data()?.startDate) {
        const remainingTeamPlayers = await db.collection(`${basePath}/games/game/teams/${role.teamId}/players`).get();
        
        if (remainingTeamPlayers.size <= 1) {
          const winningTeamName = role.teamId === "team1" ? "Team 2" : "Team 1";
          const losingTeamName = role.teamId === "team1" ? "Team 1" : "Team 2";

          const gameRef = db.doc(`${basePath}/games/game`);
          writeBatch.set(gameRef, {
            endDate: new Date(),
            commentaryText: `${winningTeamName} Scrapped a Win!`,
            subCommentText: `${losingTeamName} forfeited...`,
            turnText: "",
          }, {merge: true});
        }
      }
    }

    if (lobbySnap.data()?.hostUser === uid) {
      await setNewLobbyHostAsync(writeBatch, uid, lobbySnap);
    }

    writeBatch.update(lobbySnap.ref, {
      userCount: admin.firestore.FieldValue.increment(-1),
    });

    const removedPhrase = removeType === "kick" ? "was kicked" : removeType === "ban" ? "was banned" : "left the lobby";
    writeBatch.set(lobbyMessageRef, {
      sendDate: new Date(),
      text: `${username} ${removedPhrase}...`,
    });

    if (role.snap) {
      writeBatch.delete(role.snap.ref);
    }
  }

  const userStatusRef = db.doc(`status/${uid}/lobbies/${lobbySnap.id}`);
  writeBatch.delete(userStatusRef);
}
