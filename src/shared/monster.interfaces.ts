import * as admin from 'firebase-admin';

export interface ActiveSkillData {
	id: number;
	name: string;
	description: string;
	descriptionDetails: string[];
	cooldown: number;
	maxSkillLevel: number;
	cooldownAtMaxLevel: number;
	types: number[];
}
export interface LeaderSkillData {
	id: number;
	name: string;
	description: string;
	descriptionDetails: string[];
	maxMultipliers: number[];
	types: number[];
}
export interface EnemyData {
	turnTimer: number;
	minHP: number;
	maxHP: number;
	minATK: number;
	maxATK: number;
	minDEF: number;
	maxDEF: number;
	coinDropped: number;
	expDropped: number;
}
export interface MonsterData {
	_lastUpdatedAt: admin.firestore.Timestamp | Date | admin.firestore.FieldValue;
	id: number;
	name: string;
	mainAttribute: number;
	mainAttributeReadable: string;
	subAttribute: number;
	subAttributeReadable: string;
	isEvoReversible: boolean;
	isInheritable: boolean;
	isExtraSlottable: boolean;
	isLimitBreakable: boolean;
	types: number[];
	typesReadable: string[];
	rarity: number;
	cost: number;
	collab: number;
	collabReadable: string;
	series: string | null;
	seriesReadable: string | null;
	evolutionType: string;
	evolutionTypeReadable: string;
	group: string | null;
	maxLevel: number;
	feedExp: number;
	sellPrice: number;
	minHP: number;
	maxHP: number;
	minATK: number;
	maxATK: number;
	minRCV: number;
	maxRCV: number;
	limitBreakHP: number | null;
	limitBreakATK: number | null;
	limitBreakRCV: number | null;
	expCurve: number;
	activeSkill: ActiveSkillData;
	leaderSkill: LeaderSkillData;
	asEnemy: EnemyData;
	previousEvoId: number;
	evoMaterials: number[];
	devoMaterials: number[];
	awakenings: number[];
	awakeningsReadable: string[];
	superAwakenings: number[];
	superAwakeningsReadable: string[];
	monsterPoints: number;
	limitBreakPercentage: number;
	transformIntoId: number;
	evoTree?: number[];
	totalAwakeningsWithSA: {
		[name: number]: number;
	};
	totalAwakeningsWithoutSA: {
		[name: number]: number;
	};
	computedAwakeningsWithSA: {
		[name: number]: number;
	};
	computedAwakeningsWithoutSA: {
		[name: number]: number;
	};
}
