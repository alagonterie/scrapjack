import React from 'react';
import {HostControls} from './HostControls';
import {TeamContainer} from './Team';
import {Board} from './Board';
import {Game, Player, Team} from '../../interfaces';
import {useIsHost, useTeam, useTeamPlayers} from '../../hooks/lobbyHooks';
import {IdAndFields} from '../../hooks/genericHooks';
import {Transition} from '@headlessui/react';


export const GameContainer = ({game}: React.PropsWithoutRef<{ game: IdAndFields<Game> | undefined }>) => {
  const isHost = useIsHost();
  const team1 = useTeam('team1');
  const team2 = useTeam('team2');
  const team1Players = useTeamPlayers('team1');
  const team2Players = useTeamPlayers('team2');

  return (
    <>
      <Transition
        as={'div'}
        show={isHost && (!game?.fields.startDate || !!game?.fields.endDate)}
        enter={'transition ease-in duration-500 transform origin-top'}
        enterFrom={'opacity-0 scale-y-0'}
        enterTo={'opacity-100 scale-y-100'}
        leave={'transition ease-in duration-500 transform origin-top'}
        leaveFrom={'opacity-100 scale-y-100'}
        leaveTo={'opacity-0 scale-y-0'}
      >
        <HostControls
          game={game}
          team1Players={team1Players}
          team2Players={team2Players}
        />
      </Transition>
      <GameContents
        game={game}
        isHost={isHost}
        team1={team1}
        team2={team2}
        team1Players={team1Players}
        team2Players={team2Players}
      />
    </>
  );
};

const GameContents = ({
  game,
  isHost,
  team1,
  team2,
  team1Players,
  team2Players
}: React.PropsWithoutRef<{
  game: IdAndFields<Game> | undefined,
  isHost: boolean,
  team1: IdAndFields<Team> | undefined,
  team2: IdAndFields<Team> | undefined,
  team1Players: IdAndFields<Player>[] | undefined,
  team2Players: IdAndFields<Player>[] | undefined
}>) => {
  return (
    <div className={'text-gray-600'}>
      {!game ?
        'Waiting for host to create a game...' :
        <div className={'flex flex-row justify-evenly'}>
          <TeamContainer
            teamId={'team1'}
            team={team1}
            players={team1Players}
            game={game}
            isHost={isHost}
          />
          <Board game={game}/>
          <TeamContainer
            teamId={'team2'}
            team={team2}
            players={team2Players}
            game={game}
            isHost={isHost}
          />
        </div>}
    </div>
  );
};
