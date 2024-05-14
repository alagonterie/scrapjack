import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {validateCallableContext} from "../validation/context";


/**
 * The user disconnects from the realtime database.
 */
exports.disconnect = functions.https.onCall(async (data, context) => {
  const authData = validateCallableContext(context);
  const uid = authData.uid;

  await admin.database().ref(`/status/${uid}/connections`).remove();
});
