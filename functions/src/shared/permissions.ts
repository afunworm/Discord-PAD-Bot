import { Permissions } from './interfaces';
export const PERMISSIONS: { [name: string]: Permissions } = {
	admin: {
		createUser: true,
		readUser: true,
		updateUser: true,
		deleteUser: true,
		createObject: true,
		readObject: true,
		updateObject: true,
		deleteObject: true,
	},
	user: {
		createUser: false,
		readUser: false,
		updateUser: false,
		deleteUser: false,
		createObject: false,
		readObject: false,
		updateObject: false,
		deleteObject: false,
	},
};
