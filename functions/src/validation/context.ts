import {AuthData, CallableContext} from "firebase-functions/lib/common/providers/https";
import * as functions from "firebase-functions";


export function validateCallableContext(context: CallableContext): AuthData {
  if (process.env.NODE_ENV === "production" && context.app == undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "function must be called from an App Check verified app.");
  }

  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "function must be called by an authenticated user.");
  }

  return context.auth;
}
