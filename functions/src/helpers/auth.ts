import {auth} from "firebase-admin";


export async function getPublicUserInfoAsync(uid: string):
  Promise<{ username: string | undefined, photoURL: string | undefined }> {
  const authUser = await auth().getUser(uid);
  const username = authUser.displayName ?? "[unknown]";
  const photoURL = authUser.photoURL ?? "https://www.squatties.com/images/avatars/avatar-captain-jack-sparrow-256.png";
  return {username, photoURL};
}
