import * as admin from "firebase-admin";
import {getPublicUserInfoAsync} from "../helpers/auth";
import * as functions from "firebase-functions";
import {Game, GameMode, Player, Team} from "../interfaces";
import {getRoleInLobbyAsync} from "./lobbies";


/**
 * Gets the most recent game in a lobby. Game can be in created, started, or ended state.
 * @param {string} lobbyId ID of the lobby to check.
 */
export async function getGameAsync(lobbyId: string):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  const gameQuery = admin.firestore().doc(`lobbies/${lobbyId}/games/game`);

  return await gameQuery.get();
}

/**
 Gets all players of a game, separated by team.
 @param {string} lobbyId ID of the game lobby.
 */
export async function getAllPlayersAsTeamsAsync(lobbyId: string):
  Promise<[FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>,
    FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>]> {
  const team1PlayersSnapPromise = admin.firestore()
    .collection(`lobbies/${lobbyId}/games/game/teams/team1/players`).get();
  const team2PlayersSnapPromise = admin.firestore()
    .collection(`lobbies/${lobbyId}/games/game/teams/team2/players`).get();

  return await Promise.all([team1PlayersSnapPromise, team2PlayersSnapPromise]);
}

/**
 * Sets up the initial game state for a game being started.
 * @param {string} lobbyId ID of the game lobby.
 */
export async function setUpInitialGameStateAsync(lobbyId: string): Promise<void> {
  const db = admin.firestore();
  const firstTeamChoice = randomIntBetween(1, 2);
  const firstTeamPlayersSnap = await db
    .collection(`lobbies/${lobbyId}/games/game/teams/team${firstTeamChoice}/players`)
    .orderBy("joinDate", "desc")
    .get();

  const otherTeamPlayersSnap = await db
    .collection(`lobbies/${lobbyId}/games/game/teams/team${3 - firstTeamChoice}/players`)
    .get();

  const writeBatch = db.batch();
  for (const playerSnap of firstTeamPlayersSnap.docs) {
    writeBatch.update(playerSnap.ref, {isTurnAvailable: true});
  }
  for (const playerSnap of [...firstTeamPlayersSnap.docs, ...otherTeamPlayersSnap.docs]) {
    writeBatch.update(playerSnap.ref, {isReady: false});
  }

  const {username: firstPlayerName} = await getPublicUserInfoAsync(firstTeamPlayersSnap.docs[0].id);

  const gameRef = db.doc(`lobbies/${lobbyId}/games/game`);
  writeBatch.update(gameRef, {
    commentaryText: "Tap, Scrap, and Jack!",
    subCommentText: `'${firstPlayerName}' taps first`,
    turnText: `Turn: '${firstPlayerName}'`,
    startDate: new Date(),
  });

  await writeBatch.commit();
}

/**
 * Gets the team and player with the current turn available in a game.
 * @param {string} lobbyId ID of the lobby.
 */
export async function getTeamAndPlayerWithActiveTurnAvailableAsync(lobbyId: string):
  Promise<{
    teamSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    playerSnap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
  }> {
  const db = admin.firestore();
  function getTeamPlayerPromise(teamId: string) {
    const teamPromise = db.doc(`lobbies/${lobbyId}/games/game/teams/${teamId}`).get();
    const playerPromise = db
      .collection(`lobbies/${lobbyId}/games/game/teams/${teamId}/players`)
      .where("isTurnAvailable", "==", true)
      .orderBy("joinDate", "desc")
      .limit(1)
      .get();

    return {teamPromise, playerPromise};
  }

  const team1Promise = getTeamPlayerPromise("team1");
  const team2Promise = getTeamPlayerPromise("team2");
  const results = await Promise.all([
    team1Promise.teamPromise,
    team1Promise.playerPromise,
    team2Promise.teamPromise,
    team2Promise.playerPromise,
  ]);

  if (results[1].docs[0]?.data().isTurnAvailable) {
    return {teamSnap: results[0], playerSnap: results[1].docs[0]};
  } else if (results[3].docs[0]?.data().isTurnAvailable) {
    return {teamSnap: results[2], playerSnap: results[3].docs[0]};
  } else {
    throw new functions.https.HttpsError("internal", "no player with available turn found");
  }
}

