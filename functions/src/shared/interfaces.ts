export interface Permissions {
	createObject: boolean;
	createUser: boolean;
	deleteObject: boolean;
	deleteUser: boolean;
	readObject: boolean;
	readUser: boolean;
	updateObject: boolean;
	updateUser: boolean;
}

export interface User {
	_createdAt: Date | FirebaseFirestore.Timestamp;
	_createdBy: string;
	_createdFrom: string;
	uid: string;
	displayName: string;
	firstName: string;
	lastName: string;
	address1: string;
	address2: string;
	phone: string;
	dob: null | Date | FirebaseFirestore.Timestamp;
	email: string;
	photoURL: string;
	role: string;
	password?: string;
}

export interface AuthUser {
	uid?: string;
	email?: string;
	emailVerified?: boolean;
	phoneNumber: string;
	password?: string;
	displayName?: string;
	photoURL?: string;
	disabled?: boolean;
}

export interface StorageObject {
	_createdAt: Date | FirebaseFirestore.Timestamp;
	_ownedBy: string;
	fileId: string;
	contentType: string;
	downloadUrl: string;
	extension: string;
	firebaseStorageDownloadTokens: string;
	name: string;
	privacy: 'public' | 'private' | string;
	size: number;
	[name: string]: any;
}
