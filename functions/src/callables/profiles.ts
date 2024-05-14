import * as functions from "firebase-functions";
import {validateCallableContext} from "../validation/context";
import {isValidDisplayname} from "../validation/format";
import * as admin from "firebase-admin";
import {getPublicUserInfoAsync} from "../helpers/auth";


/**
 * Updates the display name of the user. Also informs others in the user's lobby of the change.
 * @param {string} newDisplayname The new displayname to replace the old.
 */
exports.updateDisplayname = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);

  const newDisplayname: string | undefined = data;
  if (!newDisplayname || !isValidDisplayname(newDisplayname)) {
    throw new functions.https.HttpsError("invalid-argument", "required field displayname is invalid");
  }

  const uid = authData.uid;
  const db = admin.firestore();
  const {username: oldDisplayname} = await getPublicUserInfoAsync(uid);
  const userLobbySnaps = (await db.collection(`status/${uid}/lobbies`).get()).docs;

  const writeBatch = db.batch();
  for (const userLobbySnap of userLobbySnaps) {
    const lobbyMessageRef = db.collection(`lobbies/${userLobbySnap.id}/messages`).doc();
    writeBatch.set(lobbyMessageRef, {
      sendDate: new Date(),
      text: `'${oldDisplayname}' changed name to '${newDisplayname}'...`,
    });
  }
  await writeBatch.commit();

  await admin.auth().updateUser(uid, {
    displayName: newDisplayname,
  });
});
