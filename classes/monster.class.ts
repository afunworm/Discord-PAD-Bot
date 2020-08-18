const { card: CARD_DATA } = require('../download_card_data.json');
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { AWAKEN_EMOTES } from '../shared/monster.awakens';
import { MONSTER_TYPES } from '../shared/monster.types';

console.log(SKILL_DATA[CARD_DATA[2][26]]);
console.log(SKILL_DATA[8264]);
console.log(SKILL_DATA[8274]);

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
		let skillCount = data[57]; // number of skills to push
		let iter = 58;
		for (let i = 0; i < skillCount * 3; i++) {
			// each skill is a triple or something
			this.enemySkills.push(data[iter]);
			iter++;
		}

		this.awakenings = [];
		let awakeningCount = data[iter]; // number of awakenings to push
		iter++;
		for (let i = 0; i < awakeningCount; i++) {
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

		this.latentKillers = this.getLatentKillers();

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

	private awakenEmotesMapping(awakenList): string {
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

	public getAwakenEmotes(): string {
		return this.awakenEmotesMapping(this.awakenings);
	}

	public getSuperAwakenEmotes(): string {
		return this.awakenEmotesMapping(this.superAwakenings);
	}

	public getGenericInfo(): string {
		let info = '';

		info += `${this.mapTypes(this.types).join('/')}\n`;
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
		// Regex to remove color formatting text - https://regex101.com/r/pMMKCH/1
		return SKILL_DATA[this.leaderSkillId][1].replace(/\^[0-9a-f]{6}\^([^^]+)\^\w+/g, '$1');
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
		let monsterTypes = this.types;

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

	public getAvailableKillers() {
		return this.mapTypes(this.latentKillers).join(' ');
	}

	private fixCardNoLength(no: number | string): string {
		switch (no.toString().length) {
			case 1:
				return '0000' + no;
			case 2:
				return '000' + no;
			case 3:
				return '00' + no;
			case 4:
				return '0' + no;
			default:
				return no.toString();
		}
	}

	getThumbnailUrl() {
		let cardId = this.id.toString();
		cardId = this.fixCardNoLength(cardId);
		return `http://puzzledragonx.com/en/img/book/${this.id}.png`;

		//The following needs to be fixed
		return `https://static.pad.byh.uy/icons/${cardId}.png`;
	}

	getImageUrl() {
		let cardId = this.id.toString();
		cardId = this.fixCardNoLength(cardId);
		return `https://static.pad.byh.uy/images/${cardId}.png`;
	}

	getUrl() {
		return `http://puzzledragonx.com/en/monster.asp?n=${this.id}`;
	}

	getDebugData(type: 'raw' | 'active' | number = 'raw') {
		let data = CARD_DATA[this.id];
		if (type === 'raw') {
			let result = {};
			for (let i = 0; i < data.length; i++) {
				result[i] = data[i];
			}
			return result;
		} else if (type === 'active') {
			return SKILL_DATA[this.activeSkillId];
		} else {
			return data[type];
		}
	}
}
