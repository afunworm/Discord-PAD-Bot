const { card: CARD_DATA } = require('../download_card_data.json');
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MONSTER_ATTRIBUTES } from './monster.attributes';
import { AWAKEN_EMOTES, AWAKENS } from './monster.awakens';
import { MONSTER_TYPES } from './monster.types';

export class Monster {
	private enemyHpCurve;
	private id: number;
	private name: string;
	private aliases: number[];
	private attribute: number;
	private subattribute: number;
	private isEvoReversable: number;
	private types: number[];
	private starCount: number;
	private cost: number;
	private maxLevel: number;
	private feedExpPerLevel: number;
	private sellPricePerLevel: number;
	private minHp: number;
	private maxHp: number;
	private HpGrowthExponent: number;
	private minAtk: number;
	private maxAtk: number;
	private AtkGrowthExponent: number;
	private minRcv: number;
	private maxRcv: number;
	private RcvGrowthExponent: number;
	private expCurve: number;
	private expExponent: number;
	private activeSkillId: number;
	private leaderSkillId: number;
	private turnTimer: number;
	private evoFromId: number;
	private evoMaterials: number[];
	private devoMaterials: number[];
	private enemySkills: number[];
	private awakenings: number[];
	private superAwakenings: string;
	private evoTreeBaseId: number;
	private gkey: number;
	private monsterPoints: number;
	private latents: number;
	private collab: number;
	private latentKillers: number[];
	private inheritanceType: number;
	private isInheritable: boolean;
	private extraSlottable: boolean;
	private japaneseName: number;
	private limitBreakStatGain: number;
	private isLimitBreakable: boolean;
	private exchangesTo: number[];
	private exchangesFrom: number[];
	private voiceId: number;
	private orbSkin: number;
	private charges: number;
	private chargeGain: number;
	private enemyHpAtLv1: number;
	private enemyHpAtLv10: number;
	private enemyAtkAtLv1: number;
	private enemyAtkAtLv10: number;
	private enemyDefAtLv1: number;
	private enemyDefAtLv10: number;
	private enemyDefCurve: number;
	private maxEnemyLevel: number;
	private enemyCoinsAtLv2: number;
	private enemyExpAtLv2: number;
	private groups: number[];
	private alternateVersions: number[];
	private isAlt: boolean;
	private enemyAtkCurve: number;

	constructor(id: number) {
		if (!Number.isInteger(id)) return;

		if (id > CARD_DATA.length || id < 1) {
			return;
		}

		let data = CARD_DATA[id];

		this.id = data[0];
		this.name = data[1];
		this.aliases = [];
		this.attribute = data[2];
		this.subattribute = data[3];
		this.isEvoReversable = data[4];
		this.types = [data[5], data[6]]; // come back to this for type 3
		this.starCount = data[7]; // rarity
		this.cost = data[8];
		//this.evoType = EvolutionType.Normal; // idk about this
		this.maxLevel = data[10];
		this.feedExpPerLevel = data[11] / 4;
		this.sellPricePerLevel = data[13] / 10; // ?
		this.minHp = data[14];
		this.maxHp = data[15];
		this.HpGrowthExponent = data[16]; // ?
		this.minAtk = data[17];
		this.maxAtk = data[18];
		this.AtkGrowthExponent = data[19]; // ?
		this.minRcv = data[20];
		this.maxRcv = data[21];
		this.RcvGrowthExponent = data[22]; // ?
		this.expCurve = data[23];
		this.expExponent = data[24]; // ?
		this.activeSkillId = data[25];
		this.leaderSkillId = data[26];
		this.turnTimer = data[27];
		// 28 through 39 seem to be enemy data
		this.evoFromId = data[40];
		this.evoMaterials = [data[41], data[42], data[43], data[44], data[45]]; // list of evo mats to get this
		this.devoMaterials = [data[46], data[47], data[48], data[49], data[50]]; // list of evo mats to unult

		this.enemySkills = [];
		var skillCount = data[57]; // number of skills to push
		var iter = 58;
		for (var i = 0; i < skillCount * 3; i++) {
			// each skill is a triple or something
			this.enemySkills.push(data[iter]);
			iter++;
		}

		this.awakenings = [];
		var awakeningCount = data[iter]; // number of awakenings to push
		iter++;
		for (var i = 0; i < awakeningCount; i++) {
			this.awakenings.push(data[iter]);
			iter++;
		}

		this.superAwakenings = data[iter].split(',');
		this.evoTreeBaseId = data[iter + 1];

		this.gkey = data[iter + 2]; // grouping key thing?

		this.types.push(data[iter + 3]); // hopefully this is right

		this.monsterPoints = data[iter + 4];

		this.latents = data[iter + 5]; // Says what latent it gives when fed. Non latent tamas should give no latents when fed, and have value 0.
		this.collab = data[iter + 6];

		this.latentKillers = []; // idk

		this.inheritanceType = data[iter + 7];
		this.isInheritable = (this.inheritanceType & 1) == 1; // idk, this tells us Supergirl is inheritable so I assume we're good
		this.extraSlottable = (this.inheritanceType & 32) == 32; // this tells us Supergirl can't take 8latents so I assume we're good

		this.japaneseName = data[iter + 8]; // getting blank value on Supergirl

		this.limitBreakStatGain = data[iter + 9]; // this lines up with Supergirl
		this.isLimitBreakable = this.limitBreakStatGain > 0;

		this.isAlt = false;
		this.alternateVersions = [];
		this.exchangesTo = [];
		this.exchangesFrom = [];
		this.voiceId = 0;
		this.orbSkin = 0;
		this.charges = 0;
		this.chargeGain = 0;
		this.enemyHpAtLv1 = 0;
		this.enemyHpAtLv10 = 0;
		this.enemyHpCurve = 0;
		this.enemyAtkAtLv1 = 0;
		this.enemyAtkAtLv10 = 0;
		this.enemyAtkCurve = 0;
		this.enemyDefAtLv1 = 0;
		this.enemyDefAtLv10 = 0;
		this.enemyDefCurve = 0;
		this.maxEnemyLevel = 0;
		this.enemyCoinsAtLv2 = 0;
		this.enemyExpAtLv2 = 0;
		this.groups = []; // hmmm
	}

