import React from 'react';
import {
  AuthProvider,
  useFirebaseApp,
  StorageProvider,
  DatabaseProvider,
  FirestoreProvider,
  FunctionsProvider,
} from 'reactfire';
import {connectAuthEmulator, getAuth} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getDatabase,
  connectDatabaseEmulator,
} from 'firebase/database';
import {getPerformance} from 'firebase/performance';
import {connectStorageEmulator, getStorage} from 'firebase/storage';
import {connectFunctionsEmulator, getFunctions} from 'firebase/functions';
import {initializeAppCheck, ReCaptchaV3Provider} from 'firebase/app-check';


export const FirebaseSdkWrapper: React.FC = ({children}) => {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const database = getDatabase(app);
  const storage = getStorage(app);
  const functions = getFunctions(app);
  getPerformance(app);

  if (process.env.NODE_ENV !== 'production') {
    connectAuthEmulator(auth, 'http://localhost:9099', {disableWarnings: true});
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectDatabaseEmulator(database, 'localhost', 9000);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } else {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(''),
      isTokenAutoRefreshEnabled: true
    });
  }

  return (
    <AuthProvider sdk={auth}>
      <FirestoreProvider sdk={firestore}>
        <DatabaseProvider sdk={database}>
          <StorageProvider sdk={storage}>
            <FunctionsProvider sdk={functions}>
              {children}
            </FunctionsProvider>
          </StorageProvider>
        </DatabaseProvider>
      </FirestoreProvider>
    </AuthProvider>
  );
};
