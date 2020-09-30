/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as admin from 'firebase-admin';
import { StorageObject } from '../shared/interfaces';

/*-------------------------------------------------------*
 * FIREBASE ADMIN
 *-------------------------------------------------------*/
const environment = require('../../environments/environment.json');
if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(require('../../' + environment.serviceAccount)),
		databaseURL: environment.databaseURL,
		storageBucket: environment.storageBucket,
	});
}
const firestore = admin.firestore();
const storage = admin.storage();

/*-------------------------------------------------------*
 * EXPRESS
 *-------------------------------------------------------*/
const app = express();
app.use(express.urlencoded()); //Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json()); //Parse JSON bodies (as sent by API clients)
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

/*
 *-------------------------------------------------------
 * DEPENDENCIES
 *-------------------------------------------------------
 * All functions required for this route
 */
function generateFirestoreId(len: number = 20): string {
	const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let autoId = '';
	for (let i = 0; i < len; i++) {
		autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return autoId;
}

/*
 *-------------------------------------------------------
 * ROUTE LOGICS
 *-------------------------------------------------------
 * All the route logics should be in this section below
 */
/*-------------------------------------------------------
 * onObjectCreated
 *-------------------------------------------------------
 * Extract custom metadata and create a reference doc
 * in Firestore whenever an object is uploaded to the
 * storage.
 */
exports.onObjectCreated = functions.storage.object().onFinalize((object: functions.storage.ObjectMetadata) => {
	const bucket = storage.bucket();
	const file = bucket.file(object.name as string);

	// Get a signed URL for the file
	return file.getSignedUrl({ action: 'read', expires: '12-31-3011' }).then(async (result) => {
		const url = result[0];
		let metadata = object.metadata;

		//Make sure object.name (filename) and object.contentType exists
		object.name = object.name ? object.name : '';
		object.contentType = object.contentType ? object.contentType : 'unknown';

		//Extract extension data
		let extension: string = object.name.split('.').pop() || 'unknown';

		//Generate id
		let fileId = object.metadata?.id ? object.metadata.id : generateFirestoreId();

		let data: StorageObject = {
			...metadata, //Come first so other details can be overwritten
			fileId: fileId,
			_ownedBy: metadata?._ownedBy || 'system',
			privacy: metadata?.privacy || 'private',
			firebaseStorageDownloadTokens: metadata?.firebaseStorageDownloadTokens || '',
			name: object.name,
			path: object.name,
			extension: extension,
			downloadUrl: url,
			contentType: object.contentType,
			size: Number(object.size),
			_createdAt: admin.firestore.Timestamp.fromDate(new Date(object.timeCreated)),
		};

		//Update fileId on that metadata
		await file.setMetadata({
			metadata: {
				fileId: fileId,
			},
		});

		//Add data to Firestore
		return firestore
			.collection('Storage')
			.doc(fileId)
			.set(data)
			.catch((error) => console.log(error));
	});
});

/*-------------------------------------------------------
 * ON OBJECT DELETED FROM STORAGE
 *-------------------------------------------------------
 * Remove data from Firestore whenever an object is
 * removed from storage
 */
exports.onObjectDelete = functions.storage.object().onDelete(async (object: functions.storage.ObjectMetadata) => {
	await firestore.collection('Log').add(object);
	if (object.metadata?.fileId) {
		return firestore
			.collection('Storage')
			.doc(object.metadata.fileId)
			.delete()
			.catch((error) => console.log(error));
	}

	return;
});

/*-------------------------------------------------------
 * ON STORAGE ENTRY DELETE FROM FIRESTORE
 *-------------------------------------------------------
 * Remove corresponding object from storage when its
 * entry is removed from Firestore
 */
exports.onStorageFirestoreDelete = functions.firestore.document('Storage/{fileId}').onDelete(async (snap, context) => {
	const data = snap.data() as functions.storage.ObjectMetadata;
	const bucket = storage.bucket();
	const name = data.name;

	return name ? bucket.file(name).delete() : null;
});