	static getDatabaseLength(): number {
		return CARD_DATA.length;
	}

	public getId(): number {
		return this.id;
	}

	public getName(): string {
		return this.name;
	}

	private mapAttribute(attributeId: string | number): string {
		return MONSTER_ATTRIBUTES[attributeId];
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

	private awakenEmotesMapping(awakenList) {
		let result = '';
		for (let i = 0; i < awakenList.length; i++) {
			if (awakenList[i] === '') {
				return 'No Awakenings';
			}
			let temp = AWAKEN_EMOTES[awakenList[i]];
			if (temp != 'None') {
				result += ' ' + temp;
			}
		}

		return result ? result : 'No Awakenings';
	}

	public getAwakenEmotes() {
		return this.awakenEmotesMapping(this.awakenings);
	}

	public getSuperAwakenEmotes() {
		return this.awakenEmotesMapping(this.superAwakenings);
	}

	public getGenericInfo(): string {
		let info = '';
		info += `${this.mapTypes(this.types)}\n`;
		info += `Rarity: ${this.starCount}\n`;
		info += `Cost: ${this.cost}\n`;
		info += `MP: ${this.monsterPoints}\n`;
		info += `Inheritable: ${this.isInheritable}`;

		return info;
	}

	public getStats(): string {
		let stats = '';

		if (!this.isLimitBreakable) {
			stats += `HP: ${this.maxHp}\n`;
			stats += `ATK: ${this.maxAtk}\n`;
			stats += `RCV: ${this.maxRcv}`;
			return stats;
		}

		stats += `HP: ${this.maxHp} (${Math.round(this.maxHp * (1 + this.limitBreakStatGain / 100))})\n`;
		stats += `ATK: ${this.maxAtk} (${Math.round(this.maxAtk * (1 + this.limitBreakStatGain / 100))})\n`;
		stats += `RCV: ${this.maxRcv} (${Math.round(this.maxRcv * (1 + this.limitBreakStatGain / 100))})`;

		return stats;
	}

	public getActiveSkillHeader(): string {
		if (this.activeSkillId === 0) {
			return 'Active Skill';
		}
		return `Active Skill (${SKILL_DATA[this.activeSkillId][4]} -> ${
			SKILL_DATA[this.activeSkillId][4] - SKILL_DATA[this.activeSkillId][3] + 1
		})`;
	}

	public getActiveSkillBody() {
		if (this.activeSkillId === 0) {
			return 'None';
		}
		return SKILL_DATA[this.activeSkillId][1];
	}

	public getLeaderSkill() {
		if (this.leaderSkillId === 0) {
			return 'None';
		}
		return SKILL_DATA[this.leaderSkillId][1];
	}

	public getAvailableKillers() {
		return `(function in development)`;
	}
}
