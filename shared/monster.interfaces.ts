export interface ActiveSkillData {
	id: number;
	name: string;
	description: string;
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
	_lastUpdatedAt: FirebaseFirestore.Timestamp | Date | FirebaseFirestore.FieldValue;
	id: number;
	name: string;
	mainAttribute: number;
	mainAttributeReadable: string;
	subAttribute: number;
	subAttributeReadable: string;
	isEvoReversible: boolean;
	isInheritable: boolean;
	isExtraSlottable: boolean;
	types: number[];
	typesReadable: string[];
	rarity: number;
	cost: number;
	maxLevel: number;
	feedExp: number;
	sellPrice: number;
	minHP: number;
	maxHP: number;
	minATK: number;
	maxATK: number;
	minRCV: number;
	maxRCV: number;
	expCurve: number;
	activeSkill: ActiveSkillData;
	leaderSkill: LeaderSkillData;
	asEnemy: EnemyData;
	previousEvoId: number;
	evoMaterial: number[];
	devoMaterial: number[];
	awakenings: number[];
	awakeningsReadable: string[];
	superAwakenings: number[];
	superAwakeningsReadable: string[];
	monsterPoints: number;
	limitBreakPercentage: number;
	transformIntoId: number;
}
