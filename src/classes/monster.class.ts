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
import { WhereFilterOp } from '@firebase/firestore-types';
import { AWAKENINGS } from '../../dist/shared/monster.awakens';

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

export interface FilterCondition {
	type: 'series' | 'evoType' | 'awakening' | 'attribute' | 'type';
	monsterType?: number;
	monsterSeries?: string;
	queryEvoType?: string;
	queryCompare?: string;
	monsterAwakening?: number;
	queryQuantity?: number;
	attribute1?: number;
	attribute2?: number;
}

export class Monster {
	private id: number;
	private monsterData: MonsterData;

	constructor(id: number) {
		if (!Number.isInteger(id)) {
			throw new Error(`${id} is not a valid monster id.`);
		}

		if (id > Monster.getHighestValidMonsterId() || id < 1) {
			throw new Error(`${id} is not a valid monster id.`);
		}

		this.id = id;
	}

	static getDatabaseLength(): number {
		return MonsterParser.getMonsterDatabaseLength();
	}

	public static getHighestValidMonsterId(): number {
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
		if (awakenings.length < 8 && awakenings.length > 0) {
			let more = 8 - awakenings.length;
			for (let i = 0; i < more; i++) {
				awakenings.push(0);
			}
		}
		return awakenings.length ? Common.awakenEmotesMapping(awakenings).join(' ') : 'No Awakenings';
	}

	public getSuperAwakenings(): number[] {
		return this.monsterData.superAwakenings;
	}

