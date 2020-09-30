/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as admin from 'firebase-admin';
import { PERMISSIONS } from '../shared/permissions';
import { User, AuthUser } from '../shared/interfaces';
import { UserRecord } from 'firebase-functions/lib/providers/auth';

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
const auth = admin.auth();
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
function toFirestoreTimestamp(date: Date): admin.firestore.Timestamp {
	return admin.firestore.Timestamp.fromDate(date);
}

function toAuthPhoneString(input: string): string {
	if (!input) return '';
	if (isAuthPhoneValid(input)) return input;

	let phone = input.replace(/\D/g, '');

	if (phone.length === 10) return `+1${phone}`;
	if (phone.length === 11 && phone.startsWith('1')) return '+1' + phone.substring(1);

	return phone;
}

function toFirestorePhoneString(input: string): string {
	if (!input) return '';
	if (isFirestorePhoneValid(input)) return input;

	let phone = input.replace(/\D/g, '').replace('+1', '');

	if (phone.length === 11 && phone.startsWith('1')) phone = phone.substring(1);

	return phone;
}

function isEmailValid(email: string): boolean {
	if (!email) return false;

	const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	return reg.test(email.toString().toLowerCase());
}

function isAuthPhoneValid(phone: string): boolean {
	if (!phone) return false;

	return /^\+1\d{10}$/.test(phone);
}

function isFirestorePhoneValid(phone: string): boolean {
	if (!phone) return false;

	return /^\d{10}$/.test(phone);
}

function isPhoneValid(phone: string): boolean {
	if (!phone) return false;

	return isAuthPhoneValid(phone) || isFirestorePhoneValid(phone) || /^1\d{10}$/.test(phone);
}

function isURLValid(url: string): boolean {
	if (typeof url !== 'string') return false;
	return url.startsWith('http://') || url.startsWith('https://');
}

/*
 *-------------------------------------------------------
 * ROUTE LOGICS
 *-------------------------------------------------------
 * All the route logics should be in this section below
 */
/*-------------------------------------------------------
 * onFirestoreUserUpdate
 *-------------------------------------------------------
 * Change Auth User's information when Firestore User's
 * document is updated
 */
exports.onFirestoreUserUpdate = functions.firestore.document('Users/{userId}').onUpdate(async (change, context) => {
	if (change.before.data() === change.after.data()) return;

	let data = change.after.data() as any;
	let email = data.email;
	let userId = context.params.userId;
	let updatedData: any = {};

	//Make sure email is valid
	if (email && isEmailValid(email)) {
		updatedData.email = email;
	}

	//Make sure phone is valid
	if (data.phone) {
		let phone = toFirestorePhoneString(data.phone);
		if (isFirestorePhoneValid(phone)) {
			//Update phone for auth
			updatedData.phoneNumber = toAuthPhoneString(data.phone);

			//Update phone for firestore
			await firestore
				.collection('System.Users')
				.doc(userId)
				.set(
					{
						phone: toFirestorePhoneString(data.phone),
					},
					{ merge: true }
				);
		}
	}

	if (data.password) {
		updatedData.password = data.password;
	}

	return admin.auth().updateUser(userId, updatedData);
});

/*-------------------------------------------------------
 * onFirestoreUserCreate
 *-------------------------------------------------------
 * Create an Auth User when Firestore User's document is
 * created
 */
exports.onFirestoreUserCreate = functions.firestore.document('Users/{userId}').onCreate(async (snapshot, context) => {
	const data = snapshot.data() as User;
	let phone = data.phone;
	let _createdBy = data._createdBy || 'system';
	let _createdFrom = data._createdFrom || 'cloud';
	let email = data.email;
	let uid = context.params.userId;
	let role = 'user';
	let password = data.password || Math.random().toString(36).substr(2, 9);

	//Allow role overriding only if the PERMISSIONS for that role exists
	if (data.role && PERMISSIONS[role]) {
		role = data.role;
	}

	//Remove entry if both email & phone are invalid
	phone = toAuthPhoneString(phone);
	if (!isAuthPhoneValid(phone) && !isEmailValid(email)) {
		return snapshot.ref.delete();
	}

	let userAuthData: AuthUser | any = {
		uid: uid,
		disabled: false,
	};

	if (isAuthPhoneValid(phone)) {
		userAuthData.phoneNumber = phone;
	}
	if (isEmailValid(email)) {
		userAuthData.email = email;
		userAuthData.password = password;
	}

	try {
		//Create user in Auth
		await auth.createUser(userAuthData);
	} catch (error) {
		console.log(error);
	}

	try {
		//Standardize User Document
		let userData: User = {
			_createdAt: toFirestoreTimestamp(new Date()),
			_createdBy: _createdBy,
			_createdFrom: _createdFrom,
			address1: data.address1 || '',
			address2: data.address2 || '',
			email: email || '',
			displayName: data.displayName || '',
			firstName: data.firstName || '',
			lastName: data.lastName || '',
			dob: null,
			phone: isPhoneValid(phone) ? toFirestorePhoneString(phone) : '',
			photoURL: isURLValid(data.photoURL) ? data.photoURL : '',
			role: role,
			uid: uid,
		};

		let batch = firestore.batch();

		//Update the current Firestore
		batch.set(firestore.collection('Users').doc(uid), userData, { merge: true });

		//Add permission
		batch.set(firestore.collection('Users').doc(uid).collection('Private').doc('permissions'), PERMISSIONS[role]);

		return batch.commit();
	} catch (error) {
		console.log(error);
		return;
	}
});
/*-------------------------------------------------------
 * onAuthUserCreate
 *-------------------------------------------------------
 * Add user to Users collection when a user is created
 * through Auth (example, log in with phone number)
 */
exports.onAuthUserCreate = functions.auth.user().onCreate(async (user: UserRecord) => {
	let userId = user.uid;

	//Remove entry if both email & phone are invalid
	if (!user.phoneNumber && !user.email) return;
	let phone = user.phoneNumber;
	let email = user.email;

	let userData: any = {
		uid: userId,
		displayName: user.displayName || '',
	};

	if (phone && isAuthPhoneValid(phone)) {
		userData.phone = toFirestorePhoneString(phone);
	}

	if (email && isEmailValid(email)) {
		userData.email = email;
	}

	try {
		//Create user in Firestore
		return firestore.collection('Users').doc(userId).set(userData, { merge: true });
	} catch (error) {
		console.log(error);
		return;
	}
});

/*-------------------------------------------------------
 * onAuthUserDelete
 *-------------------------------------------------------
 * Remove user Firestore document when that user is
 * removed from Firebase Authentication
 */
exports.onAuthUserDelete = functions.auth.user().onDelete(async (user: UserRecord) => {
	let userId = user.uid;

	try {
		//Users - Always last
		return firestore.collection('Users').doc(userId).delete();
	} catch (error) {
		console.log(error);
		return Promise.reject(error);
	}
});

/*-------------------------------------------------------
 * onFirestoreUserDelete
 *-------------------------------------------------------
 * Remove user from Firebase Authentication when that
 * user's Firestore document is removed
 */
exports.onFirestoreUserDelete = functions.firestore.document('Users/{userId}').onDelete((snapshot, context) => {
	let userId = context.params.userId;

	return auth.deleteUser(userId);
});
