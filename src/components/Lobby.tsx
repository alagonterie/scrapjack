import React, {useContext, useEffect, useState} from 'react';
import {
  useFirestore,
  useFirestoreDocData,
  useFirestoreDocDataOnce,
  useUser,
} from 'reactfire';
import {getDoc, doc} from 'firebase/firestore';
import {LoadingFullBlur, LoadingSpinner} from './misc/Loading';
import {useNavigate, useParams} from 'react-router-dom';
import {Card, CardSection} from './misc/Card';
import {LargeButton, MiniButton, SmallButton} from './input/Button';
import {AuthWrapper} from './Authentication';
import {ModalContext, NavigationContext} from '../App';
import {addSeconds, getSimpleTime} from '../helpers/format';
import {PlusIcon} from '@heroicons/react/solid';
import {GameContainer} from './game/Game';
import {LoginIcon} from '@heroicons/react/outline';
import {Game, Lobby} from '../interfaces';
import {UserLobbyImageDropdown} from './ImageDropdown';
import {useUserStatus} from '../hooks/userHooks';
import {useCallable} from '../hooks/callableHooks';
import {
  useGame,
  useIsGameInProgress,
  useRecentLobbies,
  useRecentLobbyMessages,
  useSpectators
} from '../hooks/lobbyHooks';
import {ListboxSelection, MyListbox} from './input/Listbox';
import {IdAndFields} from '../hooks/genericHooks';


export const LobbyContext = React.createContext('');

export const LobbyContainer = ({lobbyId}: React.PropsWithoutRef<{ lobbyId: string }>) => {
  const firestore = useFirestore();
  const enterLobby = useCallable('lobbies-enter');
  const leaveLobby = useCallable('lobbies-leave');
  const {data: lobbyData} = useFirestoreDocDataOnce(doc(firestore, `lobbies/${lobbyId}`));

  const {setNavigation} = useContext(NavigationContext);
  useEffect(() => {
    enterLobby({lobbyId: lobbyId}).catch(() => {
      setNavigation('HOME');
    });
    return () => {
      leaveLobby({lobbyId: lobbyId}).catch(() => {});
    };
  }, [lobbyId, setNavigation]);

  const userStatus = useUserStatus();
  const {setIsModalOpen, setModalType} = useContext(ModalContext);
  useEffect(() => {
    if (userStatus?.isKicked) {
      setNavigation('HOME');
      setModalType('KICK');
      setIsModalOpen(true);
    } else if (userStatus?.isBanned) {
      setNavigation('HOME');
      setModalType('BAN');
      setIsModalOpen(true);
    }
  }, [setIsModalOpen, setModalType, setNavigation, userStatus]);

  const game = useGame(lobbyId);
  return (
    <LobbyContext.Provider value={lobbyId}>
      <AuthWrapper fallback={<LobbyNotFound/>}>
        <LobbyWrapper fallback={<LobbyNotFound/>}>
          <Card title={(lobbyData as Lobby)?.lobbyName ?? 'Loading...'} oneSection={true}>
            <GameContainer game={game}/>
          </Card>
          <Card title={'Social'}>
            <CardSection title={'Lobby Chat'}>
              <LobbySpectators game={game}/>
              <LobbyChatText/>
              <LobbyChatInput/>
            </CardSection>
          </Card>
        </LobbyWrapper>
      </AuthWrapper>
    </LobbyContext.Provider>
  );
};

const LobbySpectators = ({game}: React.PropsWithoutRef<{ game: IdAndFields<Game> | undefined }>) => {
  const spectators = useSpectators();
  const isGameInProgress = useIsGameInProgress(game);

  return (
    <div className={'flex justify-evenly h-12 px-1.5 mb-2'}>
      {spectators &&
        spectators.map((spectator) => {
          return (
            <UserLobbyImageDropdown
              key={spectator.id}
              uid={spectator.id}
              photoURL={spectator.fields.photoURL}
              alt={'spectator avatar'}
              isGameInProgress={isGameInProgress}
              isAnimated={spectator.fields.joinDate > addSeconds(new Date(), -5)}
            />
          );
        })}
    </div>
  );
};

