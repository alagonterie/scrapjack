import React, {useContext, useEffect, useState, Fragment} from 'react';
import {SpinnerSvg} from '../misc/SVG';
import {FingerPrintIcon, HeartIcon, FireIcon} from '@heroicons/react/outline';
import {LobbyContext} from '../Lobby';
import {useAuth} from 'reactfire';
import {Transition} from '@headlessui/react';
import {useTimeoutFn} from 'react-use';
import {Game, Player} from '../../interfaces';
import {useCallable} from '../../hooks/callableHooks';
import {IdAndFields} from '../../hooks/genericHooks';
import {usePlayerWithTurnAvailable} from '../../hooks/lobbyHooks';
import {TurnTypeOptions} from '../../enums';


export const Board = ({game}: React.PropsWithoutRef<{ game: IdAndFields<Game> }>) => {
  const lobbyId = useContext(LobbyContext);

  const auth = useAuth();
  const turn = useCallable('games-turn');

  const playerWithTurnAvailable = usePlayerWithTurnAvailable();

  const [player, setPlayer] = useState<Player | undefined>(undefined);
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (playerWithTurnAvailable) {
      setPlayerId(playerWithTurnAvailable.id);
      setPlayer(playerWithTurnAvailable.fields);
    }
  }, [playerWithTurnAvailable]);

  const [isTapping, setIsTapping] = useState(false);
  const [isScrapping, setIsScrapping] = useState(false);
  const [isJacking, setIsJacking] = useState(false);

  const [isRolling, setIsRolling] = useState(true);
  const [, , resetIsRolling] = useTimeoutFn(() => setIsRolling(true), 500);

  const handleTurn = async (turnType: TurnTypeOptions) => {
    if (turnType === 'tap') {
      setIsTapping(true);
      setIsRolling(false);
    } else if (turnType === 'scrap') {
      setIsScrapping(true);
    } else {
      setIsJacking(true);
      setIsRolling(false);
    }

    await turn({lobbyId: lobbyId, turnType: turnType}).finally(() => {
      if (turnType === 'tap') {
        setIsTapping(false);
        resetIsRolling();
      } else if (turnType === 'scrap') {
        setIsScrapping(false);
      } else {
        setIsJacking(false);
        resetIsRolling();
      }
    });
  };

  return (
    <div className={'flex flex-col border-l border-r border-t rounded-b rounded-t-2xl w-full h-[342px] mx-1'}>
      <GameStateText
        round={
          game.fields.startDate && game.fields.roundEndCount + 1 <= game.fields.mode.roundMaxCount ?
            `Round ${game.fields.roundEndCount + 1} of ${game.fields.mode.roundMaxCount}` :
            ''
        }
        turn={game.fields.turnText}
        commentary={game.fields.commentaryText}
        subComment={game.fields.subCommentText}
        isRolling={isRolling}
      />
      <Gameplay game={game.fields} player={player} isRolling={isRolling}/>
      <div className={'h-16'}>
        <Transition
          as={Fragment}
          show={playerWithTurnAvailable?.id === auth.currentUser?.uid}
          enter={'transition ease-in duration-500 transform'}
          enterFrom={'opacity-0 translate-y-1'}
          enterTo={'opacity-100 translate-y-0'}
          leave={'transition ease-out duration-500 transform'}
          leaveFrom={'opacity-100 translate-y-0'}
          leaveTo={'opacity-0 translate-y-1'}
        >
          <div className={'flex'}>
            <BoardButton
              onClick={() => handleTurn('tap')}
              icon={<FingerPrintIcon className={'w-5 h-5 text-white'}/>}
              label={'TAP'}
              description={`Roll ${game.fields.mode.rollLow} to ${game.fields.mode.rollHigh}`}
              isLoading={isTapping}
              isDisabled={
                !!game.fields.endDate ||
                !game.fields.startDate ||
                playerId !== auth.currentUser?.uid}
            />
            <div className={'mr-1'}/>
            <BoardButton
              onClick={() => handleTurn('scrap')}
              icon={<HeartIcon className={'w-5 h-5 text-white'}/>}
              label={'SCRAP'}
              description={'Save your score'}
              isLoading={isScrapping}
              isDisabled={
                !!game.fields.endDate ||
                !game.fields.startDate ||
                player && player.turnTapCount < 1 ||
                playerId !== auth.currentUser?.uid}
            />
            <div className={'mr-1'}/>
            <BoardButton
              onClick={() => handleTurn('jack')}
              icon={<FireIcon className={'w-5 h-5 text-white'}/>}
              label={'JACK'}
              description={
                game.fields.mode.tapsBeforeJack !== -1 ?
                  `${game.fields.mode.jackMultiplier}x or zero!` :
                  'Disabled'
              }
              isLoading={isJacking}
              isDisabled={
                !!game.fields.endDate ||
                !game.fields.startDate ||
                game.fields.mode.tapsBeforeJack === -1 ||
                playerId !== auth.currentUser?.uid ||
                !!player && player.turnTapCount < game.fields.mode.tapsBeforeJack
              }
            />
          </div>
        </Transition>
      </div>
    </div>
  );
};