	public getSuperAwakenEmotes(): string {
		//console.log('---\nFor ' + this.id + '\n');
		let superAwakenings = this.getSuperAwakenings();
		if (superAwakenings.length < 8 && superAwakenings.length > 0) {
			let more = 8 - superAwakenings.length;
			for (let i = 0; i < more; i++) {
				superAwakenings.push(0);
			}
		}
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

	public isExtraSlottable(): boolean {
		return this.monsterData.isExtraSlottable;
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
		let attack: number | string = Math.pow(maxMultipliers[1], 2);
		let recover = Math.pow(maxMultipliers[2], 2);
		let shield = 1 - Math.pow(1 - maxMultipliers[3], 2);

		shield *= 100;
		if (attack === 0) attack = ' ∞ ';

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
		if (killerLatents.length < 8 && killerLatents.length > 0) {
			let more = 8 - killerLatents.length;
			for (let i = 0; i < more; i++) {
				killerLatents.push(0);
			}
		}
		return Common.killerEmotesMapping(killerLatents).join(' ') || 'No Killers Available';
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

	public static getAllCardsWithType(type: number): Promise<MonsterData[]> {
		return new Promise(async (resolve, reject) => {
			try {
				let ref = firestore.collection('Monsters').where('types', 'array-contains', type);
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

	public static fixAttributeDetection(data) {
		let { monsterAttribute1, monsterAttribute2 } = data;
		if (monsterAttribute1 !== null && monsterAttribute2 !== null) {
			monsterAttribute1 = Number(monsterAttribute1);
			monsterAttribute2 = Number(monsterAttribute2);
		} else if (monsterAttribute1 !== null && monsterAttribute2 === null) {
			monsterAttribute1 = Number(monsterAttribute1);
		} else if (monsterAttribute1 === null && monsterAttribute2 !== null) {
			monsterAttribute1 = Number(monsterAttribute2);
			monsterAttribute2 = null;
		}
		return {
			monsterAttribute1,
			monsterAttribute2,
		};
	}

	public static constructFilterConditions(data): FilterCondition[] {
		let conditions: FilterCondition[] = [];
		let {
			monsterSeries,
			queryEvoType,
			monsterAwakenings1,
			monsterAwakenings2,
			monsterAwakenings3,
			monsterTypes,
			queryCompare1,
			queryCompare2,
			queryCompare3,
			queryQuantity1,
			queryQuantity2,
			queryQuantity3,
		} = data;

		//Fix attribute detection
		let { monsterAttribute1, monsterAttribute2 } = this.fixAttributeDetection(data);

		//If monsterSeries is a number string, convert it to Number
		if (/^\d+$/.test(monsterSeries)) monsterSeries = Number(monsterSeries);

		//Convert quantity, awakenings and attributes to number
		queryQuantity1 = Number(queryQuantity1); //We do not care about the value of this unless the awakening is present
		queryQuantity2 = Number(queryQuantity2); //We do not care about the value of this unless the awakening is present
		queryQuantity3 = Number(queryQuantity3); //We do not care about the value of this unless the awakening is present
		monsterAwakenings1 = monsterAwakenings1 === null ? monsterAwakenings1 : Number(monsterAwakenings1);
		monsterAwakenings2 = monsterAwakenings2 === null ? monsterAwakenings2 : Number(monsterAwakenings2);
		monsterAwakenings3 = monsterAwakenings3 === null ? monsterAwakenings3 : Number(monsterAwakenings3);
		monsterTypes = monsterTypes === null ? null : Number(monsterTypes);

		//Do some prerequisite manipulation
		//If there is awakening but no compare or quantity (monster with skill boosts) => compare = min, quantity = 1
		if (monsterAwakenings1 !== null && queryCompare1 === null && queryQuantity1 === null) {
			queryCompare1 = 'min';
			queryQuantity1 = 1;
		}
		if (monsterAwakenings2 !== null && queryCompare2 === null && queryQuantity2 === null) {
			queryCompare2 = 'min';
			queryQuantity2 = 1;
		}
		if (monsterAwakenings3 !== null && queryCompare3 === null && queryQuantity3 === null) {
			queryCompare3 = 'min';
			queryQuantity3 = 1;
		}

		//If there is awakening and quantity but no compare (monster with 5 skill boost) => compare = exact
		if (monsterAwakenings1 !== null && queryQuantity1 !== null && queryCompare1 === null) {
			queryCompare1 = 'exact';
		}
		if (monsterAwakenings2 !== null && queryQuantity2 !== null && queryCompare2 === null) {
			queryCompare2 = 'exact';
		}
		if (monsterAwakenings3 !== null && queryQuantity3 !== null && queryCompare3 === null) {
			queryCompare3 = 'exact';
		}

		//Push them inside conditions for ease of processing
		//Also to be in control of what to filter first
		if (monsterSeries !== null) {
			conditions.push({
				type: 'series',
				monsterSeries: monsterSeries,
			});
		}
		if (queryEvoType !== null) {
			conditions.push({
				type: 'evoType',
				queryEvoType: queryEvoType,
			});
		}
		if (monsterAwakenings1 !== null) {
			conditions.push({
				type: 'awakening',
				monsterAwakening: monsterAwakenings1,
				queryCompare: queryCompare1,
				queryQuantity: queryQuantity1,
			});
		}
		if (monsterAwakenings2 !== null) {
			conditions.push({
				type: 'awakening',
				monsterAwakening: monsterAwakenings2,
				queryCompare: queryCompare2,
				queryQuantity: queryQuantity2,
			});
		}
		if (monsterAwakenings3 !== null) {
			conditions.push({
				type: 'awakening',
				monsterAwakening: monsterAwakenings3,
				queryCompare: queryCompare3,
				queryQuantity: queryQuantity3,
			});
		}
		if (monsterAttribute1 !== null) {
			conditions.push({
				type: 'attribute',
				attribute1: monsterAttribute1,
				attribute2: monsterAttribute2,
			});
		}
		if (monsterTypes !== null) {
			conditions.push({
				type: 'type',
				monsterType: monsterTypes,
			});
		}

		return conditions;
	}

	public static convertFilterConditions(conditions: FilterCondition[]): FilterCondition[] {
		//Convert SB+, resist+, etc. to their smaller counterparts
		conditions = conditions.map((condition, index) => {
			if (condition.type !== 'awakening') return condition;

			let computedAwakening = condition.monsterAwakening;
			let originalQuantity = condition.queryQuantity;
			let quantity = 1;

			if (computedAwakening === 52) {
				computedAwakening = 10;
				quantity = 2;
			} else if (computedAwakening === 68) {
				computedAwakening = 11;
				quantity = 5;
			} else if (computedAwakening === 69) {
				computedAwakening = 12;
				quantity = 5;
			} else if (computedAwakening === 70) {
				computedAwakening = 13;
				quantity = 5;
			} else if (computedAwakening === 53) {
				computedAwakening = 19;
				quantity = 2;
			} else if (computedAwakening === 56) {
				computedAwakening = 21;
				quantity = 2;
			}

			return {
				...condition,
				monsterAwakening: computedAwakening,
				queryQuantity: originalQuantity * quantity,
			};
		});

		return conditions;
	}

	public static filterByAttributes(
		monsterList: MonsterData[],
		attribute1: number,
		attribute2: number | null = null
	): MonsterData[] {
		if (attribute1 !== null) {
			monsterList = monsterList.filter((monster) => monster.mainAttribute === Number(attribute1));
		}
		if (attribute2 !== null) {
			monsterList = monsterList.filter((monster) => monster.subAttribute === Number(attribute2));
		}

		return monsterList;
	}

	public static filterByType(monsterList: MonsterData[], type): MonsterData[] {
		if (!type && type !== 0) return monsterList;
		monsterList = monsterList.filter((monster) => monster.types.includes(Number(type)));

		return monsterList;
	}

	public static filterBySeries(monsterList: MonsterData[], series): MonsterData[] {
		if (!series && series !== 0 && series !== '0') return monsterList;

		return monsterList.filter(
			(monster: MonsterData) => monster.series === series || monster.collab === Number(series)
		);
	}

	public static filterByEvoType(monsterList: MonsterData[], evoType): MonsterData[] {
		if (!evoType && evoType !== 0) return monsterList;
		return monsterList.filter((monster: MonsterData) => monster.evolutionType === evoType);
	}

	public static getAllCardsWithMultipleConditions(
		conditions: FilterCondition[],
		queryIncludeSA: boolean = true,
		conditionsToRun: string[] = ['series', 'evoType', 'awakening', 'attribute', 'type']
	): Promise<MonsterData[]> {
		//Replace common condition type
		conditionsToRun = conditionsToRun.map((condition) => {
			if (condition === 'monsterSeries') return 'series';
			if (condition === 'queryEvoType') return 'evoType';
			if (condition === 'awakenings' || condition === 'monsterAwakenings' || condition === 'monsterAwakening')
				return 'awakening';
			if (condition === 'attributes ' || condition === 'monsterAttributes' || condition === 'monsterAttribute')
				return 'attribute';
			if (condition === 'types ' || condition === 'monsterTypes' || condition === 'monsterType') return 'type';
			return condition;
		});

		return new Promise(async (resolve, reject) => {
			let monsters: MonsterData[] = [];
			let fieldName = queryIncludeSA ? 'computedAwakeningsWithSA' : 'computedAwakeningsWithoutSA';

			try {
				//Using for-loop for async
				for (const condition of conditions) {
					if (condition.type === 'series' && conditionsToRun.includes('series')) {
						console.log('Running series filter...');
						let series = condition.monsterSeries;
						if (monsters.length === 0) {
							//Get new data
							let monsterList;
							if (/^\d+$/.test(series)) {
								monsterList = await Monster.getAllCardsFromCollab(Number(series));
							} else {
								monsterList = await Monster.getAllCardsFromSeries(series);
							}

							monsters.push(...monsterList);
						} else {
							//Filter from monsters
							monsters = this.filterBySeries(monsters, series);
						}
					} else if (condition.type === 'evoType' && conditionsToRun.includes('evoType')) {
						console.log('Running evoType filter...');
						let evoType = condition.queryEvoType;
						if (monsters.length === 0) {
							//Get new data
							let monsterList = await Monster.getAllCardsWithEvoType(evoType);

							monsters.push(...monsterList);
						} else {
							//Filter from monsters
							monsters = this.filterByEvoType(monsters, evoType);
						}
					} else if (condition.type === 'awakening' && conditionsToRun.includes('awakening')) {
						console.log('Running awakening filter...');
						let awakening = condition.monsterAwakening;
						let quantity = condition.queryQuantity;
						let compare = condition.queryCompare;
						let compareString: WhereFilterOp = '>=';

						if (compare === 'max') compareString = '<=';
						else if (compare === 'exact') compareString = '==';
						else if (compare === 'less') compareString = '<';
						else if (compare === 'more') compareString = '>';

						if (monsters.length === 0) {
							//Get new data
							let snapshot = await firestore
								.collection('Monsters')
								.where(`${fieldName}.${awakening}`, compareString, quantity)
								.get();

							if (snapshot.empty) return;

							let monsterList = [];
							snapshot.forEach((monster) => monsterList.push(monster.data()));

							monsters.push(...monsterList);
						} else {
							//Filter from monsters
							monsters = monsters.filter((monster: MonsterData) => {
								switch (compare) {
									case 'max':
										return monster[fieldName][awakening] <= quantity;
										break;
									case 'exact':
										return monster[fieldName][awakening] === quantity;
										break;
									case 'less':
										return monster[fieldName][awakening] < quantity;
										break;
									case 'more':
										return monster[fieldName][awakening] > quantity;
										break;
									default:
										//Min
										return monster[fieldName][awakening] >= quantity;
										break;
								}
							});
						}
					} else if (condition.type === 'attribute' && conditionsToRun.includes('attribute')) {
						console.log('Running attribute filter...');
						let attribute1 = condition.attribute1;
						let attribute2 = condition.attribute2;

						if (monsters.length === 0) {
							//Get new data
							let monsterList = await Monster.getAllCardsWithAttributes(attribute1, attribute2);

							monsters.push(...monsterList);
						} else {
							//Filter from monsters
							monsters = this.filterByAttributes(monsters, attribute1, attribute2);
						}
					} else if (condition.type === 'type' && conditionsToRun.includes('type')) {
						console.log('Running type filter...');
						let type = condition.monsterType;

						if (monsters.length === 0) {
							//Get new data
							let monsterList = await Monster.getAllCardsWithType(type);

							monsters.push(...monsterList);
						} else {
							//Filter from monsters
							monsters = this.filterByType(monsters, type);
						}
					}
				}

				//Filter up to the valid id only
				let maxId = Monster.getHighestValidMonsterId();
				monsters = monsters.filter((monster) => monster.id <= maxId);

				resolve(monsters);
			} catch (error) {
				reject(error);
			}
		});
	}

	public static fixCollabId(collab: number | string) {
		if (collab === 21 || collab === '21') return 61; //Monster Hunter 1 & Monster Hunter 2 = Monster Hunter

		return collab;
	}
}
