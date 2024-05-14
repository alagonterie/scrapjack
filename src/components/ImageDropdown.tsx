import {Menu, Transition} from '@headlessui/react';
import React, {Fragment, useContext} from 'react';
import {
  SwitchHorizontalIcon,
  ArrowNarrowDownIcon,
  ChatAltIcon,
  UserAddIcon,
  BanIcon,
  ExclamationIcon,
  ArrowNarrowUpIcon
} from '@heroicons/react/outline';
import {useUser} from 'reactfire';
import {LobbyContext} from './Lobby';
import {useCallable} from '../hooks/callableHooks';
import {useHostId} from '../hooks/lobbyHooks';
import {CrownSvg} from './misc/SVG';
import {HostMoveUserOptions, JustifyOptions} from '../enums';


export const UserLobbyImageDropdown = ({
  uid,
  photoURL,
  alt,
  isGameInProgress,
  isAnimated = true,
  isSpectator = true,
  justify = 'center'
}: React.PropsWithoutRef<{
  uid: string,
  photoURL: string,
  alt: string,
  isGameInProgress: boolean,
  isAnimated?: boolean,
  isSpectator?: boolean,
  justify?: JustifyOptions;
}>) => {
  const hostId = useHostId();
  const {data: user} = useUser();
  const lobbyId = useContext(LobbyContext);
  const moveUser = useCallable('lobbies-moveUser');

  const moveUserHandler = async (moveType: HostMoveUserOptions) => {
    await moveUser({
      lobbyId: lobbyId,
      uidMove: uid,
      moveType: moveType
    });
  };

  return (
    <Menu as={'div'} className={'relative inline-block'}>
      <div className={(isAnimated ? isSpectator ? 'animate-scale-in-top' : 'animate-scale-in-bottom' : '') + ''}>

        {hostId && uid === hostId &&
          <CrownSvg
            className={
              `${isAnimated ? 'animate-fade-in ' : ''}absolute text-yellow-500 -rotate-[37deg] 
              -translate-x-[5px] -translate-y-[11px] z-[2] w-5 h-5`
            }
          />}

        {uid === user?.uid &&
          <div className={
            'absolute bg-blue-300 rounded-full scale-[1.1] -z-[1] ' +
            (isSpectator ? 'w-12 h-12' : 'w-[46px] h-[46px]')
          }/>}

        <Menu.Button
          className={
            (isSpectator ? 'w-12 h-12' : 'w-[46px] h-[46px]') +
            (uid === user?.uid ? ' pointer-events-none' : '')
          }
        >
          <img className={'rounded-full pointer-events-none'} src={photoURL} alt={alt}/>
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter={'transition ease-out duration-100'}
        enterFrom={'transform opacity-0'}
        enterTo={'transform opacity-100'}
        leave={'transition ease-in duration-75'}
        leaveFrom={'transform opacity-100'}
        leaveTo={'transform opacity-0'}
      >
        <Menu.Items
          className={
            'absolute z-[999] mt-0.5 w-[121px] origin-top-right bg-white divide-y divide-gray-100 rounded-md ' +
            'shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none bottom-[60px] ' +
            (justify === 'left' ?
              'left-[50px] bottom-3' :
              justify === 'right' ?
                'right-[50px] bottom-3' :
                '-left-10')
          }
        >
          {hostId && user?.uid === hostId &&
            <>
              <div className={'px-1 py-1'}>
                <Menu.Item>
                  {({active}) => (
                    <button
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      onClick={() => moveUserHandler('host')}
                    >
                      <CrownSvg className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                      Host
                    </button>
                  )}
                </Menu.Item>
              </div>
              {!isGameInProgress &&
                <div className={'px-1 py-1'}>
                  {isSpectator ?
                    <>
                      <Menu.Item>
                        {({active}) => (
                          <button
                            className={`${
                              active ? 'bg-blue-500 text-white' : 'text-gray-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            onClick={() => moveUserHandler('team1')}
                          >
                            <ArrowNarrowUpIcon className={'w-5 h-5 mr-2 -rotate-45'} aria-hidden={'true'}/>
                            Team 1
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({active}) => (
                          <button
                            className={`${
                              active ? 'bg-blue-500 text-white' : 'text-gray-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            onClick={() => moveUserHandler('team2')}
                          >
                            <ArrowNarrowUpIcon className={'w-5 h-5 mr-2 rotate-45'} aria-hidden={'true'}/>
                            Team 2
                          </button>
                        )}
                      </Menu.Item>
                    </> :
                    <>
                      <Menu.Item>
                        {({active}) => (
                          <button
                            className={`${
                              active ? 'bg-blue-500 text-white' : 'text-gray-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            onClick={() => moveUserHandler('swap')}
                          >
                            <SwitchHorizontalIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                            Swap Team
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({active}) => (
                          <button
                            className={`${
                              active ? 'bg-blue-500 text-white' : 'text-gray-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            onClick={() => moveUserHandler('spec')}
                          >
                            <ArrowNarrowDownIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                            Spectator
                          </button>
                        )}
                      </Menu.Item>
                    </>}
                </div>}
              <div className={'px-1 py-1'}>
                <Menu.Item>
                  {({active}) => (
                    <button
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      onClick={() => moveUserHandler('kick')}
                    >
                      <ExclamationIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                      Kick
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({active}) => (
                    <button
                      className={`${
                        active ? 'bg-blue-500 text-white' : 'text-gray-900'
                      } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                      onClick={() => moveUserHandler('ban')}
                    >
                      <BanIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                      Ban
                    </button>
                  )}
                </Menu.Item>
              </div>
            </>}
          <div className={'px-1 py-1'}>
            <Menu.Item>
              {({active}) => (
                <button
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-gray-900'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <ChatAltIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                  Message
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({active}) => (
                <button
                  className={`${
                    active ? 'bg-blue-500 text-white' : 'text-gray-900'
                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                >
                  <UserAddIcon className={'w-5 h-5 mr-2'} aria-hidden={'true'}/>
                  Friend
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
