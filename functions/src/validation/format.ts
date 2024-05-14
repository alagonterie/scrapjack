import {isProfane} from "./profanity";


export const isValidDisplayname = (username: string): boolean => {
  if (username.length < 2 || username.length > 26) {
    return false;
  }

  if (!new RegExp("^[A-Za-z0-9]+( [A-Za-z0-9]+)?$").test(username)) {
    return false;
  }

  return !isProfane(username) && !isProfane(username.replaceAll(" ", ""));
};
