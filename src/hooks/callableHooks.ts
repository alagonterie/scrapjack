import {useFunctions} from 'reactfire';
import {httpsCallable, HttpsCallable} from 'firebase/functions';
import {CallableOptions} from '../enums';


export const useCallable = (name: CallableOptions): HttpsCallable => {
  const functions = useFunctions();
  return httpsCallable(functions, name);
};
