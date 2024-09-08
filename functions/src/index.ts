import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(require('./path-to-your-service-account-key.json')),
});

export const deleteWorker = functions.https.onCall(async (data, context) => {
  const workerId = data.workerId;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
    // Fetch the worker's document to get the associated user UID
    const workerRef = admin.firestore().collection('workers').doc(workerId);
    const workerDoc = await workerRef.get();
  
    if (!workerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Worker not found');
    }
  
    const workerData = workerDoc.data();
    const userUid = workerData?.uid; // Ensure this matches your document structure
  
    if (userUid) {
      // Delete the user from Firebase Authentication
      await admin.auth().deleteUser(userUid);
  
      // Now delete the worker document
      await workerRef.delete();
  
      return { message: 'Worker and user deleted successfully!' };
    } else {
      throw new functions.https.HttpsError('not-found', 'User UID not found');
    }
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw new functions.https.HttpsError('internal', 'Error deleting worker');
  }
});
