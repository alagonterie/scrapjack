import * as React from 'react';
import {useSigninCheck} from 'reactfire';
import {LoadingSpinner} from './misc/Loading';
import {Auth, GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import {getFunctions, httpsCallable} from 'firebase/functions';


export const AuthWrapper = ({children, fallback}: React.PropsWithChildren<{ fallback: JSX.Element }>) => {
  const {status, data: signInCheckResult} = useSigninCheck();

  if (!children) {
    throw new Error('Children must be provided');
  }

  if (status === 'loading') {
    return <LoadingSpinner/>;
  } else if (signInCheckResult.signedIn) {
    return children as JSX.Element;
  }

  return fallback;
};

export const signOut = async (auth: Auth) => {
  const functions = getFunctions();
  const disconnect = httpsCallable(functions, 'presence-disconnect');

  await disconnect();
  await auth.signOut();
};

export const signIn = async (auth: Auth) => {
  const provider = new GoogleAuthProvider();

  return await signInWithPopup(auth, provider);
};
