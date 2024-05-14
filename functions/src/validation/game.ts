import {getAllPlayersAsTeamsAsync, getGameAsync} from "../providers/games";
import * as functions from "firebase-functions";
import {Game, Player} from "../interfaces";


/**
 * Validates whether the lobby's most recently created game is ready to be started.
 * Must be at least 1 player on each team and all players must be flagged as ready.
 * @param {string} lobbyId ID of the lobby to check.
 */
export async function validateIsRecentGameReadyForStartAsync(lobbyId: string): Promise<void> {
  const gameSnap = await getGameAsync(lobbyId);
  if (!gameSnap || (gameSnap.data() as Game).startDate) {
    throw new functions.https.HttpsError("failed-precondition", "game must exist and not be started");
  }

  const teamPlayersSnaps = await getAllPlayersAsTeamsAsync(lobbyId);
  for (const teamPlayersSnap of teamPlayersSnaps) {
    if (teamPlayersSnap.empty) {
      throw new functions.https.HttpsError("failed-precondition", "must be at least 1 player on teams");
    }

    for (const teamPlayerSnap of teamPlayersSnap.docs) {
      if (!(teamPlayerSnap.data() as Player).isReady) {
        throw new functions.https.HttpsError("failed-precondition", "all players must be ready");
      }
    }
  }
}
