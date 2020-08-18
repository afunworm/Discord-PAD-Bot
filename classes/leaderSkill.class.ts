//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/leader_skill_info.py
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';

// Find all cards with ID
let SEARCH_FOR = 13;
// for (let i = 1; i <= 7804; i++) {
// 	let monster = new MonsterParser(i);
// 	let leaderSkillId = monster.getLeaderSkill().id;
// 	let skill = SKILL_DATA[leaderSkillId];
// 	let firstSkill = skill[6];
// 	let secondSkill = skill[7];

// 	let firstSkilLDetails = SKILL_DATA[firstSkill];
// 	if (!firstSkilLDetails) continue;
// 	let firstSkillType = firstSkilLDetails[2];

// 	if (firstSkillType === SEARCH_FOR) console.log(monster.getName());

// 	if (!secondSkill) continue;

// 	let secondSkillDetail = SKILL_DATA[secondSkill];
// 	let secondSkillType = secondSkillDetail[2];

// 	if (secondSkillType === SEARCH_FOR) console.log(monster.getName());
// }
// process.exit();

export class LeaderSkill {
	private id: number;
	private type: number;
	private params: number[];

	constructor(skillId: number) {
		//Assign id
		this.id = skillId;

		//[ 'Some name?', '', skillType, 0, 0, '', params1, params2, params3... ]
		let data = SKILL_DATA[this.id];
		this.type = data[2];

		//Map params
		let params = [];
		for (let i = 6; i < data.length; i++) {
			params.push(data[i]);
		}
		this.params = params;
	}

	private getMap() {
		return {
			11: 'LSAttrAtkBoost',
			12: 'LSBonusAttack',
			13: 'LSAutoheal',
			14: 'LSResolve',
			15: 'LSMovementTimeIncrease',
			16: 'LSDamageReduction',
			17: 'LSAttrDamageReduction',
			22: 'LSTypeAtkBoost',
			23: 'LSTypeHpBoost',
			24: 'LSTypeRcvBoost',
			26: 'LSStaticAtkBoost',
			28: 'LSAttrAtkRcvBoost',
			29: 'LSAllStatBoost',
			30: 'LSTwoTypeHpBoost',
			31: 'LSTwoTypeAtkBoost',
			33: 'LSTaikoDrum',
			36: 'LSTwoAttrDamageReduction',
			38: 'LSLowHpShield',
			39: 'LSLowHpAtkOrRcvBoost',
			40: 'LSTwoAttrAtkBoost',
			41: 'LSCounterattack',
			43: 'LSHighHpShield',
			44: 'LSHighHpAtkBoost',
			45: 'LSAttrAtkHpBoost',
			46: 'LSTwoAttrHpBoost',
			48: 'LSAttrHpBoost',
			49: 'LSAttrRcvBoost',
			//DINO IS ABOVE
			53: 'LSEggDropRateBoost',
			54: 'LSCoinDropBoost',
			61: 'LSRainbow',
			62: 'LSTypeHpAtkBoost',
			63: 'LSTypeHpRcvBoost',
			64: 'LSTypeAtkRcvBoost',
			65: 'LSTypeAllStatBoost',
			66: 'LSComboFlatMultiplier',
			67: 'LSAttrHpRcvBoost',
			69: 'LSAttrTypeAtkBoost',
			73: 'LSAttrTypeHpAtkBoost',
			75: 'LSAttrTypeAtkRcvBoost',
			76: 'LSAttrTypeAllStatBoost',
			77: 'LSTwoTypeHpAtkBoost',
			79: 'LSTwoTypeAtkRcvBoost',
			94: 'LSLowHpConditionalAttrAtkBoost',
			95: 'LSLowHpConditionalTypeAtkBoost',
			96: 'LSHighHpConditionalAttrAtkBoost',
			97: 'LSHighHpConditionalTypeAtkBoost',
			98: 'LSComboScaledMultiplier',
			100: 'LSSkillActivationAtkRcvBoost',
			101: 'LSAtkBoostWithExactCombos',
			103: 'LSComboFlatAtkRcvBoost',
			104: 'LSComboFlatMultiplierAttrAtkBoost',
			105: 'LSReducedRcvAtkBoost',
			106: 'LSReducedHpAtkBoost',
			107: 'LSHpReduction',
			108: 'LSReducedHpTypeAtkBoost',
			109: 'LSBlobFlatAtkBoost',
			111: 'LSTwoAttrHpAtkBoost',
			114: 'LSTwoAttrAllStatBoost',
			119: 'LSBlobScalingAtkBoost',
			121: 'LSAttrOrTypeStatBoost',
			122: 'LSLowHpConditionalAttrTypeAtkRcvBoost',
			123: 'LSHighHpConditionalAttrTypeAtkRcvBoost',
			124: 'LSAttrComboScalingAtkBoost',
			125: 'LSTeamUnitConditionalStatBoost',
			129: 'LSMultiAttrTypeStatBoost',
			130: 'LSLowHpAttrAtkStatBoost',
			131: 'LSHighHpAttrTypeStatBoost',
			133: 'LSSkillUsedAttrTypeAtkRcvBoost',
			136: 'LSMultiAttrConditionalStatBoost',
			137: 'LSMultiTypeConditionalStatBoost',
			138: 'LSMultiPartSkill',
			139: 'LSHpMultiConditionalAtkBoost',
			148: 'LSRankXpBoost',
			149: 'LSHealMatchRcvBoost',
			150: 'LSEnhanceOrbMatch5',
			151: 'LSHeartCross',
			155: 'LSMultiboost',
			157: 'LSAttrCross',
			158: 'LSMatchXOrMoreOrbs',
			159: 'LSAdvancedBlobMatch',
			162: 'LSSevenBySix',
			163: 'LSNoSkyfallBoost',
			164: 'LSAttrComboConditionalAtkRcvBoost',
			165: 'LSRainbowAtkRcv',
			166: 'LSAtkRcvComboScale',
			167: 'LSBlobAtkRcvBoost',
			169: 'LSComboMultPlusShield',
			170: 'LSRainbowMultPlusShield',
			171: 'LSMatchAttrPlusShield',
			175: 'LSCollabConditionalBoost',
			177: 'LSOrbRemainingMultiplier',
			178: 'LSFixedMovementTime',
			182: 'LSRowMatcHPlusDamageReduction',
			183: 'LSDualThresholdBoost',
			185: 'LSBonusTimeStatBoost',
			186: 'LSSevenBySixStatBoost',
			192: 'LSBlobMatchBonusCombo',
			193: 'LSLMatchBoost',
			194: 'LSAttrMatchBonusCombo',
			197: 'LSDisablePoisonEffects',
			198: 'LSHealMatchBoostUnbind',
			199: 'LSRainbowBonusDamage',
			200: 'LSBlobBonusDamage',
			201: 'LSColorComboBonusDamage',
			203: 'LSGroupConditionalBoost',
			206: 'LSColorComboBonusCombo',
		};
	}

