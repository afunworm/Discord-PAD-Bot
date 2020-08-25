const NodeCache = require('node-cache');
const nodeCache = new NodeCache();

export class Cache {
	private _type;
	constructor(type: string) {
		this._type = type;
	}
	public set(key, value) {
		let data = {};
		data[key.toString()] = value;
		nodeCache.set(this._type, JSON.stringify(data));
	}

	public get(key) {
		let data = nodeCache.get(this._type);

		if (!data) return data;

		data = typeof data === 'string' ? JSON.parse(data) : data;

		return data[key];
	}
}