/**
 * Creates or updates the lobby game.
 * @param {WriteBatch} writeBatch DB write batch.
 * @param {string} lobbyId ID of the lobby.
 * @param {boolean} isFreeTeamJoin Option to enable/disable free team joining.
 * @param {boolean} isAutoPopulate Option to enable/disable game auto population.
 * @param {DocumentSnapshot} modeSnap DB snapshot of the game mode for the updated game.
 */
export async function upsertGameAsync(
  writeBatch: FirebaseFirestore.WriteBatch,
  lobbyId: string,
  isFreeTeamJoin: boolean,
  isAutoPopulate: boolean,
  modeSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): Promise<void> {
  const db = admin.firestore();
  const gameSnap = await getGameAsync(lobbyId);
  if (gameSnap?.exists && gameSnap.data()?.startDate && !gameSnap.data()?.endDate) {
    throw new functions.https.HttpsError("failed-precondition", "cannot create while game in progress");
  }

  if (isAutoPopulate) {
    await autoPopulateAsync(lobbyId, writeBatch);
  }

  const modeData = modeSnap.data();
  if (!modeData) {
    throw new functions.https.HttpsError("internal", "failed to fetch game mode data");
  }

  const gameRef = db.doc(`lobbies/${lobbyId}/games/game`);
  const team1Ref = db.doc(`lobbies/${lobbyId}/games/game/teams/team1`);
  const team2Ref = db.doc(`lobbies/${lobbyId}/games/game/teams/team2`);

  writeBatch.set(gameRef, {
    mode: {
      id: modeSnap.id,
      name: modeData.name,
      roundMaxCount: modeData.roundMaxCount,
      turnMaxScore: modeData.turnMaxScore,
      rollLow: modeData.rollLow,
      rollHigh: modeData.rollHigh,
      tapsBeforeJack: modeData.tapsBeforeJack,
      jackMultiplier: modeData.jackMultiplier,
    },
    commentaryText: `Waiting for ${isFreeTeamJoin ? "players" : "host"}...`,
    subCommentText: `'${modeData.name}' mode`,
    turnText: "",
    roundEndCount: 0,
    isFreeTeamJoin: isFreeTeamJoin === undefined ? false : isFreeTeamJoin,
    isAutoPopulate: isAutoPopulate === undefined ? true : isAutoPopulate,
    createDate: new Date(),
    recentRoll: admin.firestore.FieldValue.delete(),
    startDate: admin.firestore.FieldValue.delete(),
    endDate: admin.firestore.FieldValue.delete(),
  }, {merge: true});
  writeBatch.set(team1Ref, {
    teamTotalScore: 0,
    teamTurnAverageScore: 0,
    teamTurnEndCount: 0,
  }, {merge: true});
  writeBatch.set(team2Ref, {
    teamTotalScore: 0,
    teamTurnAverageScore: 0,
    teamTurnEndCount: 0,
  }, {merge: true});
}

/**
 * Populates and balances teams in the given lobby game by having all spectators join the game.
 * @param {string} lobbyId ID of the lobby.
 * @param {WriteBatch} writeBatch DB write batch.
 * @param {string | undefined} spectatorId Optional spectator ID used when only adding a single player to game.
 * @param {string | undefined} spectatorPhoto Optional spectator photo used when only adding a single player to game.
 */
export async function autoPopulateAsync(
  lobbyId: string,
  writeBatch: FirebaseFirestore.WriteBatch,
  spectatorId?: string,
  spectatorPhoto?: string
): Promise<void> {
  const db = admin.firestore();
  const basePath = `lobbies/${lobbyId}`;
  let spectatorSnaps: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  if (!spectatorId) {
    const spectatorsQuerySnap = await db.collection(`${basePath}/spectators`).get();
    if (spectatorsQuerySnap.size === 0) {
      return;
    }

    spectatorSnaps = spectatorsQuerySnap.docs;
    shuffleArray(spectatorSnaps);
  }

  const team1Promise = db.collection(`${basePath}/games/game/teams/team1/players`).get();
  const team2Promise = db.collection(`${basePath}/games/game/teams/team2/players`).get();
  const [team1Size, team2Size] = (await Promise.all([team1Promise, team2Promise])).map((team) => team.size);

  const bigTeamSize = Math.max(team1Size, team2Size);
  const sizeDifference = Math.abs(team1Size - team2Size);
  const smallTeamId = bigTeamSize === team1Size ? "team2" : "team1";

  if (spectatorId) {
    const newPlayerRef = db.doc(`lobbies/${lobbyId}/games/game/teams/${smallTeamId}/players/${spectatorId}`);
    writeBatch.set(newPlayerRef, {
      isReady: false,
      turnScore: -1,
      turnTapCount: 0,
      isTurnAvailable: false,
      photoURL: spectatorPhoto,
      joinDate: new Date(),
    });
    return;
  }

  for (let i = 0; i < Math.min(sizeDifference, spectatorSnaps.length); i++) {
    const spectatorSnap = spectatorSnaps.pop();
    await joinGameAsync(spectatorSnap?.id as string, lobbyId, smallTeamId, writeBatch, spectatorSnap);
  }

  let teamJoinSwitch = Math.random() > 0.5;
  while (spectatorSnaps.length > 0) {
    const spectatorSnap = spectatorSnaps.pop();
    const teamToJoinId = teamJoinSwitch ? "team1" : "team2";
    await joinGameAsync(spectatorSnap?.id as string, lobbyId, teamToJoinId, writeBatch, spectatorSnap);

    teamJoinSwitch = !teamJoinSwitch;
  }
}

