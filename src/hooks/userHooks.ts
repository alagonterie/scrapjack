import {useFirestore, useFirestoreDocData, useUser} from 'reactfire';
import {doc} from 'firebase/firestore';
import {Status} from '../interfaces';


export const useUserStatus = (): Status | undefined => {
  const {data: user} = useUser();
  const firestore = useFirestore();
  const {data: userStatusData} = useFirestoreDocData(doc(firestore, `status/${user?.uid}`));

  return userStatusData as Status;
};
