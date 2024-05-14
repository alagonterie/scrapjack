import {useContext} from 'react';
import {LobbyContext} from '../components/Lobby';
import {useUser} from 'reactfire';
import {limit, orderBy, where} from 'firebase/firestore';
import {Game, Lobby, LobbyMessage, Mode, Player, Spectator, Team} from '../interfaces';
import {IdAndFields, useFields, useIdAndFields, useIdAndFieldsCollection} from './genericHooks';


export const useHostId = (): string | undefined => {
  const lobbyId = useContext(LobbyContext);
  const lobby = useFields<Lobby>(`lobbies/${lobbyId}`);

  return lobby?.hostUser;
};

export const useIsHost = (): boolean => {
  const {status: userStatus, data: user} = useUser();
  const hostId = useHostId();

  return (
    userStatus !== 'loading' &&
    !!user &&
    hostId === user.uid
  );
};

export const useGame = (lobbyId: string): IdAndFields<Game> | undefined => {
  const path = `lobbies/${lobbyId}/games`;

  const games = useIdAndFieldsCollection<Game>(path, limit(1));

  return !games || games.length === 0 ? undefined : games[0];
};

export const useTeam = (teamId: string): IdAndFields<Team> | undefined => {
  const lobbyId = useContext(LobbyContext);
  const basePath = `lobbies/${lobbyId}/games/game/teams`;

  return useIdAndFields<Team>(basePath, teamId);
};

export const useSpectators = (): IdAndFields<Spectator>[] | undefined => {
  const lobbyId = useContext(LobbyContext);
  const path = `lobbies/${lobbyId}/spectators`;

  return useIdAndFieldsCollection<Spectator>(path, orderBy('joinDate', 'asc'));
};

export const useRecentLobbies = (top: number): IdAndFields<Lobby>[] | undefined => {
  return useIdAndFieldsCollection<Lobby>('lobbies', orderBy('createDate', 'desc'), limit(top));
};

export const useRecentLobbyMessages = (top: number): IdAndFields<LobbyMessage>[] | undefined => {
  const lobbyId = useContext(LobbyContext);
  const path = `lobbies/${lobbyId}/messages`;

  return useIdAndFieldsCollection<LobbyMessage>(path, orderBy('sendDate', 'desc'), limit(top));
};

export const usePopularModes = (top: number): IdAndFields<Mode>[] | undefined => {
  return useIdAndFieldsCollection<Mode>('modes', orderBy('gameCount', 'desc'), limit(top));
};

export const useTeamPlayers = (teamId: string): IdAndFields<Player>[] | undefined => {
  const lobbyId = useContext(LobbyContext);
  const path = `lobbies/${lobbyId}/games/game/teams/${teamId}/players`;

  return useIdAndFieldsCollection<Player>(path, orderBy('joinDate'));
};

export const usePlayerWithTurnAvailable = (): IdAndFields<Player> | undefined => {
  const lobbyId = useContext(LobbyContext);

  const teamBasePath = `lobbies/${lobbyId}/games/game/teams`;
  const queryConstraints = [where('isTurnAvailable', '==', true), orderBy('joinDate', 'desc'), limit(1)];

  const players1 = useIdAndFieldsCollection<Player>(`${teamBasePath}/team1/players`, ...queryConstraints);
  const players2 = useIdAndFieldsCollection<Player>(`${teamBasePath}/team2/players`, ...queryConstraints);

  return (
    !!players1 && players1.length === 1 ?
      players1[0] :
      !!players2 && players2.length === 1 ?
        players2[0] :
        undefined
  );
};

export const useIsGameInProgress = (game: IdAndFields<Game> | undefined): boolean => {
  return !!game && !!game.fields.startDate && !game.fields.endDate;
};
