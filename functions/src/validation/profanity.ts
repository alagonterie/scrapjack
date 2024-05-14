import {Profanity, ProfanityOptions} from "@2toad/profanity";


const grawlix = "♥♥♥";
const options = new ProfanityOptions();
options.wholeWord = true;
options.grawlix = grawlix;

const profanity = new Profanity(options);

export const cleanProfanity = (text: string): string => {
  return profanity.censor(text);
};

export const isProfane = (text: string): boolean => {
  return profanity.exists(text) || isProfaneSpaced(text);
};

const isProfaneSpaced = (text: string): boolean => {
  return profanity.exists(text.replaceAll(" ", ""));
};