	public getDetailDescription(): string {
		let map = this.getMap();
		return '';
	}

	private mult(stat: number): number {
		return stat / 100;
	}

	private mergeDefaults(providedData: number[], defaultData: number[]) {
		let result = [];

		providedData.forEach((item) => {
			result.push(item);
		});

		if (defaultData[providedData.length] === undefined) return result;

		for (let i = providedData.length; i < defaultData.length; i++) {
			result.push(defaultData[i]);
		}

		return result;
	}

	public testOutput(): string {
		let functionToCall = this.getMap()[this.type];
		return this[functionToCall].call(this);
	}

	public LSAttrAtkBoost(): string {
		let attribute = MONSTER_ATTRIBUTES[this.params[0]];
		let ATKMultiplier = this.mult(this.params[1]);
		return `${attribute} attribute cards ATK x${ATKMultiplier}.`;
	}

	public LSBonusAttack(): string {
		let multiplier = this.mult(this.params[0]);
		return `Deal ATK x${multiplier} damage to all enemies after every orbs elimination. Ignores enemy element, but can be reduced by enemy defense down to 0 damage.`;
	}

	public LSAutoheal(): string {
		let data = this.mergeDefaults(this.params, [0]);
		let multiplier = this.mult(data[0]);
		return `Heal RCV x${multiplier} as HP after every orbs elimination.`;
	}

	public LSResolve(): string {
		return ``;
	}

	public LSMovementTimeIncrease(): string {
		return ``;
	}

	public LSDamageReduction(): string {
		let data = this.mergeDefaults(this.params, [0]);
		let shield = data[0];

		return `While your HP is ${shield}% or above, a single hit that normally kills you will instead leave you with 1 HP. For the consecutive hits, this skill will only affect the first hit.`;
	}
}

const MONSTER_ID = 2519;
let monster = new MonsterParser(MONSTER_ID);
let leaderSkillId = monster.getLeaderSkill().id;
let result;

try {
	let skillId = SKILL_DATA[leaderSkillId][6];
	let ls = new LeaderSkill(skillId);
	result = ls.testOutput();
} catch (error) {
	let skillId = SKILL_DATA[leaderSkillId][7];
	let ls = new LeaderSkill(skillId);
	result = ls.testOutput();
}

console.log(result);
