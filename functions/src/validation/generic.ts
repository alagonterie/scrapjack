import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


/**
 * Validates whether a document exists.
 * @param {string} collectionPath Collection path to the document.
 * @param {string | undefined} docId ID of document to check.
 * @param {string} docIdName Name of the ID field for the document.
 * @param {string} docName Generic name describing the document entity.
 */
export async function validateDocExistsAsync(
  collectionPath: string, docId: string | undefined, docIdName: string, docName: string
):
  Promise<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>> {
  if (!docId) {
    throw new functions.https.HttpsError("invalid-argument", `${docIdName} field is required`);
  }

  const snap = await admin.firestore().doc(`${collectionPath}/${docId}`).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError("failed-precondition", `${docName} '${docId}' does not exist`);
  }

  return snap;
}
