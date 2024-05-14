import {Timestamp} from 'firebase/firestore';


export const getSimpleTime = (timestamp: Timestamp): string => {
  return timestamp
    .toDate()
    .toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
    .replace('AM', '')
    .replace('PM', '');
};

export const addSeconds = (date: Date, seconds: number): Timestamp => {
  const numberOfMlSeconds = date.getTime();
  const addMlSeconds = seconds * 1000;
  return Timestamp.fromDate(new Date(numberOfMlSeconds + addMlSeconds));
};

export const toPossessive = (name: string): string => {
  return !name.endsWith('s') ? `${name}'s` : `${name}'`;
};
