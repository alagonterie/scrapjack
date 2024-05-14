import {collection, doc, query, QueryConstraint} from 'firebase/firestore';
import {useFirestore, useFirestoreCollectionData, useFirestoreDocData} from 'reactfire';


export const useFields = <Type>(path: string): Type | undefined => {
  const firestore = useFirestore();
  const docRef = doc(firestore, path);
  const {data} = useFirestoreDocData(docRef);

  return data as Type;
};

export const useIdAndFields = <Type>(basePath: string, id: string): IdAndFields<Type> | undefined => {
  const firestore = useFirestore();
  const docRef = doc(firestore, `${basePath}/${id}`);
  const {data} = useFirestoreDocData(docRef);

  return {
    id: id,
    fields: data as Type
  };
};

export const useIdAndFieldsCollection = <Type>(
  path: string,
  ...queryConstraints: QueryConstraint[]
): IdAndFields<Type>[] | undefined => {
  const firestore = useFirestore();
  const collectionRef = collection(firestore, path);
  const collectionQuery = query(collectionRef, ...queryConstraints);
  const {data: collectionData} = useFirestoreCollectionData(collectionQuery, {idField: 'id'});

  return collectionData?.map((docData) => {
    return {
      id: docData.id as string,
      fields: docData as Type
    };
  });
};

export interface IdAndFields<Type> {
  id: string;
  fields: Type
}
