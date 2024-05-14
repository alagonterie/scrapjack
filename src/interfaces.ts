// noinspection DuplicatedCode,JSUnusedGlobalSymbols

import {Timestamp} from 'firebase/firestore';


export interface Lobby {
  createBy: string;
  createDate: Timestamp;
  hostUser: string;
  lobbyName: string;
  maxUsers: number;
  userCount: number;
}

export interface LobbyMessage {
  sendDate: Timestamp;
  text: string;
  username: string;
}

export interface Spectator {
  joinDate: Timestamp;
  photoURL: string;
}

export interface Game {
  mode: GameMode;
  commentaryText: string;
  subCommentText: string;
  turnText: string;
  roundEndCount: number;
  isFreeTeamJoin: boolean;
  isAutoPopulate: boolean;
  createDate: Timestamp;
  recentRoll?: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

export interface GameMode {
  id: string;
  name: string;
  roundMaxCount: number;
  turnMaxScore: number;
  rollLow: number;
  rollHigh: number;
  tapsBeforeJack: number;
  jackMultiplier: number;
  gameCount: number;
}

export interface Team {
  teamTotalScore: number;
  teamTurnAverageScore: number;
  teamTurnEndCount: number;
}

export interface Player {
  isReady: boolean;
  isTurnAvailable: boolean;
  joinDate: Timestamp;
  photoURL: string;
  turnScore: number;
  turnTapCount: number;
}

export interface Status {
  state: string;
  isKicked?: boolean;
  isBanned?: boolean;
}

export interface StatusLobby {
  joinDate: Timestamp;
}

export interface Mode {
  name: string;
  roundMaxCount: number;
  turnMaxScore: number;
  rollLow: number;
  rollHigh: number;
  tapsBeforeJack: number;
  jackMultiplier: number;
  gameCount: number;
}