/**
 * The given user joins the game.
 * @param {string} uid ID of the user joining.
 * @param {string} lobbyId ID of the lobby.
 * @param {string} teamId ID of the team being joined.
 * @param {WriteBatch} writeBatch DB write batch.
 * @param {DocumentSnapshot | undefined} oldRoleSnap Optional DB snapshot of the given user's current role in the lobby.
 * @param {boolean} preserveJoinDate Option to preserve the previous join date, if any.
 */
export async function joinGameAsync(
  uid: string,
  lobbyId: string,
  teamId: string,
  writeBatch: FirebaseFirestore.WriteBatch,
  oldRoleSnap?: FirebaseFirestore.DocumentSnapshot,
  preserveJoinDate = false
): Promise<void> {
  let oldRole;
  if (!oldRoleSnap) {
    oldRole = (await getRoleInLobbyAsync(lobbyId, uid))?.snap;
  } else {
    oldRole = oldRoleSnap;
  }

  if (!oldRole) {
    throw new functions.https.HttpsError("internal", "failed to find user in lobby");
  }

  const newTeamPlayerRoleRef = admin.firestore().doc(`lobbies/${lobbyId}/games/game/teams/${teamId}/players/${uid}`);

  writeBatch.delete(oldRole.ref);
  writeBatch.set(newTeamPlayerRoleRef, {
    isReady: oldRole.data()?.isReady ?? false,
    turnScore: -1,
    turnTapCount: 0,
    isTurnAvailable: false,
    photoURL: oldRole.data()?.photoURL,
    joinDate: preserveJoinDate ? oldRole.data()?.joinDate : new Date(),
  });
}

/**
 * Executes the chosen turn type for the player.
 * @param {string} turnType The type of turn to execute.
 * @param {string} lobbyId ID of the game lobby.
 * @param {QueryDocumentSnapshot} gameSnap DB snapshot of the game.
 * @param {DocumentSnapshot} teamSnap DB snapshot of the team taking the turn.
 * @param {QueryDocumentSnapshot} playerSnap DB snapshot of the player taking the turn.
 */
