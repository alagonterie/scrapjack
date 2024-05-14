import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {lobbyCleanupAsync} from "../helpers/lobbies";


// Note: This is a Realtime Database trigger, *not* Firestore.
exports.onUserConnectionChange = functions.database.ref("/status/{uid}/connections").onWrite(
  async (change, context) => {
    const afterVal: string[] = [];
    const beforeVal: string[] = [];

    change.after.forEach((a) => {
      afterVal.push(a.val());
    });
    change.before.forEach((a) => {
      beforeVal.push(a.val());
    });

    const uid = context.params.uid;
    if (beforeVal === afterVal) {
      return null;
    }

    const userStatusFirestoreRef = admin.firestore().doc(`status/${uid}`);
    if (afterVal.length >= beforeVal.length) {
      await userStatusFirestoreRef.set({state: "online"}, {merge: true});
      return null;
    }

    if (afterVal.length === 0) {
      await userStatusFirestoreRef.set({lastOnline: new Date(), state: "offline"});
      await admin.database().ref(`/status/${uid}/lastOnline`).set(admin.database.ServerValue.TIMESTAMP);
    }

    // Clean up lobbies that user was in.
    return await lobbyCleanupAsync(uid);
  });
