import React, {useState} from 'react';
import {Card, CardContainer} from './components/misc/Card';
import {LobbyContainer, LobbyEditor, LobbyList} from './components/Lobby';
import {useLocation} from 'react-router-dom';
import {BottomNavbar, TopNavbar} from './components/Navbars';
import {NoPage} from './components/misc/NotFound';
import {Modal} from './components/misc/Modal';
import {ModalTypeOptions, NavigateOptions} from './enums';


export const NavigationContext = React.createContext({
  navigation: 'HOME',
  setNavigation: (_: NavigateOptions | string) => {}
});

export const ModalContext = React.createContext({
  isModalOpen: false,
  setIsModalOpen: (_: boolean) => {},
  modalType: 'OKAY',
  setModalType: (_: ModalTypeOptions | string) => {}
});

export const App = () => {
  const location = useLocation();

  // @ts-ignore
  const lobbyId = location.state?.lobby;
  return <AppContainer enterLobbyId={lobbyId}/>;
};

const AppContainer = ({enterLobbyId}: React.PropsWithoutRef<{ enterLobbyId: string }>) => {
  const [navigation, setNavigation] = useState<NavigateOptions | string>(enterLobbyId ?? 'HOME');
  const navigationValue = {navigation, setNavigation};

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalTypeOptions | string>('OKAY');
  const modalValue = {isModalOpen, setIsModalOpen, modalType, setModalType};

  return (
    <NavigationContext.Provider value={navigationValue}>
      <ModalContext.Provider value={modalValue}>
        <Modal/>
        <TopNavbar/>
        <CardContainer>
          {
            navigation === 'HOME' ? <Home/> :
              navigation === 'PLAY' ? <NoPage/> :
                navigation === 'WATCH' ? <NoPage/> :
                  navigation === 'CREATE' ? <NoPage/> :
                    <LobbyContainer lobbyId={navigation}/>
          }
        </CardContainer>
        <BottomNavbar/>
      </ModalContext.Provider>
    </NavigationContext.Provider>
  );
};

const Home = () => {
  return (
    <Card title={'Lobbies'}>
      <LobbyEditor/>
      <LobbyList/>
    </Card>
  );
};