export async function processTurnAsync(
  turnType: string,
  lobbyId: string,
  gameSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  teamSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  playerSnap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Promise<void> {
  let newTurnScore = 0;
  let isTurnOver = false;

  const player = playerSnap.data() as Player;
  const mode = gameSnap.data()?.mode as GameMode;
  const {username} = await getPublicUserInfoAsync(playerSnap.id);

  const db = admin.firestore();
  const writeBatch = db.batch();

  // Handle tap turn type.
  if (turnType === "tap") {
    let roll = randomIntBetween(mode.rollLow, mode.rollHigh);
    const recentRoll = roll;
    if (player.turnScore === -1) {
      roll += 1;
    }

    writeBatch.update(gameSnap.ref, {recentRoll: recentRoll});

    newTurnScore = (player.turnScore) + roll;
    if (newTurnScore < mode.turnMaxScore) {
      writeBatch.update(playerSnap.ref, {
        turnScore: newTurnScore,
        turnTapCount: admin.firestore.FieldValue.increment(1),
      });
      writeBatch.update(gameSnap.ref, {
        commentaryText: "",
        subCommentText: "",
      });
    } else if (newTurnScore === mode.turnMaxScore) {
      writeBatch.update(playerSnap.ref, {turnScore: newTurnScore});
      writeBatch.update(gameSnap.ref, {
        commentaryText: `That's a Scraptap! ${newTurnScore} points!`,
        subCommentText: `'${username}' scraptapped: ${newTurnScore}`,
      });

      isTurnOver = true;
    } else {
      writeBatch.update(playerSnap.ref, {turnScore: 0});
      writeBatch.update(gameSnap.ref, {
        commentaryText: "Ya tapped out! 0 points!",
        subCommentText: `'${username}' tapped out: 0`,
      });
      newTurnScore = 0;

      isTurnOver = true;
    }

    // Handle scrap turn type.
  } else if (
    turnType === "scrap" &&
    player.turnTapCount > 0
  ) {
    const oldTurnScore: number = player.turnScore;
    writeBatch.update(gameSnap.ref, {
      commentaryText: `Scrapped ${oldTurnScore} points.`,
      subCommentText: `'${username}' scrapped it: ${oldTurnScore}`,
    });

    newTurnScore = oldTurnScore;
    isTurnOver = true;

    // Handle jack turn type.
  } else if (
    turnType === "jack" &&
    mode.tapsBeforeJack != -1 &&
    player.turnTapCount >= mode.tapsBeforeJack
  ) {
    const roll = randomIntBetween(mode.rollLow, mode.rollHigh);
    writeBatch.update(gameSnap.ref, {recentRoll: roll});

    newTurnScore = (player.turnScore) + roll;
    const jackScore = newTurnScore * mode.jackMultiplier;
    if (newTurnScore < mode.turnMaxScore) {
      writeBatch.update(playerSnap.ref, {turnScore: jackScore});
      writeBatch.update(gameSnap.ref, {
        commentaryText: `Ya jacked in! ${jackScore} points!`,
        subCommentText: `'${username}' jacked in: ${jackScore}`,
      });
      newTurnScore = jackScore;
    } else if (newTurnScore === mode.turnMaxScore) {
      writeBatch.update(playerSnap.ref, {turnScore: jackScore});
      writeBatch.update(gameSnap.ref, {
        commentaryText: `SCRAPJACK! Perfect ${jackScore}!`,
        subCommentText: `'${username}' scrapjacked: ${jackScore}`,
      });
      newTurnScore = jackScore;
    } else {
      writeBatch.update(playerSnap.ref, {turnScore: 0});
      writeBatch.update(gameSnap.ref, {
        commentaryText: "Ya jacked out! 0 points!",
        subCommentText: `'${username}' jacked out: 0`,
      });
      newTurnScore = 0;
    }

    isTurnOver = true;
  } else {
    throw new functions.https.HttpsError("invalid-argument", "invalid turn");
  }

  // If turn does not save score, commit writes and exit.
  if (!isTurnOver) {
    await writeBatch.commit();
    return;
  }

  // Else, turn has ended. Continue processing.
  writeBatch.update(playerSnap.ref, {
    isTurnAvailable: false,
    turnTapCount: 0,
  });

  // Recalculate and update the team's average score for the turn.
  const teamId = teamSnap.id;
  const playerId = playerSnap.id;
  const otherTeamMembersQuerySnap = await db
    .collection(`lobbies/${lobbyId}/games/game/teams/${teamId}/players`)
    .where(admin.firestore.FieldPath.documentId(), "!=", playerId)
    .get();
  const otherTeamMembers = otherTeamMembersQuerySnap.docs
    .map((otherTeamMemberSnap) => otherTeamMemberSnap.data() as Player);

  let isOtherTurnAvailable = false;
  let teamTurnAverageScore = newTurnScore;
  if (otherTeamMembers.length > 0) {
    const otherTurnScoresToInclude = otherTeamMembers
      .map((teamMember) => teamMember.turnScore)
      .filter((score) => score >= 0);

    const otherTurnScoresTotal = otherTurnScoresToInclude.length > 0 ?
      otherTurnScoresToInclude.reduce((prev, curr) => prev + curr) :
      0;

    teamTurnAverageScore = (newTurnScore + otherTurnScoresTotal) / (otherTurnScoresToInclude.length + 1);
    isOtherTurnAvailable = otherTeamMembers.some((teamMember) => teamMember.isTurnAvailable);
  }

  writeBatch.update(teamSnap.ref, {teamTurnAverageScore: teamTurnAverageScore});

  // If this was not the last player's turn on this team, commit writes and exit.
  if (isOtherTurnAvailable) {
    await writeBatch.commit();
    return;
  }

  // Else, this is the last player's turn on this team. Continue processing scores, turns, and rounds.
  writeBatch.update(teamSnap.ref, {teamTotalScore: admin.firestore.FieldValue.increment(teamTurnAverageScore)});
  writeBatch.update(teamSnap.ref, {teamTurnAverageScore: 0});

  for (const teamMemberSnap of [...otherTeamMembersQuerySnap.docs, playerSnap]) {
    writeBatch.update(teamMemberSnap.ref, {turnScore: -1});
  }

  const team = teamSnap.data() as Team;
  const newTeamTurnEndCount = team?.teamTurnEndCount + 1;
  writeBatch.update(teamSnap.ref, {teamTurnEndCount: newTeamTurnEndCount});

  const enemyTeamId = teamSnap.id === "team1" ? "team2" : "team1";
  const enemyTeamPath = `lobbies/${lobbyId}/games/game/teams/${enemyTeamId}`;
  const enemyTeam = (await db.doc(enemyTeamPath).get()).data() as Team;

  // If this is the last turn of the round, increment round count.
  if (newTeamTurnEndCount === enemyTeam?.teamTurnEndCount) {
    const newRoundEndCount = gameSnap.data()?.roundEndCount + 1;
    if (newRoundEndCount <= mode.roundMaxCount) {
      writeBatch.update(gameSnap.ref, {roundEndCount: newRoundEndCount});
    }

    // If this the last turn of the last round of the game, set the game to ended, commit writes, and exit.
    if (newRoundEndCount === mode.roundMaxCount) {
      writeBatch.update(gameSnap.ref, {endDate: new Date()});

      const modeRef = db.doc(`modes/${mode.id}`);
      writeBatch.update(modeRef, {gameCount: admin.firestore.FieldValue.increment(1)});

      await writeBatch.commit();
      return;
    }
  }

  // Else, the ball is in the enemy team's court. Set all enemy players to turn available.
  const enemyPlayerSnaps = await db.collection(`${enemyTeamPath}/players`).get();
  for (const enemyPlayerSnap of enemyPlayerSnaps.docs) {
    writeBatch.update(enemyPlayerSnap.ref, {isTurnAvailable: true});
  }

  await writeBatch.commit();
}

/**
 * Post-processing for the end of a player turn.
 * @param {string} lobbyId ID of the game lobby.
 */
export async function handleTurnEndAsync(lobbyId: string): Promise<void> {
  const db = admin.firestore();
  const baseGamePath = `lobbies/${lobbyId}/games/game`;
  const gameSnap = await db.doc(baseGamePath).get();

  const writeBatch = db.batch();
  if ((gameSnap.data() as Game)?.endDate) {
    const winningTeamSnap = (await db
      .collection(`${baseGamePath}/teams`)
      .orderBy("teamTotalScore", "desc")
      .limit(1)
      .get())
      .docs[0];

    writeBatch.update(gameSnap.ref, {
      commentaryText: `${winningTeamSnap.id === "team1" ? "Team 1" : "Team 2"} Scrapped a Win!`,
      turnText: "",
    });
  } else {
    const team1PlayersSnap = await db.collection(`${baseGamePath}/teams/team1/players`)
      .where("isTurnAvailable", "==", true)
      .orderBy("joinDate")
      .limit(1)
      .get();
    const team2PlayersSnap = await db.collection(`${baseGamePath}/teams/team2/players`)
      .where("isTurnAvailable", "==", true)
      .orderBy("joinDate")
      .limit(1)
      .get();

    let playerName;
    if (team1PlayersSnap.size === 1) {
      playerName = (await admin.auth().getUser(team1PlayersSnap.docs[0].id))?.displayName ?? "[unknown]";
    } else {
      playerName = (await admin.auth().getUser(team2PlayersSnap.docs[0].id))?.displayName ?? "[unknown]";
    }

    writeBatch.update(gameSnap.ref, {turnText: `Turn: '${playerName}'`});
  }

  await writeBatch.commit();
}

/**
 * Shuffles the elements of an array in place.
 * @param elements The array containing elements to be shuffled.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shuffleArray(elements: any[]): void {
  for (let i = elements.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [elements[i], elements[j]] = [elements[j], elements[i]];
  }
}

/**
 * Gets a random number between small and big.
 * @param {number} small lower bound.
 * @param {number} big upper bound.
 * @return {number} The random number.
 */
function randomIntBetween(small: number, big: number): number {
  return (Math.floor(Math.random() * big)) + small;
}
