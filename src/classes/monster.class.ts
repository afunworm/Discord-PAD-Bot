/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import * as admin from 'firebase-admin';
import { MonsterData, LeaderSkillData } from '../shared/monster.interfaces';
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

	public getMaxAttack(): number {
		return this.monsterData.maxATK;
	}

	public getMaxHP(): number {
		return this.monsterData.maxHP;
	}

	public getMaxRecover(): number {
		return this.monsterData.maxRCV;
	}

	public getlimitBreakPercentage(): number {
		return this.monsterData.limitBreakPercentage;
	}

	private getAwakenings(): number[] {
		return this.monsterData.awakenings;
	}

	public getAwakenEmotes(): string {
		let awakenings = this.getAwakenings();
		return awakenings.length ? Common.awakenEmotesMapping(awakenings).join(' ') : 'No Awakenings';
	}

	public getSuperAwakenings(): number[] {
		return this.monsterData.superAwakenings;
	}

	public getSuperAwakenEmotes(): string {
		let superAwakenings = this.getSuperAwakenings();
		return superAwakenings.length ? Common.awakenEmotesMapping(superAwakenings).join(' ') : 'No Super Awakenings';
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

	public getPreviousEvoId(): number {
		return this.monsterData.previousEvoId;
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

	public getLeaderSkill(): LeaderSkillData {
		return this.monsterData.leaderSkill;
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
		let maxMultipliers = leaderSkill.maxMultipliers;
		let hp = Math.pow(maxMultipliers[0], 2);
		let attack = Math.pow(maxMultipliers[1], 2);
		let recover = Math.pow(maxMultipliers[2], 2);
		let shield = 1 - Math.pow(1 - maxMultipliers[3], 2);

		shield *= 100;

		return leaderSkill.id === 0
			? ''
			: `Leader Skill: ${leaderSkill.name}\n[ ${hp}/${attack}/${recover} ${
					shield === 0 ? '' : 'with ' + shield + '% shield '
			  }]`;
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

	public getThumbnailUrl(): string {
		return Common.getThumbnailUrl(this.id);
	}

	public getImageUrl(): string {
		return Common.getImageUrl(this.id);
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

	public getCollab(): number {
		return this.monsterData.collab;
	}

	public getCollabReadable(): string {
		return this.monsterData.collabReadable;
	}

	public getSeries(): string {
		return this.monsterData.series;
	}

	public getSeriesReadable(): string {
		return this.monsterData.seriesReadable;
	}

	public getEvoMaterials(): number[] {
		return this.monsterData.evoMaterials;
	}

	public getDevoMaterials(): number[] {
		return this.monsterData.devoMaterials;
	}

	public static getAllCardsFromSeries(series: string): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let snapshot = await firestore.collection('Monsters').where('series', '==', series).get();

				if (snapshot.empty) resolve([]);

				let result = [];
				snapshot.forEach((doc) => {
					result.push(doc.data() as MonsterData);
				});

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static getAllCardsFromCollab(collabId: number): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let snapshot = await firestore.collection('Monsters').where('collab', '==', collabId).get();

				if (snapshot.empty) resolve([]);

				let result = [];
				snapshot.forEach((doc) => {
					result.push(doc.data() as MonsterData);
				});

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static getAllCardsFromCustomGroup(groupName: string): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let snapshot = await firestore.collection('Monsters').where('group', '==', groupName).get();

				if (snapshot.empty) resolve([]);

				let result = [];
				snapshot.forEach((doc) => {
					result.push(doc.data() as MonsterData);
				});

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static getAllCardsWithEvoType(evoType: string): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let snapshot = await firestore.collection('Monsters').where('evolutionType', '==', evoType).get();

				if (snapshot.empty) resolve([]);

				let result = [];
				snapshot.forEach((doc) => {
					result.push(doc.data() as MonsterData);
				});

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static getAllCardsWithAttributes(
		attribute1: number,
		attribute2: number | null = null
	): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let ref = firestore.collection('Monsters').where('mainAttribute', '==', attribute1);
				if (attribute2 !== null) ref = ref.where('subAttribute', '==', attribute2);

				let snapshot = await ref.get();

				if (snapshot.empty) resolve([]);

				let result = [];
				snapshot.forEach((doc) => {
					result.push(doc.data() as MonsterData);
				});

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static getCalculatedMaxStats(): Promise<any> {
		return new Promise(async (resolve, reject) => {
			try {
				let doc = await firestore.collection('Monsters').doc('@info').get();

				if (!doc.exists) resolve(null);

				resolve(doc.data());
			} catch (error) {
				reject(error);
			}
		});
	}
}