const Gameplay =
  ({
    game, player, isRolling
  }: React.PropsWithoutRef<{
    game: Game, player: Player | undefined, isRolling: boolean
  }>) => {
    return (
      <div className={'h-full'}>
        {game.startDate && player ?
          <>
            <div className={'w-fit mx-auto text-sm font-medium text-gray-700'}>
              Roll for {game.mode.turnMaxScore}!
            </div>
            <div className={'w-fit mx-auto -mt-0.5 text-[.75rem] text-gray-600'}>
              Turn Total:
            </div>
            <div className={'h-7'}>
              <Transition
                as={Fragment}
                show={isRolling}
                enter="transition ease-out duration-[800ms]"
                enterFrom="translate-y-[5px] opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in-out duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className={'flex justify-center w-8 mx-auto text-lg text-gray-600 border-b border-blue-300'}>
                  {player.turnScore && player.turnScore >= 0 ? player.turnScore : 0}
                </div>
              </Transition>
            </div>
            <div className={'h-16'}>
              <Transition
                as={Fragment}
                show={isRolling}
                enter="transform transition ease-out duration-[400ms]"
                enterFrom="translate-y-[75px] opacity-0 scale-50"
                enterTo="opacity-100 scale-100"
                leave="transform transition ease-in-out duration-[50ms]"
                leaveFrom="opacity-100 scale-100 "
                leaveTo="opacity-0 scale-95 "
              >
                <div className={'h-full w-fit mx-auto ' +
                  '-translate-x-[6px] text-6xl text-blue-500'}>
                  {game.recentRoll ? `+${game.recentRoll}` : ''}
                </div>
              </Transition>
            </div>
            <div className={'w-fit mx-auto'}>
              <div className={'h-[78px] w-[78px]'}>
                <img
                  className={'rounded-full pointer-events-none'}
                  src={player.photoURL}
                  alt={'player avatar'}
                />
              </div>
            </div>
          </> :
          <></>}
      </div>
    );
  };


const GameStateText =
  ({
    round,
    turn,
    commentary,
    subComment,
    isRolling
  }: React.PropsWithoutRef<{
    round: string,
    turn: string,
    commentary: string,
    subComment: string,
    isRolling: boolean
  }>) => {
    return (
      <div className={'py-1 px-2 h-[145px]'}>
        <div className={'flex justify-between h-5 text-[.8rem] text-gray-500'}>
          <div>
            {round}
          </div>
          <div>
            {turn}
          </div>
        </div>
        <div>
          <Transition
            as={Fragment}
            show={isRolling}
            enter="transition ease-out duration-[200ms]"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in-out duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className={'animate-pulsate-fwd w-fit mx-auto mt-2 mb-2 font-medium text-blue-700'}>
              {commentary ?? ' '}
            </div>
          </Transition>
          <Transition
            as={Fragment}
            show={isRolling}
            enter="transition ease-in-out duration-[1500ms]"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in-out duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className={'w-fit mx-auto text-sm -mt-2 mb-3'}>
              {subComment}
            </div>
          </Transition>
        </div>
      </div>
    );
  };

const BoardButton =
  ({
    onClick,
    icon,
    label,
    description,
    isLoading,
    isDisabled
  }: {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    icon: JSX.Element;
    label: string;
    description: string;
    isLoading: boolean;
    isDisabled: boolean;
  }) => {
    return (
      <button
        className={(!isDisabled ? 'bg-blue-500 hover:bg-blue-700 hover:-translate-y-0.5' : 'bg-gray-500') +
          ' w-full h-10 text-sm transition text-gray-100 font-medium pl-1 pr-2 rounded'}
        onClick={onClick}
        disabled={isDisabled || isLoading}
      >
        <div className={'flex translate-y-1'}>
          <span className={'my-auto sm:translate-y-1.5'}>{isLoading ? <SpinnerSvg/> : icon}</span>
          <div className={'w-full'}>
            <div className={'sm:-translate-x-2.5'}>
              <span className={'ml-0.5'}>{label}</span>
              <span className={'text-sm font-thin ml-0.5'}>it</span>
            </div>
          </div>
        </div>
        <div className={'text-[.61rem] font-thin'}>
          {description}
        </div>
      </button>
    );
  };
