//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/leader_skill_info.py
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { LEADERSKILL_MAP } from './leaderSkill.map';
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { MONSTER_TYPES } from '../shared/monster.types';

//@TODO - Check on evo, enhanced, etc. because they have some interesting and overlapping skill types

export class LeaderSkill {
	private id: number;
	private type: number;
	private params: number[];

	constructor(skillData: any[]) {
		//[ 'Some name?', '', skillType, 0, 0, '', params1, params2, params3... ]
		// let data = SKILL_DATA[this.id];
		this.type = skillData[2];

		//Map params
		let params = [];
		for (let i = 6; i < skillData.length; i++) {
			params.push(skillData[i]);
		}
		this.params = params;
	}

	public getDetailDescription(): string {
		let map = LEADERSKILL_MAP;
		return '';
	}

	private getRawSkillData(): any[] {
		return SKILL_DATA[this.id];
	}

	private mult(stat: number): number {
		return stat / 100;
	}

	private mergeDefaults(defaultData: number[]) {
		let result = [];
		let providedData = this.params;

		providedData.forEach((item) => {
			result.push(item);
		});

		if (defaultData[providedData.length] === undefined) return result;

		for (let i = providedData.length; i < defaultData.length; i++) {
			result.push(defaultData[i]);
		}

		return result;
	}

	private mapAttribute(attributeId: number): string {
		return MONSTER_ATTRIBUTES[attributeId];
	}

	private mapType(typeId: number): string {
		return MONSTER_TYPES[typeId];
	}

	private ATKFromSlice(): number {
		return this.params[1] === 1 ? this.params[3] / 100 : 1;
	}

	private RCVFromSlice(): number {
		return this.params[1] === 2 ? this.params[3] / 100 : 1;
	}

	private stringifyBoost(HPBoost: number = 1, ATKBoost: number = 1, RCVBoost: number = 1): string {
		let boost = [];

		if (HPBoost !== 1) boost.push(`HP x${HPBoost}`);
		if (ATKBoost !== 1) boost.push(`ATK x${ATKBoost}`);
		if (RCVBoost !== 1) boost.push(`RCV x${RCVBoost}`);

		return boost.length > 1 ? boost.join(', ') : boost[0];
	}

	private decimalToBinary = (dec) => (dec >>> 0).toString(2);

	private getAttributesFromBinary(dec: number): number[] {
		let binary = this.decimalToBinary(dec).padStart(5, '0');
		let result = [];

		//Refer to monster attribute maps to map properly
		//The binary will be {dark}{light}{wood}{water}{fire}
		if (binary[0] === '1') result.push(4); //Dark
		if (binary[1] === '1') result.push(3); //Light
		if (binary[2] === '1') result.push(2); //Wood
		if (binary[3] === '1') result.push(1); //Water
		if (binary[4] === '1') result.push(0); //Fire

		return result;
	}

	private toAttributeString(attributes: number[]): string {
		if (attributes.length === 0) return '';

		let attributesArray = attributes.map((attribute) => MONSTER_ATTRIBUTES[attribute]);
		return attributesArray.length > 1 ? attributesArray.join(', ') : attributesArray[0];
	}

	public testOutput(): string {
		let functionToCall = LEADERSKILL_MAP[this.type];
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : null;
	}

	public LSAttrAtkBoost(): string {
		let attribute = this.mapAttribute(this.params[0]);
		let ATKMultiplier = this.mult(this.params[1]);
		return `${attribute} attribute cards ATK x${ATKMultiplier}.`;
	}

	public LSBonusAttack(): string {
		let multiplier = this.mult(this.params[0]);
		return `Deal ATK x${multiplier} damage to all enemies after every orbs elimination. Ignores enemy element, but can be reduced by enemy defense down to 0 damage.`;
	}

	public LSAutoheal(): string {
		let data = this.mergeDefaults([0]);
		let multiplier = this.mult(data[0]);
		return `Heal RCV x${multiplier} as HP after every orbs elimination.`;
	}

	public LSResolve(): string {
		let data = this.mergeDefaults([0]);
		let threshold = data[0];
		return `While your HP is ${threshold}% or above, a single hit that normally kills you will instead leave you with 1 HP. For the consecutive hits, this skill will only affect the first hit.`;
	}

	public LSMovementTimeIncrease(): string {
		let data = this.mergeDefaults([0]);
		let extra = this.mult(data[0]);
		return `Increases time limit of orb movement by ${extra} seconds.`;
	}

	public LSDamageReduction(): string {
		let data = this.mergeDefaults([0]);
		let shield = data[0];
		return `While your HP is ${shield}% or above, a single hit that normally kills you will instead leave you with 1 HP. For the consecutive hits, this skill will only affect the first hit.`;
	}

