import React, {useContext, useState} from 'react';
import {SkinnyButton} from '../input/Button';
import {useAuth} from 'reactfire';
import {LobbyContext} from '../Lobby';
import {CheckCircleIcon} from '@heroicons/react/outline';
import {addSeconds} from '../../helpers/format';
import {Game, Player, Team} from '../../interfaces';
import {UserLobbyImageDropdown} from '../ImageDropdown';
import {useCallable} from '../../hooks/callableHooks';
import {IdAndFields} from '../../hooks/genericHooks';
import {Auth} from 'firebase/auth';
import {Transition} from '@headlessui/react';
import {useIsGameInProgress} from '../../hooks/lobbyHooks';
import {TeamIdOptions} from '../../enums';


export const TeamContainer = ({
  teamId,
  team,
  players,
  game,
  isHost
}: React.PropsWithoutRef<{
  teamId: TeamIdOptions,
  team: IdAndFields<Team> | undefined,
  players: IdAndFields<Player>[] | undefined,
  game: IdAndFields<Game>,
  isHost: boolean
}>) => {
  const lobbyId = useContext(LobbyContext);

  const auth = useAuth();
  const ready = useCallable('games-ready');
  const join = useCallable('games-join');
  const leave = useCallable('games-leave');

  const isGameInProgress = useIsGameInProgress(game);
  const isUserOnTeam = useIsUserOnTeam(auth, players);
  const isUserReady = useIsUserReady(auth, isUserOnTeam, players);

  const [isReadying, setIsReadying] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const readyHandler = async () => {
    setIsReadying(true);
    ready({lobbyId: lobbyId}).finally(() => {
      setIsReadying(false);
    });
  };

  const joinHandler = async () => {
    setIsMoving(true);
    join({lobbyId: lobbyId, teamId: teamId}).finally(() => {
      setIsMoving(false);
    });
  };

  const leaveHandler = async () => {
    setIsMoving(true);
    leave({lobbyId: lobbyId}).finally(() => {
      setIsMoving(false);
    });
  };

  return (
    <div className={'flex flex-col h-[342px] w-16'}>
      <div className={'-mt-1.5 mx-auto text-sm text-gray-700'}>
        {teamId === 'team1' ? 'Team 1' : 'Team 2'}
      </div>
      <TeamScore
        total={team?.fields?.teamTotalScore ?? 0}
        roundAvg={team?.fields?.teamTurnAverageScore}
        isShowAvg={!!players && players.length > 1}
      />
      <div className={'flex h-[206px] overflow-visible border rounded p-1 my-1'}>
        <Transition
          as={'div'}
          className={'flex flex-col-reverse'}
          show={!game?.fields.commentaryText.includes('Shuffling')}
          enter={'transition ease-in duration-300'}
          enterFrom={'opacity-0'}
          enterTo={'opacity-100'}
          leave={'transition ease-out duration-300'}
          leaveFrom={'opacity-100'}
          leaveTo={'opacity-0'}
        >
          {players?.map((player) => {
            return (
              <TeamPlayer
                key={player.id}
                playerId={player.id}
                player={player.fields}
                teamId={teamId}
                isGameInProgress={isGameInProgress}
              />
            );
          })}
        </Transition>
      </div>
      <Transition
        as={'div'}
        show={!game.fields.startDate || !!game.fields.endDate}
        enter={'transition ease-in duration-300'}
        enterFrom={'opacity-0'}
        enterTo={'opacity-100'}
        leave={'transition ease-out duration-300'}
        leaveFrom={'opacity-100'}
        leaveTo={'opacity-0'}
      >
        <div
          className={isUserReady || !isUserOnTeam || isReadying || !!game.fields.startDate ? '' : 'animate-heartbeat'}
        >
          <SkinnyButton
            onClick={readyHandler}
            label={'Ready'}
            isLoading={isReadying}
            isDisabled={!isUserOnTeam || !!game.fields.startDate}
            color={isUserReady && isUserOnTeam ? 'green' : 'blue'}
          />
        </div>
        <div className={'mb-1'}/>
        <SkinnyButton
          onClick={!isUserOnTeam ? joinHandler : leaveHandler}
          label={!isUserOnTeam ? 'Join' : 'Leave'}
          isLoading={isMoving}
          isDisabled={
            isGameInProgress ||
            (players && players.length >= 4) ||
            (!isHost && !game.fields.isFreeTeamJoin && !isUserOnTeam) ||
            (!!game.fields.endDate && !isUserOnTeam)
          }
        />
      </Transition>
    </div>
  );
};

const useIsUserOnTeam = (auth: Auth, players: IdAndFields<Player>[] | undefined): boolean | undefined => {
  return players?.map((p) => p.id).includes(auth.currentUser?.uid as string);
};

const useIsUserReady = (
  auth: Auth,
  isUserOnTeam: boolean | undefined,
  players: IdAndFields<Player>[] | undefined
): boolean | undefined => {
  return isUserOnTeam && players?.filter((p) => p.id === auth.currentUser?.uid as string)[0].fields.isReady;
};

const TeamPlayer = ({
  playerId,
  player,
  teamId,
  isGameInProgress,
}: React.PropsWithoutRef<{
  playerId: string,
  player: Player,
  teamId: string,
  isGameInProgress: boolean
}>) => {
  return (
    <div className={'mt-[4px] last:mt-0 h-[46px]'}>
      <UserLobbyImageDropdown
        uid={playerId}
        photoURL={player?.photoURL}
        alt={'player image'}
        isGameInProgress={isGameInProgress}
        isAnimated={player?.joinDate > addSeconds(new Date(), -5)}
        isSpectator={false}
        justify={teamId === 'team1' ? 'left' : 'right'}
      />
      {player?.isReady ?
        <CheckCircleIcon
          className={'animate-puff-in-center z-[1] absolute w-14 h-14 text-green-600 pointer-events-none'}
        /> :
        <></>}
      {isGameInProgress && player && (player.isTurnAvailable || (!player.isTurnAvailable && player.turnScore >= 0)) &&
        <div className={'absolute flex justify-center w-7 h-4 m-auto rounded-lg text-sm bg-blue-500 ' +
          'translate-x-[10px] -translate-y-[19px] pointer-events-none'}>
          <div className={'-translate-y-[2.5px] text-blue-100'}>
            {player.turnScore === -1 ? 0 : player.turnScore}
          </div>
        </div>}
    </div>
  );
};

const TeamScore = ({
  total,
  roundAvg,
  isShowAvg,
}: React.PropsWithoutRef<{
  total: number,
  roundAvg: number | undefined,
  isShowAvg: boolean
}>) => {
  return (
    <div className={'flex flex-col border rounded'}>
      <div className={'text-lg text-gray-700 mx-auto'}>
        {Math.round(total * 10) / 10}
      </div>
      <div className={'h-5'}>
        {!!roundAvg && isShowAvg &&
          <div className={'text-sm font-thin text-gray-700 w-fit mx-auto'}>
            avg: {Math.round(roundAvg * 10) / 10}
          </div>}
      </div>
    </div>
  );
};
