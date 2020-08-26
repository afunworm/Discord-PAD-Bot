/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import * as admin from 'firebase-admin';
import { MonsterData } from '../shared/monster.interfaces';
import { MONSTER_TYPES } from '../shared/monster.types';
import { MonsterParser } from './monsterParser.class';
import { Common } from './common.class';
import { Cache } from './cache.class';

/*-------------------------------------------------------*
 * FIREBASE ADMIN
 *-------------------------------------------------------*/
if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(require('../' + process.env.FIREBASE_SERVICE_ACCOUNT)),
		databaseURL: process.env.FIREBASE_DATABASE_URL,
	});
}
const firestore = admin.firestore();
const cache = new Cache('monsters');

export class Monster {
	private id: number;
	private monsterData: MonsterData;

	constructor(id: number) {
		if (!Number.isInteger(id)) {
			throw new Error('Invalid ID number for monster.');
		}

		if (id > this.getHighestValidMonsterId() || id < 1) {
			throw new Error('Invalid ID number for monster.');
		}

		this.id = id;
	}

	static getDatabaseLength(): number {
		return MonsterParser.getMonsterDatabaseLength();
	}

	public getHighestValidMonsterId(): number {
		return Number(process.env.HIGHEST_VALID_MONSTER_ID);
	}

	public init() {
		return new Promise(async (resolve, reject) => {
			if (!this.id) {
				throw new Error('Invalid init. new Monster(id) needs to be called first.');
			}

			//Check cache
			let cachedData = cache.get(this.id);
			if (cachedData) {
				this.monsterData = cachedData;
				resolve(this);
				return;
			}

			//If the monster data is not in cache, grab it from Firestore
			let monsterId = this.id.toString();
			try {
				let doc = await firestore.collection('Monsters').doc(monsterId).get();

				if (!doc.exists) reject(`Unable to find monster with the ID ${monsterId} from the database.`);

				let monsterData = doc.data() as MonsterData;

				//Assign cache of data
				this.monsterData = monsterData;
				cache.set(monsterId, monsterData);

				//Resolve it
				resolve(this);
			} catch (error) {
				console.log(error);
				reject('An error has occurred. Please check log.');
			}
		});
	}

	getFullData() {
		return this.monsterData;
	}

	public getId(): number {
		return this.id;
	}

	public getName(): string {
		return this.monsterData.name;
	}

	private getAwakenings(): number[] {
		return this.monsterData.awakenings;
	}

	public getAwakenEmotes(): string {
		let awakenings = this.getAwakenings();
		return awakenings.length ? Common.awakenEmotesMapping(awakenings) : 'No Awakenings';
	}

	public getSuperAwakenings(): number[] {
		return this.monsterData.superAwakenings;
	}

	public getSuperAwakenEmotes(): string {
		let superAwakenings = this.getSuperAwakenings();
		return superAwakenings.length ? Common.awakenEmotesMapping(superAwakenings) : 'No Super Awakenings';
	}

	public getTypesReadable(): string[] {
		return this.monsterData.typesReadable;
	}

	public getRarity(): number {
		return this.monsterData.rarity;
	}

	public getCost(): number {
		return this.monsterData.cost;
	}

	public getMonsterPoints(): number {
		return this.monsterData.monsterPoints;
	}

	public isInheritable(): boolean {
		return this.monsterData.isInheritable;
	}

	public isLimitBreakable(): boolean {
		return this.monsterData.isLimitBreakable;
	}

	public getLatentKillers(): number[] {
		let map: { [key: string]: number[] } = {
			'1': [1, 2, 3, 4, 5, 6, 7, 8], //Balanced (1) can take all
			'2': [3, 8], //Physical (2) can take Healer/Machine
			'3': [4, 6], //Healer (3) can take Dragon/Attacker
			'4': [3, 8], //Dragon (4) can take Healer/Machine
			'5': [7], //God (5) can take Devil
			'6': [2, 7], //Attacker (6) can take Physical/Devil
			'7': [5], //Devil (7) can take God
			'8': [1, 5], //Machine (8) can take Balanced/God
		};

		let result = [];
		let monsterTypes = this.monsterData.types;

		for (let i = 0; i < monsterTypes.length; i++) {
			let monsterType = monsterTypes[i];
			let killers = map[monsterType];

			if (killers) {
				killers.forEach((killer) => {
					result.push(killer);
				});
			}
		}

		//Remove duplicates
		result = result.filter((item, index, accumulator) => accumulator.indexOf(item) === index);

		return result;
	}

	private mapTypes(typeInput: any[]): string[] {
		let result = [];
		for (let i = 0; i < typeInput.length; i++) {
			let typeId = typeInput[i];
			let type = MONSTER_TYPES[typeId];
			if (typeId !== '-1' && typeId !== -1) {
				result.push(type);
			}
		}
		return result;
	}