	public LSAttrDamageReduction(): string {
		let data = this.mergeDefaults([0, 0]);
		let attribute = this.mapAttribute(data[0]);
		let shield = data[1];
		return `${shield}% ${attribute} damage reduction.`;
	}

	public LSTypeAtkBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		return `${type} type cards ATK x${ATKMultiplier}.`;
	}

	public LSTypeHpBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		return `${type} type cards HP x${HPMultiplier}.`;
	}

	public LSTypeRcvBoost() {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let RCVMultiplier = this.mult(data[1]);
		return `${type} type cards RCV x${RCVMultiplier}.`;
	}

	public LSStaticAtkBoost(): string {
		//CANNOT TEST BECAUSE CANNOT FIND ANY MONSTER ON PADX
		let data = this.mergeDefaults([100]);
		let ATKMultiplier = this.mult(data[0]);
		return `${ATKMultiplier}x ATK of all allies`;
	}

	public LSAttrAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);
		return `${attribute} attribute cards ATK x${boost}, RCV x${boost}.`;
	}

	public LSAllStatBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);
		return `${attribute} attribute cards HP x${boost}, ATK x${boost}, RCV x${boost}.`;
	}

	public LSTwoTypeHpBoost(): string {
		let data = this.mergeDefaults([0, 0, 100]);
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let boost = this.mult(data[2]);
		return `${firstType} & ${secondType} type cards HP x${boost}.`;
	}

	public LSTwoTypeAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 100]);
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let boost = this.mult(data[2]);
		return `${firstType} & ${secondType} type cards ATK x${boost}.`;
	}

	public LSTaikoDrum(): string {
		return `Turn orb sound effects into Taiko noises.`;
	}

	public LSTwoAttrDamageReduction(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let shield = data[2];
		return `${shield}% ${firstAttribute} & ${secondAttribute} damage reduction.`;
	}

	public LSLowHpShield(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let threshold = data[0];
		//This really only triggers for one specific odin, which seems to have this behavior hard-coded somehow
		let above = threshold === 1 ? true : false;
		let shield = data[2];
		return `${shield}% all damage reduction when HP is ${above ? 'more' : 'less'} than ${threshold}%.`;
	}

	public LSLowHpAtkOrRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let threshold = data[0];
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKBoost, RCVBoost);

		return `All attribute cards ${boost} when HP is less than ${threshold}%.`;
	}

	public LSTwoAttrAtkBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let boost = this.mult(data[2]);
		return `${firstAttribute} & ${secondAttribute} attribute cards ATK x${boost}.`;
	}

	public LSCounterattack(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let chance = data[0];
		let boost = this.mult(data[1]);
		let attribute = this.mapAttribute(data[2]);
		return `${chance}% chance to deal counter ${attribute} damage of ${boost}x damage taken.`;
	}

	public LSHighHpShield(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let threshold = data[0];
		let chance = data[1];
		let shield = data[2];
		return `${chance}% chance to have ${shield}% all damage reduction when HP is ${
			threshold === 100 ? 'full' : `${threshold}% or more`
		}.`;
	}

	public LSHighHpAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKBoost, RCVBoost);

		return `All attribute cards ${boost} when HP is ${threshold === 100 ? 'full' : `${threshold}% or more`}.`;
	}

	public LSAttrAtkHpBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);

		return `${attribute} attribute cards HP x${boost}, ATK x${boost}.`;
	}

	public LSTwoAttrHpBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let boost = this.mult(data[2]);

		return `${firstAttribute} & ${secondAttribute} attribute cards HP x${boost}.`;
	}

	public LSAttrHpBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);

		return `${attribute} attribute cards HP x${boost}.`;
	}

	public LSAttrRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);

		return `${attribute} attribute cards RCV x${boost}.`;
	}

	public LSEggDropRateBoost(): string {
		let data = this.params;
		let multiplier = this.mult(data[0]);
		return `Increase egg drop rate by ${multiplier}x (excluding Multiplayer Mode).`;
	}

	public LSCoinDropBoost(): string {
		let data = this.params;
		let multiplier = this.mult(data[0]);

		return `Get x${multiplier} coins after a battle.`;
	}

	public LSRainbow(): string {
		let data = this.mergeDefaults([0, 0, 100, 0, 0]);
		let requiredAttributes = this.getAttributesFromBinary(data[0]);
		let minAttributesRequired = data[1];
		let maxAttributesRequired = data[4] || requiredAttributes.length;
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let requiredAttributeString = this.toAttributeString(requiredAttributes);

		if (ATKStep === 0) {
			maxAttributesRequired = minAttributesRequired;
		} else if (maxAttributesRequired < minAttributesRequired) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		} else if (maxAttributesRequired + minAttributesRequired <= requiredAttributes.length) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		}

		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxAttributesRequired - minAttributesRequired);

		if (minATKMultiplier === maxATKMultiplier) {
			return `All attribute cards ATK x${minATKMultiplier} when attacking with ${minAttributesRequired} of following orb types: ${requiredAttributeString}.`;
		} else {
			return `All attribute cards ATK x${minATKMultiplier} when attacking with ${minAttributesRequired} of following orb types: ${requiredAttributeString}. ATK x${ATKStep} for each additional orb type, up to ATK x${maxATKMultiplier} for all ${maxAttributesRequired} matches.`;
		}
	}
	// 62: 'LSTypeHpAtkBoost',
	// 63: 'LSTypeHpRcvBoost',
	// 64: 'LSTypeAtkRcvBoost',
	// 65: 'LSTypeAllStatBoost',
	// 66: 'LSComboFlatMultiplier',
	// 67: 'LSAttrHpRcvBoost',
	// 69: 'LSAttrTypeAtkBoost',
	// 73: 'LSAttrTypeHpAtkBoost',
	// 75: 'LSAttrTypeAtkRcvBoost',
	// 76: 'LSAttrTypeAllStatBoost',
	// 77: 'LSTwoTypeHpAtkBoost',
	// 79: 'LSTwoTypeAtkRcvBoost',
	// 94: 'LSLowHpConditionalAttrAtkBoost',
	// 95: 'LSLowHpConditionalTypeAtkBoost',
	// 96: 'LSHighHpConditionalAttrAtkBoost',
	// 97: 'LSHighHpConditionalTypeAtkBoost',
	// 98: 'LSComboScaledMultiplier',
	// 100: 'LSSkillActivationAtkRcvBoost',
	// 101: 'LSAtkBoostWithExactCombos',
	// 103: 'LSComboFlatAtkRcvBoost',
	// 104: 'LSComboFlatMultiplierAttrAtkBoost',
	// 105: 'LSReducedRcvAtkBoost',
	// 106: 'LSReducedHpAtkBoost',
	// 107: 'LSHpReduction',
	// 108: 'LSReducedHpTypeAtkBoost',
	// 109: 'LSBlobFlatAtkBoost',
	// 111: 'LSTwoAttrHpAtkBoost',
	// 114: 'LSTwoAttrAllStatBoost',
	// 119: 'LSBlobScalingAtkBoost',
	// 121: 'LSAttrOrTypeStatBoost',
	// 122: 'LSLowHpConditionalAttrTypeAtkRcvBoost',
	// 123: 'LSHighHpConditionalAttrTypeAtkRcvBoost',
	// 124: 'LSAttrComboScalingAtkBoost',
	// 125: 'LSTeamUnitConditionalStatBoost',
	// 129: 'LSMultiAttrTypeStatBoost',
	// 130: 'LSLowHpAttrAtkStatBoost',
	// 131: 'LSHighHpAttrTypeStatBoost',
	// 133: 'LSSkillUsedAttrTypeAtkRcvBoost',
	// 136: 'LSMultiAttrConditionalStatBoost',
	// 137: 'LSMultiTypeConditionalStatBoost',
	// 138: 'LSMultiPartSkill',
	// 139: 'LSHpMultiConditionalAtkBoost',
	// 148: 'LSRankXpBoost',
	// 149: 'LSHealMatchRcvBoost',
	// 150: 'LSEnhanceOrbMatch5',
	// 151: 'LSHeartCross',
	// 155: 'LSMultiboost',
	// 157: 'LSAttrCross',
	// 158: 'LSMatchXOrMoreOrbs',
	// 159: 'LSAdvancedBlobMatch',
	// 162: 'LSSevenBySix',
	// 163: 'LSNoSkyfallBoost',
	// 164: 'LSAttrComboConditionalAtkRcvBoost',
	// 165: 'LSRainbowAtkRcv',
	// 166: 'LSAtkRcvComboScale',
	// 167: 'LSBlobAtkRcvBoost',
	// 169: 'LSComboMultPlusShield',
	// 170: 'LSRainbowMultPlusShield',
	// 171: 'LSMatchAttrPlusShield',
	// 175: 'LSCollabConditionalBoost',
	// 177: 'LSOrbRemainingMultiplier',
	// 178: 'LSFixedMovementTime',
	// 182: 'LSRowMatcHPlusDamageReduction',
	// 183: 'LSDualThresholdBoost',
	// 185: 'LSBonusTimeStatBoost',
	// 186: 'LSSevenBySixStatBoost',
	// 192: 'LSBlobMatchBonusCombo',
	// 193: 'LSLMatchBoost',
	// 194: 'LSAttrMatchBonusCombo',
	// 197: 'LSDisablePoisonEffects',
	// 198: 'LSHealMatchBoostUnbind',
	// 199: 'LSRainbowBonusDamage',
	// 200: 'LSBlobBonusDamage',
	// 201: 'LSColorComboBonusDamage',
	// 203: 'LSGroupConditionalBoost',
	// 206: 'LSColorComboBonusCombo',
}
