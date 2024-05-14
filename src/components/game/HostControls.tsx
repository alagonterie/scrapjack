import React, {Fragment, useContext, useEffect, useState} from 'react';
import {LobbyContext} from '../Lobby';
import {Listbox, Transition} from '@headlessui/react';
import {SelectorIcon} from '@heroicons/react/solid';
import {SkinnyButton} from '../input/Button';
import {Game, Mode, Player} from '../../interfaces';
import {useCallable} from '../../hooks/callableHooks';
import {Toggle} from '../input/Toggle';
import {IdAndFields} from '../../hooks/genericHooks';
import {useIsGameInProgress, usePopularModes} from '../../hooks/lobbyHooks';


export const HostControls = ({
  game,
  team1Players,
  team2Players
}: React.PropsWithoutRef<{
  game: IdAndFields<Game> | undefined
  team1Players: IdAndFields<Player>[] | undefined
  team2Players: IdAndFields<Player>[] | undefined
}>) => {
  const lobbyId = useContext(LobbyContext);

  const start = useCallable('games-start');
  const edit = useCallable('games-edit');

  const [isStarting, setIsStarting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isFreeJoin, setIsFreeJoin] = useState(game?.fields.isFreeTeamJoin ?? true);
  const [isAutoFill, setIsAutoFill] = useState(game?.fields.isAutoPopulate ?? false);
  const [selectedMode, setSelectedMode] = useState<IdAndFields<Mode> | undefined>(
    {id: game?.fields?.mode?.id ?? '', fields: game?.fields.mode as Mode}
  );

  const isGameInProgress = useIsGameInProgress(game);
  const isGameReadyForStart = useIsGameReadyForStart(team1Players, team2Players);

  const modes = usePopularModes(5);
  useEffect(() => {
    if (!!modes && selectedMode?.id === '') {
      setSelectedMode(modes[0]);
    }
  }, [modes, selectedMode?.id]);

  useEffect(() => {
    if (game && !game.fields.endDate) {
      editHandler().then();
    }
  }, [isFreeJoin, isAutoFill, selectedMode]);

  const startHandler = async () => {
    setIsStarting(true);
    start({lobbyId: lobbyId}).finally(() => {
      setIsStarting(false);
    });
  };

  const editHandler = async (isClear?: boolean) => {
    if (isClear === true) {
      setIsClearing(true);
    } else if (isClear === false) {
      setIsShuffling(true);
    }

    edit({
      lobbyId: lobbyId,
      modeId: selectedMode?.id ?? 'default',
      isFreeTeamJoin: isFreeJoin,
      isAutoPopulate: isAutoFill,
      isShuffle: isClear === false ? true : undefined,
      isClear: isClear === true ? true : undefined,
    }).finally(() => {
      if (isClear === true) {
        setIsClearing(false);
      } else if (isClear === false) {
        setIsShuffling(false);
      }
    });
  };

  return (
    <div className={'flex flex-row mb-2 p-1 border rounded'}>
      <div className={'flex flex-row justify-start text-sm w-full h-[74px]'}>
        <div className={'flex flex-col justify-between mr-1'}>
          <div className={'flex justify-between'}>
            <p className={'pointer-events-none'}>Free join:</p>
            <Toggle getter={isFreeJoin} setter={setIsFreeJoin}/>
          </div>
          <div className={'flex justify-between'}>
            <p className={'pointer-events-none'}>Auto fill:</p>
            <Toggle getter={isAutoFill} setter={setIsAutoFill}/>
          </div>
          <Listbox value={selectedMode} onChange={setSelectedMode}>
            <div className={'relative'}>
              <Listbox.Button
                className={'relative w-28 pr-5 text-left bg-white rounded cursor-default sm:text-sm'}
              >
                <span className={'block truncate'}>{selectedMode?.fields?.name}</span>
                <span className={'absolute inset-y-0 right-0 flex items-center pointer-events-none'}>
                  <SelectorIcon
                    className={'w-5 h-5 text-gray-400'}
                    aria-hidden={'true'}
                  />
                </span>
              </Listbox.Button>
            </div>
            <Transition
              as={Fragment}
              leave={'transition ease-in duration-100'}
              leaveFrom={'opacity-100'}
              leaveTo={'opacity-0'}
            >
              <Listbox.Options
                className={'absolute w-80 sm:w-96 z-10 py-1 mt-[75px] overflow-auto text-base bg-white rounded ' +
                  'shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'}
              >
                {modes?.map((mode) => (
                  <Listbox.Option
                    key={mode.id}
                    className={({active}) =>
                      `${active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'}
                          cursor-default select-none relative py-3 sm:py-2 px-4`
                    }
                    value={mode}
                  >
                    {({selected, active}) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                          {mode.fields.name}
                        </span>
                        {selected ?
                          <span
                            className={`${active ? 'text-blue-600' : 'text-blue-600'}
                                    absolute inset-y-0 left-0 flex items-center pl-3`}
                          /> :
                          null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </Listbox>
        </div>
        <div className={'w-full flex flex-row justify-start pl-1 border-l border-r pointer-events-none'}>
          <div className={'flex flex-col justify-between mr-2 text-gray-500 text-sm font-thin'}>
            <div>
              <span className={'hidden sm:inline-block'}>Total Rounds per Game</span>
              <span className={'sm:hidden'}>Rs</span>
              : {selectedMode?.fields?.roundMaxCount}
            </div>
            <div>
              <span className={'hidden sm:inline-block'}>Maximum Score per Turn</span>
              <span className={'sm:hidden'}>Max</span>
              : {selectedMode?.fields?.turnMaxScore}
            </div>
            <div>
              <span className={'hidden sm:inline-block'}>Lowest Possible Roll</span>
              <span className={'sm:hidden'}>LoR</span>
              : {selectedMode?.fields?.rollLow}
            </div>
          </div>
          <div className={'flex flex-col justify-between border-l pl-1 mr-1 text-gray-500 text-sm font-thin'}>
            <div>
              <span className={'hidden sm:inline-block'}>Highest Possible Roll</span>
              <span className={'sm:hidden'}>HiR</span>
              : {selectedMode?.fields?.rollHigh}
            </div>
            <div>
              <span className={'hidden sm:inline-block'}>Taps Required Before Jack</span>
              <span className={'sm:hidden'}>TbJ</span>
              : {selectedMode?.fields?.tapsBeforeJack}
            </div>
            <div>
              <span className={'hidden sm:inline-block'}>Jack Score Multiplier</span>
              <span className={'sm:hidden'}>JS</span>
              : {`${selectedMode?.fields?.jackMultiplier}x`}
            </div>
          </div>
        </div>
      </div>
      <div className={'flex flex-row'}>
        <div className={'flex flex-col justify-between pl-1 mr-1'}>
          <SkinnyButton
            onClick={() => editHandler(false)}
            label={'Shuffle'}
            isLoading={isShuffling}
            isDisabled={isGameInProgress}
          />
          <SkinnyButton
            onClick={() => editHandler(true)}
            label={'Clear'}
            isLoading={isClearing}
            isDisabled={isGameInProgress}
            color={'red'}
          />
        </div>
        <div className={(!isGameReadyForStart || isStarting ? '' : 'animate-heartbeat ') + 'flex'}>
          <SkinnyButton
            onClick={game?.fields.endDate ? () => editHandler() : startHandler}
            label={game?.fields.endDate ? 'New Game' : 'Start Game'}
            isLoading={isStarting}
            isDisabled={!game || (!game.fields.endDate && !isGameReadyForStart) || isGameInProgress}
            color={'green'}
            tall={true}
          />
        </div>
      </div>
    </div>
  );
};

const useIsGameReadyForStart = (
  team1Players: IdAndFields<Player>[] | undefined,
  team2Players: IdAndFields<Player>[] | undefined
): boolean => {
  return (
    !!team1Players &&
    !!team2Players &&
    team1Players.length > 0 &&
    team2Players.length > 0 &&
    team1Players.every((p) => p.fields.isReady) &&
    team2Players.every((p) => p.fields.isReady)
  );
};
