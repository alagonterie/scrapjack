import React, {useEffect, useState} from 'react';
import {useSigninCheck} from 'reactfire';
import {getDatabase, onDisconnect, onValue} from 'firebase/database';
import {push, ref, set} from '@firebase/database';


export const UserContext = React.createContext({
  user: null as string | null,
  setUser: (_: string | null) => {}
});

export const PresenceWrapper: React.FC = ({children}) => {
  const [user, setUser] = useState<string | null>(null);
  const userValue = {user, setUser};

  const {status, data: signInResult} = useSigninCheck();
  useEffect(() => {
    if (signInResult?.user?.displayName) {
      setUser(signInResult.user.displayName);
    }
  }, [status, signInResult?.user?.displayName]);

  const provider = (
    <UserContext.Provider value={userValue}>
      {children}
    </UserContext.Provider>
  );

  if (status === 'loading') {
    return provider;
  }

  const {signedIn, user: signedInUser} = signInResult;

  if (!signedIn || !signedInUser) {
    return provider;
  }

  handlePresence(signedInUser.uid);
  return provider;
};

function handlePresence(uid: string) {
  const database = getDatabase();
  const userConnectionsCollectionDatabaseRef = ref(database, `/status/${uid}/connections`);

  onValue(ref(database, '.info/connected'), async (snapshot) => {
    if (!snapshot.val()) {
      return;
    }

    // TODO: move these writes into callable functions and block all writes to realtime database.
    const pushedConnectionsRef = push(userConnectionsCollectionDatabaseRef);

    await onDisconnect(pushedConnectionsRef).remove();

    await set(pushedConnectionsRef, true);
  });
}
