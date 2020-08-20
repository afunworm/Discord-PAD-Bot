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
	private raw;

	constructor(skillData: any[]) {
		//Assign raw data
		this.raw = skillData;

		//[ 'Some name?', '', skillType, 0, 0, '', params1, params2, params3... ]
		this.type = skillData[2];

		//Map params
		let params = [];
		for (let i = 6; i < skillData.length; i++) {
			params.push(skillData[i]);
		}
		this.params = params;
	}

	public getDetailDescription(): string {
		let functionToCall = LEADERSKILL_MAP[this.type];
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : null;
	}

	private getRawSkillData(): any[] {
		return this.raw;
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

	private ATKFromSlice(padding: number = 0): number {
		return this.params[1 + padding] === 1 ? this.params[3 + padding] / 100 : 1;
	}

	private RCVFromSlice(padding: number = 0): number {
		return this.params[1 + padding] === 2 || this.params[2 + padding] === 2 ? this.params[3 + padding] / 100 : 1;
	}

	private stringifyBoost(
		HPBoost: number = 1,
		ATKBoost: number = 1,
		RCVBoost: number = 1,
		shield: number = 0
	): string {
		let boost = [];

		if (HPBoost !== 1) boost.push(`HP x${HPBoost}`);
		if (ATKBoost !== 1) boost.push(`ATK x${ATKBoost}`);
		if (RCVBoost !== 1) boost.push(`RCV x${RCVBoost}`);

		if (shield !== 0) boost.push(`reduce damage taken by ${shield}%`);

		if (boost.length === 0) return '';

		if (shield === 0) {
			return boost.length > 1 ? boost.join(', ') : boost[0];
		} else {
			return boost.length > 1 ? boost.join(', ') : boost[0];
		}
	}

	private stringifyHPCondition(threshold: number, isAbove: boolean = true, incudesEqual: boolean = true): string {
		if (threshold === 100) return 'full';

		if (incudesEqual) {
			return isAbove ? `${threshold}% or more` : `${threshold}% or less`;
		} else {
			return isAbove ? `more than ${threshold}%` : `less than ${threshold}%`;
		}
	}

	private decimalToBinary = (dec: number) => (dec >>> 0).toString(2);

	private getAttributesFromBinary(dec: number): number[] {
		let binary = this.decimalToBinary(dec).padStart(9, '0');
		let result = [];

		//Refer to monster attribute maps to map properly
		//The binary will be {MORTAL POISON}{POISON}{JAMMER}{HEART}{DARK}{LIGHT}{WOOD}{WATER}{FIRE}
		if (binary[0] === '1') result.push(8); //Mortal Poison
		if (binary[1] === '1') result.push(7); //Poison
		if (binary[2] === '1') result.push(6); //Jammer
		if (binary[3] === '1') result.push(5); //Heart
		if (binary[4] === '1') result.push(4); //Dark
		if (binary[5] === '1') result.push(3); //Light
		if (binary[6] === '1') result.push(2); //Wood
		if (binary[7] === '1') result.push(1); //Water
		if (binary[8] === '1') result.push(0); //Fire

		return result;
	}

	private getAttributesFromMultipleBinary(decs: number[]): number[] {
		let result = [];

		decs.forEach((dec) => {
			let attributes = this.getAttributesFromBinary(dec);
			attributes.forEach((attribute) => {
				result.push(attribute);
			});
		});

		return result;
	}

	private toAttributeString(attributes: number[], connector: string = '&'): string {
		if (attributes.length === 0) return '';

		let attributesArray: any[] = attributes.sort((a, b) => a - b); //Sort it
		attributesArray = attributesArray.map((attribute) => MONSTER_ATTRIBUTES[attribute]);

		return attributesArray.length > 1
			? attributesArray.join(', ').replace(/,([^,]*)$/, ` ${connector}$1`)
			: attributesArray[0];
	}

	private getTypesFromBinary(dec: number): number[] {
		let binary = this.decimalToBinary(dec).padStart(15, '0');
		let result = [];

		//Refer to monster type maps to map properly
		//The binary will be {REDEEMABLE}{ENHANCE}0{AWAKEN}00{MACHINE}{DEVIL}{ATTACKER}{GOD}{DRAGON}{HEALER}{PHYSICAL}{BALANCED}{EVO}
		if (binary[0] === '1') result.push(15); //Redeemable
		if (binary[1] === '1') result.push(14); //Enhance
		if (binary[3] === '1') result.push(12); //Awaken
		if (binary[6] === '1') result.push(8); //Machine
		if (binary[7] === '1') result.push(7); //Devil
		if (binary[8] === '1') result.push(6); //Attacker
		if (binary[9] === '1') result.push(5); //God
		if (binary[10] === '1') result.push(4); //Dragon
		if (binary[11] === '1') result.push(3); //Healer
		if (binary[12] === '1') result.push(2); //Physical
		if (binary[13] === '1') result.push(1); //Balanced
		if (binary[14] === '1') result.push(0); //Evo

		return result;
	}

	private toTypeString(types: number[], connector: string = '&'): string {
		if (types.length === 0) return '';

		let typeArray: any[] = types.sort((a, b) => a - b); //Sort it
		typeArray = typeArray.map((type) => MONSTER_TYPES[type]);

		return typeArray.length > 1 ? typeArray.join(', ').replace(/,([^,]*)$/, ` ${connector}$1`) : typeArray[0];
	}

	private multiFloor(stat: number) {
		return stat !== 0 ? stat / 100 : 1;
	}

	private listConcat(list: number[]) {
		return list.filter((id) => id > 0);
	}

	private numberWithCommas = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	public testOutput(): string {
		let functionToCall = LEADERSKILL_MAP[this.type];
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : null;
	}

	public LSAttrAtkBoost(): string {
		let attribute = this.mapAttribute(this.params[0]);
		let ATKMultiplier = this.mult(this.params[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${attribute} attribute cards ${boost}.`;
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
		let boost = this.stringifyBoost(1, 1, 1, shield);

		return `${boost}.`;
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
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeHpBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeRcvBoost() {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let RCVMultiplier = this.mult(data[1]);
		return `${type} Type cards RCV x${RCVMultiplier}.`;
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
		return `${firstType} & ${secondType} Type cards HP x${boost}.`;
	}

	public LSTwoTypeAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 100]);
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let boost = this.mult(data[2]);
		return `${firstType} & ${secondType} Type cards ATK x${boost}.`;
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

		if (chance === 100) {
			return `Deal counter ${attribute} damage of ${boost}x damage taken.`;
		} else {
			return `${chance}% chance to deal counter ${attribute} damage of ${boost}x damage taken.`;
		}
	}

	public LSHighHpShield(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let threshold = data[0];
		let chance = data[1];
		let shield = data[2];
		return `${chance}% chance to have ${shield}% all damage reduction when HP is ${this.stringifyHPCondition(
			threshold
		)}.`;
	}

	public LSHighHpAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKBoost, RCVBoost);

		return `All attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
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

	//Untested from this point onwards

	public LSTypeHpAtkBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let boost = this.mult(data[1]);

		return `${type} Type cards HP x${boost}, ATK x${boost}.`;
	}

	public LSTypeHpRcvBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let boost = this.mult(data[1]);

		return `${type} Type cards HP x${boost}, RCV x${boost}.`;
	}

	public LSTypeAtkRcvBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let boost = this.mult(data[1]);

		return `${type} Type cards ATK x${boost}, RCV x${boost}.`;
	}

	public LSTypeAllStatBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let boost = this.mult(data[1]);

		return `${type} Type cards HP x${boost}, ATK x${boost}, RCV x${boost}.`;
	}

	public LSComboFlatMultiplier(): string {
		let data = this.mergeDefaults([0, 100]);
		let combosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);

		return `All attribute cards ATK x${minATKMultiplier} when reaching ${combosRequired} combos or above.`;
	}

	public LSAttrHpRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let boost = this.mult(data[1]);

		return `${attribute} attribute cards HP x${boost}, RCV x${boost}.`;
	}

	public LSAttrTypeAtkBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${attribute} attribute & ${type} Type cards ATK x${boost}.`;
	}

	public LSAttrTypeHpAtkBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${attribute} attribute & ${type} Type cards HP x${boost}, ATK x${boost}.`;
	}

	public LSAttrTypeAtkRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${attribute} attribute & ${type} Type cards ATK x${boost}, RCV x${boost}.`;
	}

	public LSAttrTypeAllStatBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${attribute} attribute & ${type} Type cards HP x${boost}, ATK x${boost}, RCV x${boost}.`;
	}

	public LSTwoTypeHpAtkBoost(): string {
		let data = this.params;
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${firstType} & ${secondType} Type cards HP x${boost}, ATK x${boost}.`;
	}

	public LSTwoTypeAtkRcvBoost(): string {
		let data = this.params;
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let boost = this.mult(data[2]);

		return `${firstType} & ${secondType} Type cards ATK x${boost}, RCV x${boost}.`;
	}

	public LSLowHpConditionalAttrAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attribute = this.mapAttribute(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);
		let RCVMultiplier = this.RCVFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${attribute} attribute cards ${boost} when HP is less than ${threshold}%.`;
	}

	public LSLowHpConditionalTypeAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let type = this.mapType(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);

		return `${type} Type cards ATK x${ATKMultiplier} when HP ${this.stringifyHPCondition(threshold, false)}.`;
	}

	public LSHighHpConditionalAttrAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attribute = this.mapAttribute(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);

		return `${attribute} attribute cards ATK x${ATKMultiplier} when HP is ${this.stringifyHPCondition(threshold)}.`;
	}

	public LSHighHpConditionalTypeAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let type = this.mapType(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);

		return `${type} Type cards ATK x${ATKMultiplier} when HP is ${this.stringifyHPCondition(threshold)}.`;
	}

	public LSComboScaledMultiplier(): string {
		let data = this.mergeDefaults([0, 100, 0, 0]);
		let minCombosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);
		let ATKStep = this.mult(data[2]);
		let maxCombosRequired = data[3] || minCombosRequired;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCombosRequired - minCombosRequired);

		if (ATKStep) {
			return `ATK x${minATKMultiplier} at ${minCombosRequired} combos. ATK multiplier increases by ${ATKStep} for each additional combo, up to ATK x${maxATKMultiplier} at ${maxCombosRequired} combos.`;
		} else {
			return `ATK x${minATKMultiplier} at ${minCombosRequired} combos.`;
		}
	}

	public LSSkillActivationAtkRcvBoost(): string {
		let ATKMultiplier = this.ATKFromSlice(-1);
		let RCVMultiplier = this.RCVFromSlice(-1);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `All attribute cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
	}

	public LSAtkBoostWithExactCombos(): string {
		let data = this.params;
		let combo = data[0];
		let boost = this.mult(data[1]);

		return `All attribute cards ATK x${boost} when reaching exactly ${combo} combos.`;
	}

	public LSComboFlatAtkRcvBoost(): string {
		let data = this.params;
		let combo = data[0];
		let ATKMultipler = this.ATKFromSlice();
		let RCVMultiplier = this.RCVFromSlice();

		return `All attribute cards ATK x${ATKMultipler}, RCV x${RCVMultiplier} when reaching ${combo} or more combos.`;
	}

	public LSComboFlatMultiplierAttrAtkBoost(): string {
		let data = this.params;
		let combo = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let ATKMultiplier = this.ATKFromSlice(1);

		return `${attributeString} attribute cards ATK x${ATKMultiplier} at ${combo} combos or above.`;
	}

	public LSReducedRcvAtkBoost(): string {
		let data = this.params;
		let RCVReduction = data[0];
		let ATKMultiplier = this.mult(data[1]);

		return `${RCVReduction}% RCV reduction. All attribute cards ATK x${ATKMultiplier}.`;
	}

	public LSReducedHpAtkBoost(): string {
		let data = this.params;
		let HPReduction = data[0];
		let ATKMultiplier = this.mult(data[1]);

		return `${HPReduction}% HP reduction. All attribute cards ATK x${ATKMultiplier}.`;
	}

	public LSHpReduction(): string {
		let data = this.params;
		let HPReduction = data[0];

		return `${HPReduction}% HP reduction.`;
	}

	public LSReducedHpTypeAtkBoost(): string {
		let data = this.params;
		let type = this.mapType(data[1]);
		let HPReduction = data[0];
		let ATKMultiplier = this.mult(data[2]);

		return `${HPReduction}% HP reduction. ${type} Type cards ATK x${ATKMultiplier}.`;
	}

	public LSBlobFlatAtkBoost(): string {
		let data = this.params;
		let attribute = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attribute);
		let minCount = data[1];
		let ATKMultiplier = this.mult(data[2]);

		return `ATK x${ATKMultiplier} when simultaneously clearing ${minCount}+ connected ${attributeString} orbs.`;
	}

	public LSTwoAttrHpAtkBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let boost = this.mult(data[2]);

		return `${firstAttribute} & ${secondAttribute} attribute cards HP x${boost}, ATK x${boost}.`;
	}

	public LSTwoAttrAllStatBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let boost = this.mult(data[2]);

		return `${firstAttribute} & ${secondAttribute} attribute cards HP x${boost}, ATK x${boost} RCV x${boost}.`;
	}

	public LSBlobScalingAtkBoost(): string {
		let data = this.params;
		let attribute = this.getAttributesFromBinary(data[0]);
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4];
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		if (minATKMultiplier === maxATKMultiplier) {
			return `All attribute cards ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attribute} orbs.`;
		} else {
			return `All attribute cards ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attribute} orbs. ATK x${ATKStep} for each additional connected orb, up to ATK x${maxATKMultiplier} at ${maxCount} connected orbs.`;
		}
	}

	public LSAttrOrTypeStatBoost(): string {
		//@TODO 121
		return `Physical Type cards RCV x1.5.`;
	}

	public LSLowHpConditionalAttrTypeAtkRcvBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = data.length > 4 ? this.multiFloor(data[4]) : 1;
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost} when HP is less than ${threshold}%.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is less than ${threshold}%.`;
		}

		return '';
	}

	public LSHighHpConditionalAttrTypeAtkRcvBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = data.length > 4 ? this.multiFloor(data[4]) : 1;
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		return '';
	}

	public LSAttrComboScalingAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0, 100, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3], data[4]]);
		let attributeString = this.toAttributeString(attributes);
		let minMatch = data[5];
		let maxMatch = attributes.length;
		let minATKMultiplier = this.mult(data[6]);
		let ATKStep = this.mult(data[7]);
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxMatch - minMatch);

		return `All attribute cards ATK x${maxATKMultiplier} when reaching ${attributeString} combos.`;
	}

	public LSTeamUnitConditionalStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 100, 100, 100]);
		let ids = this.listConcat([data[0], data[1], data[2], data[3], data[4]]);
		let HPMultiplier = this.multiFloor(data[5]);
		let ATKMultipler = this.multiFloor(data[6]);
		let RCVMultiplier = this.multiFloor(data[7]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		return `All attribute cards ${boost} when {{${ids}}} in the same team.`;
	}

	public LSMultiAttrTypeStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let reductionAttribute = this.getAttributesFromBinary(data[5]);
		let reductionAttributeString = this.toAttributeString(reductionAttribute);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost}.`;
		}

		return '';
	}

	public LSLowHpAttrAtkStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 0, 0]);
		let threshold = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let reductionAttribute = this.getAttributesFromBinary(data[5]);
		let reductionAttributeString = this.toAttributeString(reductionAttribute);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost} when HP is less than ${threshold}%.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is less than ${threshold}%.`;
		}

		return '';
	}

	public LSHighHpAttrTypeStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 0, 0]);
		let threshold = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let reductionAttribute = this.getAttributesFromBinary(data[5]);
		let reductionAttributeString = this.toAttributeString(reductionAttribute);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		return '';
	}

	public LSSkillUsedAttrTypeAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let ATKMultipler = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
		}

		return '';
	}

	public LSMultiAttrConditionalStatBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 100, 0, 100, 100, 100]);

		let firstAttributes = this.getAttributesFromBinary(data[0]);
		let firstAttributeString = this.toAttributeString(firstAttributes);
		let firstHPMultiplier = this.multiFloor(data[1]);
		let firstATKMultiplier = this.multiFloor(data[2]);
		let firstRCVMultiplier = this.multiFloor(data[3]);
		let firstBoost = this.stringifyBoost(firstHPMultiplier, firstATKMultiplier, firstRCVMultiplier);

		let secondAttributes = this.getAttributesFromBinary(data[4]);
		let secondAttributeString = this.toAttributeString(secondAttributes);
		let secondHPMultiplier = this.multiFloor(data[5]);
		let secondATKMultiplier = this.multiFloor(data[6]);
		let secondRCVMultiplier = this.multiFloor(data[7]);
		let secondBoost = this.stringifyBoost(secondHPMultiplier, secondATKMultiplier, secondRCVMultiplier);

		let max = (a, b) => (a > b ? a : b);

		//Not sure what the followings are for
		function min_1_if_set(settable, value) {
			//Only constrain the value to 1 if it is optional.
			return settable.length < 5 ? max(value, 1) : value;
		}

		let HPMultiplier =
			min_1_if_set(firstAttributes, firstHPMultiplier) * min_1_if_set(secondAttributes, secondHPMultiplier);
		let ATKMultiplier =
			min_1_if_set(firstAttributes, firstATKMultiplier) * min_1_if_set(secondAttributes, secondATKMultiplier);
		let RCVMultiplier =
			min_1_if_set(firstAttributes, firstRCVMultiplier) * min_1_if_set(secondAttributes, secondRCVMultiplier);

		return `${firstAttributeString} attribute cards ${firstBoost}. ${secondAttributeString} attribute cards ${secondBoost}.`;
	}

	public LSMultiTypeConditionalStatBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 100, 0, 100, 100, 100]);
		let firstTypes = this.getTypesFromBinary(data[0]);
		let firstTypeString = this.toTypeString(firstTypes);
		let firstHPMultiplier = this.multiFloor(data[1]);
		let firstATKMultiplier = this.multiFloor(data[2]);
		let firstRCVMultiplier = this.multiFloor(data[3]);
		let firstBoost = this.stringifyBoost(firstHPMultiplier, firstATKMultiplier, firstRCVMultiplier);

		let secondTypes = this.getTypesFromBinary(data[4]);
		let secondTypeString = this.toTypeString(secondTypes);
		let secondHPMultiplier = this.multiFloor(data[5]);
		let secondATKMultiplier = this.multiFloor(data[6]);
		let secondRCVMultiplier = this.multiFloor(data[7]);
		let secondBoost = this.stringifyBoost(secondHPMultiplier, secondATKMultiplier, secondRCVMultiplier);

		return `${firstTypeString} attribute cards ${firstBoost}. ${secondTypeString} attribute cards ${secondBoost}.`;
	}

	public LSHpMultiConditionalAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 0, 0, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);

		let firstThreshold = data[2];
		let firstIsAbove = !data[3];
		let firstATKMultiplier = this.mult(data[4]) || 1;

		let secondThreshold = data[5];
		let secondIsAbove = !data[6];
		let secondATKMultiplier = this.mult(data[7]) || 1;

		return `${attributeString} cards ATK x${firstATKMultiplier} when HP is ${this.stringifyHPCondition(
			firstThreshold,
			firstIsAbove
		)}. ATK x${secondATKMultiplier} when HP is ${this.stringifyHPCondition(secondThreshold, secondIsAbove)}.`;
	}

	public LSRankXpBoost(): string {
		let data = this.mergeDefaults([0]);
		let multiplier = this.mult(data[0]);

		return `Get x${multiplier} experience after a battle.`;
	}

	public LSHealMatchRcvBoost(): string {
		let data = this.mergeDefaults([100]);
		let RCVMultiplier = this.mult(data[0]);

		return `RCV x${RCVMultiplier} when matching exactly 4 connected heart orbs.`;
	}

	public LSEnhanceOrbMatch5(): string {
		let data = this.mergeDefaults([100]);
		let ATKMultipler = this.mult(data[1]);

		return `Matched attribute ATK x${ATKMultipler} when matching exactly 5 connected orbs with at least 1 enhanced orb.`;
	}

	public LSHeartCross(): string {
		let data = this.mergeDefaults([100, 100, 0]);
		let ATKMultipler = this.multiFloor(data[0]);
		let RCVMultiplier = this.multiFloor(data[1]);
		let shield = data[2];
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier, shield);

		return `${boost} after matching Heal orbs in a cross formation.`;
	}

	public LSMultiboost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		return `${boost} in cooperation mode.`;
	}

	public LSAttrCross(): string {
		//@TODO 157
		// self.atks = sorted(ms.data[1::2])
		// if len(set(self.atks)) > 1:
		//     human_fix_logger.error('Bad assumption; cross LS has multiple attack values: %s', ms.skill_id)
		// self.multiplier = mult(ms.data[1])
		// self.attributes = ms.data[::2]
		// self.crossmults = [CrossMultiplier(ms.data[i], ms.data[i + 1]) for i in range(0, len(ms.data), 2)]
		// atk = self.multiplier ** (2 if len(self.attributes) == 1 else 3)
		return `ATK x3.5 for clearing each Wood or Dark orbs in a cross formation.`;
	}

	public LSMatchXOrMoreOrbs(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let minMatch = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let HPMultiplier = this.multiFloor(data[4]);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `Can no longer clear ${minMatch} connected orbs. ${attributeString} attribute cards ${boost}`;
		}

		if (types.length > 0) {
			return `Can no longer clear ${minMatch} connected orbs. ${typeString} attribute cards ${boost}`;
		}

		return '';
	}

	public LSAdvancedBlobMatch(): string {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4];
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		return `ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs. ATK x${ATKStep} for each additional orb, up to ATK x${maxATKMultiplier} at ${maxCount} connected orbs.`;
	}

	public LSSevenBySix(): string {
		return `Change the board to 7x6 size.`;
	}

	public LSNoSkyfallBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let reductionAttribute = this.getAttributesFromBinary(data[5]);
		let reductionAttributeString = this.toAttributeString(reductionAttribute);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data[6];
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `No skyfall matches. ${attributeString} attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `No skyfall matches. ${typeString} Type cards ${boost}.`;
		}

		return `No skyfall matches.`;
	}

	public LSAttrComboConditionalAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 100, 100, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let attributeString = this.toAttributeString(attributes);
		let minMatch = data[4];
		let minATKMultiplier = this.mult(data[5]);
		let minRCVMultiplier = this.mult(data[6]);
		let ATKStep = this.mult(data[7]);
		let RCVStep = ATKStep;
		let maxMatch = attributes.length;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxMatch - minMatch);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxMatch - minMatch);

		return `All attribute cards ATK x${maxATKMultiplier}, RCV x${maxRCVMultiplier} when reaching ${attributeString} combos.`;
	}

	public LSRainbowAtkRcv(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 0, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minAttributesRequired = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let minRCVMultiplier = this.mult(data[3]);
		let ATKStep = this.mult(data[4]);
		let RCVStep = this.mult(data[5]);
		let maxAttributesRequired = data[6] || attributes.length;

		if (ATKStep === 0) {
			maxAttributesRequired = minAttributesRequired;
		} else if (maxAttributesRequired < minAttributesRequired) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		} else if (maxAttributesRequired + minAttributesRequired < attributes.length) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		}

		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxAttributesRequired - minAttributesRequired);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxAttributesRequired - minAttributesRequired);

		return `All attribute cards ATK x${minATKMultiplier}, RCV x${minRCVMultiplier} when attacking with ${minAttributesRequired} of following orb types: ${attributeString}. ATK x${ATKStep}, RCV x${RCVStep} for each additional orb type, up to ATK x${maxATKMultiplier}, RCV x${maxRCVMultiplier} for ${maxAttributesRequired} matches.`;
	}

	public LSAtkRcvComboScale(): string {
		let data = this.mergeDefaults([1, 100, 100, 0, 0, 0]);
		let minCombosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);
		let minRCVMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let RCVStep = this.mult(data[4]);
		let maxCombosRequired = data[5];
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCombosRequired - minCombosRequired);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxCombosRequired - minCombosRequired);

		return `ATK x${maxATKMultiplier}, RCV x${maxRCVMultiplier} when reaching ${minCombosRequired} combos.`;
	}

	public LSBlobAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 0, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes, 'or');
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let minRCVMultiplier = this.mult(data[3]);
		let ATKStep = this.mult(data[4]);
		let RCVStep = this.mult(data[5]);
		let maxCount = data[6];
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxCount - minCount);

		//Overrides for optional ATK/RCV
		if (minATKMultiplier === 0 && maxATKMultiplier === 0) {
			minATKMultiplier = 1;
			maxATKMultiplier = 1;
		}

		if (minRCVMultiplier === 0 && maxRCVMultiplier === 0) {
			minRCVMultiplier = 1;
			maxRCVMultiplier = 1;
		}

		return `ATK x${maxATKMultiplier}, RCV x${maxRCVMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs.`;
	}

	public LSComboMultPlusShield(): string {
		let data = this.mergeDefaults([0, 100, 0]);
		let combosRequired = data[0];
		let ATKMultipler = this.mult(data[1]);
		let shield = data[2];

		return `All attribute cards ATK x${ATKMultipler}, ${shield}% all damage reduction when reaching ${combosRequired} combos.`;
	}

	public LSRainbowMultPlusShield(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let attributesRequired = data[1];
		let ATKMultiplier = this.mult(data[2]);
		let shield = data[3];

		return `All attribute cards ATK x${ATKMultiplier}, ${shield}% all damage reduction when attacking with ${attributeString} orb types at the same time.`;
	}

	public LSMatchAttrPlusShield(): string {
		let data = this.params;
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let attributeString = this.toAttributeString(attributes);
		let attributesRequired = data[4];
		let ATKMultipler = this.mult(data[5]);
		let shield = data[6];

		return `All attribute cards ATK x${ATKMultipler}, ${shield}% all damage reduction when attacking with ${attributeString} combos at the same time.`;
	}

	public LSCollabConditionalBoost(): string {
		let data = this.mergeDefaults([0, null, null, 100, 100, 100]);
		let collabId = data[0];
		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultipler = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return `HP x${HPMultiplier}, ATK x${ATKMultipler}, RCV ${RCVMultiplier} when all subs are from {{${collabId}}} Collab.`;
	}

	public LSOrbRemainingMultiplier(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let orbCount = data[5];
		let minATKMultiplier = this.multiFloor(data[3]);
		let baseATKMultiplier = this.mult(data[6]);
		let bonusATK = this.mult(data[7]);
		let maxBonusATK = baseATKMultiplier + bonusATK * orbCount;
		let HPMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let ATKMultipler = minATKMultiplier * maxBonusATK; //What is this?

		let boost = this.stringifyBoost(HPMultiplier, minATKMultiplier, RCVMultiplier);

		let result = [];
		result.push('No skyfall combos.');

		if (boost) result.push(boost);

		result.push(`ATK x${baseATKMultiplier} when there are ${orbCount} or less orbs on the board after matching.`);

		if (baseATKMultiplier !== maxBonusATK) {
			result.push(`ATK x1 for every missing orb afterwards, up to ATK x${maxBonusATK}.`);
		}

		return result.join(' ');
	}

	public LSFixedMovementTime(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let time = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);

		//@TODO: This needs to be overhauled, just accept the value here if it != 0.
		if (time === 0) {
			//Ignore this case; bad skill
			return '';
		}

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultipler = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `Fixed orb movement time at ${time} seconds. ${attributeString} attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `Fixed orb movement time at ${time} seconds. ${typeString} Type cards ${boost}.`;
		}

		return `Fixed orb movement time at ${time} seconds.`;
	}

	public LSRowMatcHPlusDamageReduction(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let count = data[1];
		let ATKMultipler = this.multiFloor(data[2]);
		let shield = data[3];
		let boost = this.stringifyBoost(1, ATKMultipler, 1, shield);

		return `${boost} when matching ${count}+ ${attributeString} orbs.`;
	}

	public LSDualThresholdBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 0, 0, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);

		//More than x%
		let firstThreshold = data[2];
		let firstATKMultiplier = this.mult(data[3]) || 1;
		let firstRCVMultiplier = 1;
		let firstShield = data[4];
		let firstBoost = this.stringifyBoost(1, firstATKMultiplier, firstRCVMultiplier, firstShield);

		//Less than x%
		let secondThreshold = data[5];
		let secondATKMultiplier = this.mult(data[6]);
		let secondRCVMultiplier = this.mult(data[7]);
		let secondShield = 0;
		let secondBoost = this.stringifyBoost(1, secondATKMultiplier, secondRCVMultiplier, secondShield);

		let ATKMultipler = firstATKMultiplier > secondATKMultiplier ? firstATKMultiplier : secondATKMultiplier;
		let RCVMultiplier = firstRCVMultiplier > secondRCVMultiplier ? firstRCVMultiplier : secondRCVMultiplier;
		let shield = firstShield > secondShield ? firstShield : secondShield;

		if (firstThreshold) {
			return `All attribute cards ${firstBoost} when HP ${this.stringifyHPCondition(firstThreshold, true)}.`;
		} else {
			return `All attribute cards ${secondBoost} when HP ${this.stringifyHPCondition(secondThreshold, false)}.`;
		}
	}

	public LSBonusTimeStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let time = this.mult(data[0]);
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultipler = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} attribute cards ${boost}. Increases time limit of orb movement by ${time} seconds.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost}. Increases time limit of orb movement by ${time} seconds.`;
		}

		return `Increases time limit of orb movement by ${time} seconds.`;
	}

	public LSSevenBySixStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultipler = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		if (attributes.length > 0) {
			return `Change the board to 7x6 size. ${attributeString} attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `Change the board to 7x6 size. ${typeString} Type cards ${boost}.`;
		}

		return '';
	}

	public LSBlobMatchBonusCombo(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minMatch = data[1];
		let bonusCombo = data[3];
		let ATKMultipler = this.multiFloor(data[2]);

		return `All attribute cards ATK x${ATKMultipler} and +${bonusCombo} combo when matching ${minMatch}+ connected ${attributeString} orbs.`;
	}

	public LSLMatchBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes, 'or');
		let ATKMultipler = this.multiFloor(data[1]);
		let RCVMultiplier = this.multiFloor(data[2]);
		let shield = data[3];
		let boost = this.stringifyBoost(1, ATKMultipler, RCVMultiplier, shield);

		return `All attribute cards cards ${boost} when matching ${attributeString} orbs in a L formation.`;
	}

	public LSAttrMatchBonusCombo(): string {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minAttributesRequired = data[1];
		let bonusCombo = data[3];
		let ATKMultipler = this.multiFloor(data[2]);

		return `All attribute cards ATK x${ATKMultipler} and +${bonusCombo} combo when attacking with ${minAttributesRequired} of ${attributeString} orbs at the same time.`;
	}

	public LSDisablePoisonEffects(): string {
		return `Gain immunity to poison damage.`;
	}

	public LSHealMatchBoostUnbind(): string {
		let data = this.mergeDefaults([0, 100, 0, 0]);
		let healAmount = data[0];
		let unbindAmount = data[3];
		let ATKMultipler = this.multiFloor(data[1]);
		let shield = data[2];
		let boost = this.stringifyBoost(1, ATKMultipler, 1, shield);

		return `All attribute cards ${boost} when recovering ${this.numberWithCommas(healAmount)}+ HP with Heal orbs.`;
	}

	public LSRainbowBonusDamage(): string {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minAttributesRequired = data[1];
		let bonusDamage = data[2];

		return `${this.numberWithCommas(
			bonusDamage
		)} damage to all enemies, ignore enemy element and defense when attacking with ${minAttributesRequired} of following orb types: ${attributeString}.`;
	}

	public LSBlobBonusDamage(): string {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes, 'or');
		let minMatch = data[1];
		let bonusDamage = data[2];

		return `${this.numberWithCommas(
			bonusDamage
		)} damage to all enemies, ignore enemy element and defense when simultaneously clearing ${minMatch}+ ${attributeString} orbs at the same time.`;
	}

	public LSColorComboBonusDamage(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let attributeString = this.toAttributeString(attributes, 'or');
		let minCombosRequired = data[4];
		let bonusDamage = data[5];

		return `${this.numberWithCommas(
			bonusDamage
		)} damage to all enemies, ignore enemy element and defense when attack with ${minCombosRequired} ${attributeString} combos at the same time.`;
	}

	public LSGroupConditionalBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 100]);
		let groupId = data[0];
		let HPMultiplier = this.multiFloor(data[1]);
		let ATKMultipler = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultipler, RCVMultiplier);

		return `${boost} when all subs are from {{${groupId}}}.`;
	}

	public LSColorComboBonusCombo(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let attributeString = this.toAttributeString(attributes, 'and');
		let minCombosRequired = data[5];
		let bonusCombo = data[6];

		return `+${bonusCombo} combo when ${attributeString} attack at once.`;
	}
}
