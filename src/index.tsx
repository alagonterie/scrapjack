import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './App';
import {LobbyRouter} from './components/Lobby';
import {NoPage} from './components/misc/NotFound';
import {Analytics} from './components/Analytics';
import {FirebaseSdkWrapper} from './Wrapper';
import {FirebaseAppProvider} from 'reactfire';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import reportWebVitals from './meta/reportWebVitals';
import {PresenceWrapper} from './components/Presence';


const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: ''
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element');
}

ReactDOM.render(
  <FirebaseAppProvider firebaseConfig={firebaseConfig}>
    <React.StrictMode>
      <FirebaseSdkWrapper>
        <PresenceWrapper>
          <BrowserRouter>
            <Routes>
              <Route path={'/'} element={<App/>}/>
              <Route path={'lobby'}>
                <Route index element={<NoPage message={'Select a lobby'}/>}/>
                <Route path={':lobbyId'} element={<LobbyRouter/>}/>
              </Route>
              <Route path={'*'} element={<NoPage/>}/>
            </Routes>
          </BrowserRouter>
        </PresenceWrapper>
      </FirebaseSdkWrapper>
      <Analytics/>
    </React.StrictMode>
  </FirebaseAppProvider>,
  rootElement
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