const LobbyChatText = () => {
  const messages = useRecentLobbyMessages(30);

  return (
    <div className={'h-52 px-1.5'}>
      <LoadingFullBlur label={'Joining'} show={!messages}/>
      <ul className={'h-full overflow-y-auto rounded overflow-x-clip flex flex-col-reverse shadow-inner border-t-2'}>
        {!messages ?
          <LoadingSpinner/> :
          messages.map((messageData) => {
            return (
              <li key={messageData.id as string} className={'mt-1'}>
                <span className={'text-gray-400'}>{getSimpleTime(messageData.fields.sendDate)}</span>
                {messageData.fields.username ?
                  <span className={'text-blue-500 font-bold'}>{messageData.fields.username}</span> :
                  ''}
                <span className={messageData.fields.username ? 'text-gray-600' : 'text-gray-400 font-thin'}>
                  {messageData.fields.username ? ':' : ''} {messageData.fields.text}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

const LobbyChatInput = () => {
  const lobbyId = useContext(LobbyContext);

  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const sendMessage = useCallable('lobbies-sendMessage');

  const chatHandler = async () => {
    const text = chatInput;

    setChatInput('');
    setIsSending(true);
    await sendMessage({lobbyId: lobbyId, text: text}).catch(() => setIsSending(false));
    setIsSending(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enterHandler: React.KeyboardEventHandler<HTMLInputElement> = async (event: any) => {
    if (event.key === 'Enter') {
      await chatHandler();
    }
  };

  return (
    <div className={'flex mt-2 overflow:hidden text-gray-600'}>
      <input
        value={chatInput}
        onInput={(event) => setChatInput((event.target as HTMLInputElement).value)}
        onKeyDown={enterHandler}
        maxLength={280}
        placeholder={'Send a message'}
        className={
          'w-full mr-2 py-1.5 px-3 rounded bg-gray-200 hover:shadow-inner focus:bg-white focus:outline-blue-500'
        }
      />
      <SmallButton
        onClick={chatHandler}
        label={'Chat'}
        isLoading={isSending}
        isDisabled={chatInput.length < 1 || chatInput.length > 280}
      />
    </div>
  );
};

export const LobbyList = () => {
  const lobbies = useRecentLobbies(10);

  return (
    <CardSection title={'Lobby List'}>
      <AuthWrapper fallback={<span>Sign in to join</span>}>
        <div className={'h-72 overflow-y-auto shadow-inner px-1.5 rounded border border-gray-300'}>
          <ul>
            {!lobbies ?
              <LoadingSpinner/> :
              lobbies.map((lobby) => {
                return (
                  <li key={lobby.id}>
                    <LobbyListItem lobby={lobby}/>
                  </li>
                );
              })
            }
          </ul>
        </div>
      </AuthWrapper>
    </CardSection>
  );
};

export const LobbyListItem = ({lobby}: React.PropsWithoutRef<{ lobby: IdAndFields<Lobby> }>) => {
  const {data: user} = useUser();
  const firestore = useFirestore();
  const [isJoining, setIsJoining] = useState(false);
  const {setNavigation} = useContext(NavigationContext);
  const {setIsModalOpen, setModalType} = useContext(ModalContext);

  const joinHandler = async () => {
    setIsJoining(true);
    const isBanned = (await getDoc(doc(firestore, `lobbies/${lobby.id}/banned/${user?.uid}`))).exists();
    if (isBanned) {
      setModalType('BAN');
      setIsModalOpen(true);
    } else {
      setNavigation(lobby.id);
    }
    setIsJoining(false);
  };

  return (
    <div className={'py-2 px-2'}>
      {lobby.fields.lobbyName}
      <div className={'float-right -translate-y-0.5'}>
        <MiniButton
          onClick={joinHandler}
          icon={<LoginIcon className={'w-5 h-5 text-white'}/>}
          isLoading={isJoining}
          isDisabled={isJoining || lobby.fields.userCount >= lobby.fields.maxUsers}
        />
      </div>
      <div className={'float-right mr-3'}>{`${lobby.fields.userCount}/${lobby.fields.maxUsers}`}</div>
    </div>
  );
};

const lobbySizeSelections = Array.from(Array(7).keys()).map((n): ListboxSelection => {
  return {id: n, value: (n + 2)};
});

export const LobbyEditor = () => {
  const {setNavigation} = useContext(NavigationContext);
  const [lobbyName, setLobbyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [maxUsers, setMaxUsers] = useState(lobbySizeSelections[lobbySizeSelections.length - 1]);
  const createLobby = useCallable('lobbies-create');

  const createHandler = async (lobbyName: string) => {
    setIsCreating(true);
    createLobby({lobbyName: lobbyName, maxUsers: maxUsers.value}).then((result) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lobbyId = (result?.data as any)?.lobbyId;
      if (lobbyId) {
        setNavigation(lobbyId);
      }
    });
  };

  return (
    <CardSection title={'Edit Lobbies'}>
      <AuthWrapper fallback={<span>Sign in to edit</span>}>
        <LoadingFullBlur label={'Creating'} show={isCreating}/>
        <div>
          <div className={'flex'}>
            <input
              className={'w-full mb-2 mr-2 py-1.5 px-3 rounded bg-gray-200 ' +
                'hover:shadow-inner focus:bg-white focus:outline-blue-500'}
              value={lobbyName}
              onInput={(event) => setLobbyName((event.target as HTMLInputElement).value)}
              placeholder={'Choose a lobby name'}
              minLength={6}
              maxLength={16}
            />
            <MyListbox
              selections={lobbySizeSelections}
              getter={maxUsers}
              setter={setMaxUsers}
              label={'Size'}
              isFirstSelectionDefault={false}
            />
          </div>
          <LargeButton
            onClick={() => createHandler(lobbyName)}
            icon={<PlusIcon className={'w-4 h-4'}/>}
            label={'Create Lobby'}
            isLoading={isCreating}
            isDisabled={lobbyName.length < 6}
            loadingLabel={'Creating'}
          />
        </div>
      </AuthWrapper>
    </CardSection>
  );
};

export const LobbyNotFound = () => {
  const notFoundLobbyId = useContext(LobbyContext);

  return (
    <Card title={`Lobby ${notFoundLobbyId}`}>
      <CardSection title={`Lobby '${notFoundLobbyId}' not found`}>
        Either lobby does not exist or no access
      </CardSection>
    </Card>
  );
};

export const LobbyRouter = () => {
  const params = useParams();
  const navigate = useNavigate();
  const lobbyId = params.lobbyId as string;

  useEffect(() => {
    navigate('/', {state: {lobby: lobbyId}});
  });

  return <LoadingSpinner/>;
};

export const LobbyWrapper =
  ({
    children,
    fallback
  }: React.PropsWithChildren<{ fallback: JSX.Element }>) => {
    const lobbyId = useContext(LobbyContext);

    const firestore = useFirestore();
    const ref = doc(firestore, `lobbies/${lobbyId}`);
    const {status, data: lobby} = useFirestoreDocData(ref);

    if (!children) {
      throw new Error('Children must be provided');
    }

    if (status === 'loading') {
      return children as JSX.Element;
    } else if (status === 'error' || !lobby) {
      return fallback;
    } else if (status === 'success' && lobby) {
      return children as JSX.Element;
    }

    return fallback;
  };