	public getGenericInfo(): string {
		let info = '';

		info += `${this.getTypesReadable().join('/')}\n`;
		info += `Rarity: ${this.getRarity()}\n`;
		info += `Cost: ${this.getCost()}\n`;
		info += `MP: ${this.getMonsterPoints()}\n`;
		info += `Inheritable: ${this.isInheritable()}`;

		return info;
	}

	public getStats(): string {
		let stats = '';
		let maxHP = this.monsterData.maxHP;
		let maxATK = this.monsterData.maxATK;
		let maxRCV = this.monsterData.maxRCV;
		let limitBreakPercentage = this.monsterData.limitBreakPercentage;

		if (!this.isLimitBreakable) {
			stats += `HP: ${maxHP}\n`;
			stats += `ATK: ${maxATK}\n`;
			stats += `RCV: ${maxRCV}`;
			return stats;
		}

		stats += `HP: ${maxHP} (${Math.round(maxHP * (1 + limitBreakPercentage / 100))})\n`;
		stats += `ATK: ${maxATK} (${Math.round(maxATK * (1 + limitBreakPercentage / 100))})\n`;
		stats += `RCV: ${maxRCV} (${Math.round(maxRCV * (1 + limitBreakPercentage / 100))})`;

		return stats;
	}

	public getActiveSkillHeader(): string {
		let activeSkill = this.monsterData.activeSkill;

		return activeSkill.id === 0
			? ''
			: `Active Skill: ${activeSkill.name} (${activeSkill.cooldown} -> ${activeSkill.cooldownAtMaxLevel})`;
	}

	public hasActiveSkill(): boolean {
		let activeSkill = this.monsterData.activeSkill;

		return !(activeSkill.id === 0 || !activeSkill.descriptionDetails);
	}

	public getActiveSkillDescription(): string {
		let activeSkill = this.monsterData.activeSkill;

		if (!this.hasActiveSkill()) {
			return 'None';
		}

		return activeSkill.description;
	}

	public getActiveSkillDescriptionDetails(): string {
		let activeSkill = this.monsterData.activeSkill;

		if (!this.hasActiveSkill()) {
			return 'None';
		}

		let result = [];
		activeSkill.descriptionDetails.forEach((skill, index) => {
			result.push(`[${index + 1}] ${skill}`);
		});

		return result.length <= 0 ? 'None' : result.join('\n');
	}

	public getLeaderSkillHeader(): string {
		let leaderSkill = this.monsterData.leaderSkill;

		return leaderSkill.id === 0 ? '' : `Leader Skill: ${leaderSkill.name}`;
	}

	public hasLeaderSkill(): boolean {
		let leaderSkill = this.monsterData.leaderSkill;

		return leaderSkill.id !== 0;
	}

	public getLeaderSkillDescription(): string {
		let leaderSkill = this.monsterData.leaderSkill;

		if (!this.hasLeaderSkill()) {
			return 'None';
		}

		return leaderSkill.description.replace(/\^[0-9a-f]{6}\^([^^]+)\^\w+/g, '$1');
	}

	public getLeaderSkillDescriptionDetails(): string {
		let leaderSkill = this.monsterData.leaderSkill;

		if (!this.hasLeaderSkill()) {
			return 'None';
		}

		let result = [];
		leaderSkill.descriptionDetails.forEach((skill, index) => {
			// Regex to remove color formatting text - https://regex101.com/r/pMMKCH/1
			let skillDetails = skill.replace(/\^[0-9a-f]{6}\^([^^]+)\^\w+/g, '$1');
			result.push(`[${index + 1}] ${skillDetails}`);
		});

		return result.length <= 0 ? 'None' : result.join('\n');
	}

	private fixCardNoLength(no: number | string): string {
		return no.toString().padStart(5, '0');
	}

	public getThumbnailUrl(): string {
		let cardId = this.id.toString();
		cardId = this.fixCardNoLength(cardId);

		return `https://static.pad.byh.uy/icons/${cardId}.png`;
	}

	public getImageUrl(): string {
		let cardId = this.id.toString();
		cardId = this.fixCardNoLength(cardId);

		return `https://static.pad.byh.uy/images/${cardId}.png`;
	}

	public getUrl(): string {
		return `http://puzzledragonx.com/en/monster.asp?n=${this.id}`;
	}

	public getAvailableKillers(): string {
		let killerLatents = this.getLatentKillers();
		return Common.killerEmotesMapping(killerLatents).join(' ');
	}

	public getEvoTree(): number[] {
		return this.monsterData.evoTree;
	}

	public getMainAttribute(): number {
		return this.monsterData.mainAttribute;
	}

	public getSubAttribute(): number {
		return this.monsterData.subAttribute;
	}

	public getAttributeEmotes(): string {
		if (!this.monsterData.subAttribute) {
			return Common.attributeEmotesMapping([this.monsterData.mainAttribute]).join('');
		} else {
			return Common.attributeEmotesMapping([this.monsterData.mainAttribute, this.monsterData.subAttribute]).join(
				' '
			);
		}
	}
}
