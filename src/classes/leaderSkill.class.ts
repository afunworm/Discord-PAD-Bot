//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/leader_skill_info.py
import { LEADERSKILL_MAP } from './leaderSkill.map';
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { MONSTER_TYPES } from '../shared/monster.types';
import { MONSTER_GROUPS } from '../shared/monster.groups';
import { MONSTER_COLLABS } from '../shared/monster.collabs';

export class LeaderSkill {
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

	public getLSType(): string {
		return LEADERSKILL_MAP[this.type.toString()];
	}

	public getMaxMultiplier(): number[] {
		let functionToCall = LEADERSKILL_MAP[this.type.toString()] + 'Multiplier';
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : 0;
	}

	public getDetailDescription(): string | null {
		let functionToCall = LEADERSKILL_MAP[this.type.toString()];
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

		return boost.length > 1 ? boost.join(', ') : boost[0];
	}

	private stringifyScaleBoost(ATKBoost: number = 0, RCVBoost: number = 0): string {
		let boost = [];

		if (ATKBoost !== 0) boost.push(`ATK multiplier increases by ${ATKBoost}`);
		if (RCVBoost !== 0) boost.push(`RCV multiplier increases by ${RCVBoost}`);

		if (boost.length === 0) return '';

		return boost.length > 1 ? boost.join(', ') : boost[0];
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

	private capitalizeFirstLetter = (input: string) => input[0].toUpperCase() + input.substring(1);

	public testOutput(): string {
		let functionToCall = LEADERSKILL_MAP[this.type];
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : null;
	}

	public NoLS(): string {
		return 'No Leader Skill';
	}

	public NoLSMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSAttrAtkBoostMultiplier(): number[] {
		let ATKMultiplier = this.mult(this.params[1]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSAttrAtkBoost(): string {
		let attribute = this.mapAttribute(this.params[0]);
		let ATKMultiplier = this.mult(this.params[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSBonusAttackMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSBonusAttack(): string {
		let multiplier = this.mult(this.params[0]);

		return `Deal ATK x${multiplier} damage to all enemies after every orbs elimination. Ignores enemy element, but can be reduced by enemy defense down to 0 damage.`;
	}

	public LSAutohealMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSAutoheal(): string {
		let data = this.mergeDefaults([0]);
		let multiplier = this.mult(data[0]);

		return `Heal RCV x${multiplier} as HP after every orbs elimination.`;
	}

	public LSResolveMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSResolve(): string {
		let data = this.mergeDefaults([0]);
		let threshold = data[0];

		return `While your HP is ${threshold}% or above, a single hit that normally kills you will instead leave you with 1 HP. For the consecutive hits, this skill will only affect the first hit.`;
	}

	public LSMovementTimeIncreaseMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSMovementTimeIncrease(): string {
		let data = this.mergeDefaults([0]);
		let extra = this.mult(data[0]);

		return `Increases time limit of orb movement by ${extra} seconds.`;
	}

	public LSDamageReductionMultiplier(): number[] {
		let data = this.mergeDefaults([0]);
		let shield = data[0];
		return [1, 1, 1, 1 - this.mult(shield)];
	}

	public LSDamageReduction(): string {
		let data = this.mergeDefaults([0]);
		let shield = data[0];
		let boost = this.stringifyBoost(1, 1, 1, shield);

		return `${this.capitalizeFirstLetter(boost)}.`;
	}

	public LSAttrDamageReductionMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0]);
		let shield = data[1];

		return [1, 1, 1, 1 - this.mult(shield)];
	}

	public LSAttrDamageReduction(): string {
		let data = this.mergeDefaults([0, 0]);
		let attribute = this.mapAttribute(data[0]);
		let shield = data[1];

		return `${shield}% ${attribute} damage reduction.`;
	}

	public LSTypeAtkBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let ATKMultiplier = this.mult(data[1]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSTypeAtkBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeHpBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let HPMultiplier = this.mult(data[1]);

		return [HPMultiplier, 1, 1, 1];
	}

	public LSTypeHpBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let RCVMultiplier = this.mult(data[1]);

		return [1, 1, RCVMultiplier, 1];
	}

	public LSTypeRcvBoost() {
		let data = this.mergeDefaults([0, 100]);
		let type = this.mapType(data[0]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, 1, RCVMultiplier);

		return `${type} Type cards RCV ${boost}.`;
	}

	public LSStaticAtkBoostMultiplier(): number[] {
		//CANNOT TEST
		let data = this.mergeDefaults([100]);
		let ATKMultiplier = this.mult(data[0]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSStaticAtkBoost(): string {
		//CANNOT TEST BECAUSE CANNOT FIND ANY MONSTER ON PADX
		let data = this.mergeDefaults([100]);
		let ATKMultiplier = this.mult(data[0]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `All allies ${boost}`;
	}

	public LSAttrAtkRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSAttrAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let attribute = this.mapAttribute(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSAllStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSAllStatBoost(): string {
		let data = this.mergeDefaults([0, 100]);
		let attribute = this.mapAttribute(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${attribute} Attribute cards ${boost}`;
	}

	public LSTwoTypeHpBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100]);
		let HPMultiplier = this.mult(data[2]);

		return [HPMultiplier, 1, 1, 1];
	}

	public LSTwoTypeHpBoost(): string {
		let data = this.mergeDefaults([0, 0, 100]);
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier);

		return `${firstType} & ${secondType} Type cards ${boost}.`;
	}

	public LSTwoTypeAtkBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100]);
		let ATKMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSTwoTypeAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 100]);
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${firstType} & ${secondType} Type cards ${boost}.`;
	}

	public LSTaikoDrumMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSTaikoDrum(): string {
		return `Turn orb sound effects into Taiko noises.`;
	}

	public LSTwoAttrDamageReductionMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0]);
		let shield = data[2];

		return [1, 1, 1, 1 - this.mult(shield)];
	}

	public LSTwoAttrDamageReduction(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let shield = data[2];

		return `${shield}% ${firstAttribute} & ${secondAttribute} damage reduction.`;
	}

	public LSLowHpShieldMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0]);
		let shield = data[2];

		return [1, 1, 1, 1 - this.mult(shield)];
	}

	public LSLowHpShield(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let threshold = data[0];
		//This really only triggers for one specific odin, which seems to have this behavior hard-coded somehow
		let above = threshold === 1 ? true : false;
		let shield = data[2];
		let boost = this.stringifyBoost(1, 1, 1, shield);

		return `${this.capitalizeFirstLetter(boost)} when HP is ${this.stringifyHPCondition(threshold, above, true)}.`;
	}

	public LSLowHpAtkOrRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();

		return [1, ATKBoost, RCVBoost, 1];
	}

	public LSLowHpAtkOrRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let threshold = data[0];
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKBoost, RCVBoost);

		return `All Attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold, false, false)}.`;
	}

	public LSTwoAttrAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSTwoAttrAtkBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${firstAttribute} & ${secondAttribute} Attribute cards ${boost}.`;
	}

	public LSCounterattackMultiplier(): number[] {
		return [1, 1, 1, 1];
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

	public LSHighHpShieldMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0]);
		let shield = data[2];

		return [1, 1, 1, 1 - this.mult(shield)];
	}

	public LSHighHpShield(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let threshold = data[0];
		let chance = data[1];
		let shield = data[2];

		if (chance !== 100) {
			return `${chance}% chance to have ${shield}% all damage reduction when HP is ${this.stringifyHPCondition(
				threshold
			)}.`;
		} else {
			return `${shield}% all damage reduction when HP is ${this.stringifyHPCondition(threshold)}.`;
		}
	}

	public LSHighHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();

		return [1, ATKBoost, RCVBoost, 1];
	}

	public LSHighHpAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let ATKBoost = this.ATKFromSlice();
		let RCVBoost = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKBoost, RCVBoost);

		return `All Attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
	}

	public LSAttrAtkHpBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSAttrAtkHpBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSTwoAttrHpBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);

		return [HPMultiplier, 1, 1, 1];
	}

	public LSTwoAttrHpBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier);

		return `${firstAttribute} & ${secondAttribute} Attribute cards ${boost}.`;
	}

	public LSAttrHpBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);

		return [HPMultiplier, 1, 1, 1];
	}

	public LSAttrHpBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSAttrRcvBoostMultiplier(): number[] {
		let data = this.params;
		let RCVMultiplier = this.mult(data[1]);

		return [1, 1, RCVMultiplier, 1];
	}

	public LSAttrRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, 1, RCVMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSEggDropRateBoostMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSEggDropRateBoost(): string {
		let data = this.params;
		let multiplier = this.mult(data[0]);

		return `Increase egg drop rate by ${multiplier}x (excluding Multiplayer Mode).`;
	}

	public LSCoinDropBoostMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSCoinDropBoost(): string {
		let data = this.params;
		let multiplier = this.mult(data[0]);

		return `Get x${multiplier} coins after a battle.`;
	}

	public LSRainbowMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 0, 0]);
		let requiredAttributes = this.getAttributesFromBinary(data[0]);
		let minAttributesRequired = data[1];
		let maxAttributesRequired = data[4] || requiredAttributes.length;
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);

		if (ATKStep === 0) {
			maxAttributesRequired = minAttributesRequired;
		} else if (maxAttributesRequired < minAttributesRequired) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		} else if (maxAttributesRequired + minAttributesRequired <= requiredAttributes.length) {
			maxAttributesRequired = minAttributesRequired + maxAttributesRequired;
		}

		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxAttributesRequired - minAttributesRequired);

		return [1, maxATKMultiplier, 1, 1];
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
			return `All Attribute cards ATK x${minATKMultiplier} when attacking with ${minAttributesRequired} of following orb types: ${requiredAttributeString}.`;
		} else {
			return `All Attribute cards ATK x${minATKMultiplier} when attacking with ${minAttributesRequired} of following orb types: ${requiredAttributeString}. ATK x${ATKStep} for each additional orb type, up to ATK x${maxATKMultiplier} for all ${maxAttributesRequired} matches.`;
		}
	}

	//Untested from this point onwards

	public LSTypeHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSTypeHpAtkBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeHpRcvBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);

		return [HPMultiplier, 1, RCVMultiplier, 1];
	}

	public LSTypeHpRcvBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, 1, RCVMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSTypeAtkRcvBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSTypeAllStatBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSTypeAllStatBoost(): string {
		let data = this.params;
		let type = this.mapType(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${type} Type cards ${boost}.`;
	}

	public LSComboFlatMultiplierMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100]);
		let minATKMultiplier = this.mult(data[1]);

		return [1, minATKMultiplier, 1, 1];
	}

	public LSComboFlatMultiplier(): string {
		let data = this.mergeDefaults([0, 100]);
		let combosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);

		return `All Attribute cards ATK x${minATKMultiplier} when reaching ${combosRequired} combos or above.`;
	}

	public LSAttrHpRcvBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);

		return [HPMultiplier, 1, RCVMultiplier, 1];
	}

	public LSAttrHpRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let HPMultiplier = this.mult(data[1]);
		let RCVMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, 1, RCVMultiplier);

		return `${attribute} Attribute cards ${boost}.`;
	}

	public LSAttrTypeAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSAttrTypeAtkBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${attribute} attribute & ${type} Type cards ${boost}.`;
	}

	public LSAttrTypeHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSAttrTypeHpAtkBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `${attribute} attribute & ${type} Type cards ${boost}.`;
	}

	public LSAttrTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let RCVMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSAttrTypeAtkRcvBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let RCVMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${attribute} attribute & ${type} Type cards ${boost}.`;
	}

	public LSAttrTypeAllStatBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSAttrTypeAllStatBoost(): string {
		let data = this.params;
		let attribute = this.mapAttribute(data[0]);
		let type = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${attribute} attribute & ${type} Type cards ${boost}.`;
	}

	public LSTwoTypeHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSTwoTypeHpAtkBoost(): string {
		let data = this.params;
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `${firstType} & ${secondType} Type cards ${boost}.`;
	}

	public LSTwoTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSTwoTypeAtkRcvBoost(): string {
		let data = this.params;
		let firstType = this.mapType(data[0]);
		let secondType = this.mapType(data[1]);
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${firstType} & ${secondType} Type cards ATK x${boost}, RCV ${boost}.`;
	}

	public LSLowHpConditionalAttrAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.ATKFromSlice(1);
		let RCVMultiplier = this.RCVFromSlice(1);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSLowHpConditionalAttrAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attribute = this.mapAttribute(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);
		let RCVMultiplier = this.RCVFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `${attribute} Attribute cards ${boost} when HP is less than ${threshold}%.`;
	}

	public LSLowHpConditionalTypeAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.ATKFromSlice(1);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSLowHpConditionalTypeAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let type = this.mapType(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${type} Type cards ${boost} when HP ${this.stringifyHPCondition(threshold, false)}.`;
	}

	public LSHighHpConditionalAttrAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.ATKFromSlice(1);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSHighHpConditionalAttrAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let attribute = this.mapAttribute(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${attribute} Attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
	}

	public LSHighHpConditionalTypeAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.ATKFromSlice(1);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSHighHpConditionalTypeAtkBoost(): string {
		let data = this.params;
		let threshold = data[0];
		let type = this.mapType(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${type} Type cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
	}

	public LSComboScaledMultiplierMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 0, 0]);
		let minCombosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);
		let ATKStep = this.mult(data[2]);
		let maxCombosRequired = data[3] || minCombosRequired;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCombosRequired - minCombosRequired);

		return [1, maxATKMultiplier, 1, 1];
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

	public LSSkillActivationAtkRcvBoostMultiplier(): number[] {
		let ATKMultiplier = this.ATKFromSlice(-1);
		let RCVMultiplier = this.RCVFromSlice(-1);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSSkillActivationAtkRcvBoost(): string {
		let ATKMultiplier = this.ATKFromSlice(-1);
		let RCVMultiplier = this.RCVFromSlice(-1);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `All Attribute cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
	}

	public LSAtkBoostWithExactCombosMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[1]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSAtkBoostWithExactCombos(): string {
		let data = this.params;
		let combo = data[0];
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `All Attribute cards ${boost} when reaching exactly ${combo} combos.`;
	}

	public LSComboFlatAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.ATKFromSlice();
		let RCVMultiplier = this.RCVFromSlice();

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSComboFlatAtkRcvBoost(): string {
		let data = this.params;
		let combo = data[0];
		let ATKMultiplier = this.ATKFromSlice();
		let RCVMultiplier = this.RCVFromSlice();
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `All Attribute cards ${boost} when reaching ${combo} or more combos.`;
	}

	public LSComboFlatMultiplierAttrAtkBoostMultiplier(): number[] {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[1]);
		let ATKMultiplier = this.ATKFromSlice(1);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSComboFlatMultiplierAttrAtkBoost(): string {
		let data = this.params;
		let combo = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let ATKMultiplier = this.ATKFromSlice(1);
		let boost = this.stringifyBoost(1, ATKMultiplier);

		return `${attributeString} Attribute cards ${boost} at ${combo} combos or above.`;
	}

	public LSReducedRcvAtkBoostMultiplier(): number[] {
		let data = this.params;
		let RCVMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[1]);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSReducedRcvAtkBoost(): string {
		let data = this.params;
		let RCVMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		return `All Attribute cards ${boost}.`;
	}

	public LSReducedHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[1]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSReducedHpAtkBoost(): string {
		let data = this.params;
		let HPMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[1]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `All Attribute cards ${boost}.`;
	}

	public LSHpReductionMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[0]);
		let ATKMultiplier = data.length > 1 ? this.mult(data[2]) : 1;

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSHpReduction(): string {
		let data = this.params;
		let HPMultiplier = this.mult(data[0]);
		let boost = this.stringifyBoost(HPMultiplier);

		if (data.length > 1) {
			let attributes = this.getAttributesFromBinary(data[1]);
			let attributeString = this.toAttributeString(attributes);
			let ATKMultiplier = this.mult(data[2]);
			let boost2 = this.stringifyBoost(1, ATKMultiplier);

			return `All Attribute cards ${boost}. ${attributeString} Attribute cards ${boost2}.`;
		}

		return `All Attribute cards ${boost}.`;
	}

	public LSReducedHpTypeAtkBoostMultiplier(): number[] {
		let data = this.params;
		let type = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier);
		let typeBoost = this.stringifyBoost(1, ATKMultiplier);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSReducedHpTypeAtkBoost(): string {
		let data = this.params;
		let type = this.mapType(data[1]);
		let HPMultiplier = this.mult(data[0]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier);
		let typeBoost = this.stringifyBoost(1, ATKMultiplier);

		return `All Attribute cards ${boost}. ${type} Type cards ${typeBoost}.`;
	}

	public LSBlobFlatAtkBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSBlobFlatAtkBoost(): string {
		let data = this.params;
		let attribute = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attribute);
		let minCount = data[1];
		let ATKMultiplier = this.mult(data[2]);

		return `ATK x${ATKMultiplier} when simultaneously clearing ${minCount}+ connected ${attributeString} orbs.`;
	}

	public LSTwoAttrHpAtkBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);

		return [HPMultiplier, ATKMultiplier, 1, 1];
	}

	public LSTwoAttrHpAtkBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier);

		return `${firstAttribute} & ${secondAttribute} Attribute cards ${boost}.`;
	}

	public LSTwoAttrAllStatBoostMultiplier(): number[] {
		let data = this.params;
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSTwoAttrAllStatBoost(): string {
		let data = this.params;
		let firstAttribute = this.mapAttribute(data[0]);
		let secondAttribute = this.mapAttribute(data[1]);
		let HPMultiplier = this.mult(data[2]);
		let ATKMultiplier = this.mult(data[2]);
		let RCVMultiplier = this.mult(data[2]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${firstAttribute} & ${secondAttribute} Attribute cards ${boost}.`;
	}

	public LSBlobScalingAtkBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 1, 100, 0, 0]);
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4] || minCount;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		return [1, maxATKMultiplier, 1, 1];
	}

	public LSBlobScalingAtkBoost(): string {
		let data = this.mergeDefaults([0, 1, 100, 0, 0]);
		let attribute = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attribute, 'or');
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4] || minCount;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		if (minATKMultiplier === maxATKMultiplier || !ATKStep) {
			return `All Attribute cards ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs.`;
		} else {
			return `All Attribute cards ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs. ATK x${ATKStep} for each additional connected orb, up to ATK x${maxATKMultiplier} at ${maxCount} connected orbs.`;
		}
	}

	public LSAttrOrTypeStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSAttrOrTypeStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost}.`;
		}

		return 'None';
	}

	public LSLowHpConditionalAttrTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = data.length > 4 ? this.multiFloor(data[4]) : 1;

		return [1, ATKMultiplier, RCVMultiplier, 1];
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
			return `${attributeString} Attribute cards ${boost} when HP is less than ${threshold}%.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is less than ${threshold}%.`;
		}

		return 'None';
	}

	public LSHighHpConditionalAttrTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = data.length > 4 ? this.multiFloor(data[4]) : 1;

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSHighHpConditionalAttrTypeAtkRcvBoost(): string {
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
			return `${attributeString} Attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		return 'None';
	}

	public LSAttrComboScalingAtkBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0, 100, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3], data[4]]);
		let minMatch = data[5];
		let maxMatch = attributes.length;
		let minATKMultiplier = this.mult(data[6]);
		let ATKStep = this.mult(data[7]);
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxMatch - minMatch);

		return [1, maxATKMultiplier, 1, 1];
	}

	public LSAttrComboScalingAtkBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0, 100, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3], data[4]]);
		let singleAttribute = [attributes[0]];
		let attributeString = this.toAttributeString(attributes);
		let singleAttributeString = this.toAttributeString(singleAttribute);
		let minMatch = data[5];
		let maxMatch = attributes.length;
		let minATKMultiplier = this.mult(data[6]);
		let ATKStep = this.mult(data[7]);
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxMatch - minMatch);

		if (ATKStep > 0) {
			return `All Attribute cards ATK x${minATKMultiplier} when reaching ${minMatch} ${singleAttributeString} combos. Attack multiplier increases by ${ATKStep} for each additional combo, up to ATK x${maxATKMultiplier} when reaching ${maxMatch} ${singleAttributeString} combos.`;
		} else {
			return `All Attribute cards ATK x${minATKMultiplier} when reaching ${minMatch} ${singleAttributeString} combos.`;
		}
	}

	public LSTeamUnitConditionalStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 100, 100, 100]);
		let HPMultiplier = this.multiFloor(data[5]);
		let ATKMultiplier = this.multiFloor(data[6]);
		let RCVMultiplier = this.multiFloor(data[7]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSTeamUnitConditionalStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 100, 100, 100]);
		let ids = this.listConcat([data[0], data[1], data[2], data[3], data[4]]);
		let HPMultiplier = this.multiFloor(data[5]);
		let ATKMultiplier = this.multiFloor(data[6]);
		let RCVMultiplier = this.multiFloor(data[7]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `All Attribute cards ${boost} when {{${ids}}} in the same team.`;
	}

	public LSMultiAttrTypeStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 0]);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
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
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost}.`;
		}

		if (shield > 0) {
			return `${shield}% ${reductionAttributeString} damage reduction.`;
		}

		return 'None';
	}

	public LSLowHpAttrAtkStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 0, 0]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;

		return [1, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
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
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost} when HP is ${this.stringifyHPCondition(
				threshold,
				false,
				true
			)}%.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is ${this.stringifyHPCondition(
				threshold,
				false,
				true
			)}%.`;
		}

		return 'None';
	}

	public LSHighHpAttrTypeStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 0, 0]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;

		return [1, ATKMultiplier, RCVMultiplier, shield];
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
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data.length > 6 ? data[6] : 0;
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} when HP is ${this.stringifyHPCondition(threshold)}.`;
		}

		return 'None';
	}

	public LSSkillUsedAttrTypeAtkRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100]);
		let ATKMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);

		return [1, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSSkillUsedAttrTypeAtkRcvBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let ATKMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost} on the turn a skill is used. (Multiple skills will not stack).`;
		}

		return 'None';
	}

	public LSMultiAttrConditionalStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 100, 100, 0, 100, 100, 100]);

		let firstHPMultiplier = this.multiFloor(data[1]);
		let firstATKMultiplier = this.multiFloor(data[2]);
		let firstRCVMultiplier = this.multiFloor(data[3]);

		let secondHPMultiplier = this.multiFloor(data[5]);
		let secondATKMultiplier = this.multiFloor(data[6]);
		let secondRCVMultiplier = this.multiFloor(data[7]);

		return [
			firstHPMultiplier * secondHPMultiplier,
			firstATKMultiplier * secondATKMultiplier,
			firstRCVMultiplier * secondRCVMultiplier,
			1,
		];
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

		return `${firstAttributeString} Attribute cards ${firstBoost}. ${secondAttributeString} Attribute cards ${secondBoost}.`;
	}

	public LSMultiTypeConditionalStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 100, 100, 0, 100, 100, 100]);

		let firstHPMultiplier = this.multiFloor(data[1]);
		let firstATKMultiplier = this.multiFloor(data[2]);
		let firstRCVMultiplier = this.multiFloor(data[3]);

		let secondHPMultiplier = this.multiFloor(data[5]);
		let secondATKMultiplier = this.multiFloor(data[6]);
		let secondRCVMultiplier = this.multiFloor(data[7]);

		return [
			firstHPMultiplier * secondHPMultiplier,
			firstATKMultiplier * secondATKMultiplier,
			firstRCVMultiplier * secondRCVMultiplier,
			1,
		];
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

		return `${firstTypeString} Attribute cards ${firstBoost}. ${secondTypeString} Attribute cards ${secondBoost}.`;
	}

	public LSHpMultiConditionalAtkBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 0, 0, 100, 100]);
		let firstATKMultiplier = this.mult(data[4]) || 1;
		let secondATKMultiplier = this.mult(data[7]) || 1;

		return [1, Math.max(firstATKMultiplier, secondATKMultiplier), 1, 1];
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

	public LSRankXpBoostMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSRankXpBoost(): string {
		let data = this.mergeDefaults([0]);
		let multiplier = this.mult(data[0]);

		return `Get x${multiplier} experience after a battle.`;
	}

	public LSHealMatchRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([100]);
		let RCVMultiplier = this.mult(data[0]);

		return [1, 1, RCVMultiplier, 1];
	}

	public LSHealMatchRcvBoost(): string {
		let data = this.mergeDefaults([100]);
		let RCVMultiplier = this.mult(data[0]);

		return `RCV x${RCVMultiplier} when matching exactly 4 connected heart orbs.`;
	}

	public LSEnhanceOrbMatch5Multiplier(): number[] {
		let data = this.mergeDefaults([100]);
		let ATKMultiplier = this.mult(data[1]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSEnhanceOrbMatch5(): string {
		let data = this.mergeDefaults([100]);
		let ATKMultiplier = this.mult(data[1]);

		return `Matched attribute ATK x${ATKMultiplier} when matching exactly 5 connected orbs with at least 1 enhanced orb.`;
	}

	public LSHeartCrossMultiplier(): number[] {
		let data = this.mergeDefaults([100, 100, 0]);
		let ATKMultiplier = this.multiFloor(data[0]);
		let RCVMultiplier = this.multiFloor(data[1]);
		let shield = data[2];

		return [1, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
	}

	public LSHeartCross(): string {
		let data = this.mergeDefaults([100, 100, 0]);
		let ATKMultiplier = this.multiFloor(data[0]);
		let RCVMultiplier = this.multiFloor(data[1]);
		let shield = data[2];
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier, shield);

		return `${boost} after matching Heal orbs in a cross formation.`;
	}

	public LSMultiboostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSMultiboost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);
		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${boost} in cooperation mode.`;
	}

	public LSAttrCrossMultiplier(): number[] {
		// potentially inaccurate
		let data = this.params;
		let group = {};
		let result = [];

		let multipliers = [];

		data.forEach((datum, index) => {
			if (index % 2 === 0) return;
			multipliers.push(datum);
		});

		let maxCrossMultiplier = Math.max(...multipliers); // in case different crosses have diff colors, we're interested in the max
		// let's assume there are multiple colors that can achieve this max multiplier and we can make 3 crosses of these attributes on 6x5
		return [1, 0, 1, 1];
	}

	public LSAttrCross(): string {
		let data = this.params;
		let group = {};
		let result = [];

		data.forEach((datum, index) => {
			if (index % 2 === 0) return; //We will process all the data in pairs

			let multiplier = datum;
			let attribute = data[index - 1];

			group[multiplier] = group[multiplier] === undefined ? [attribute] : [attribute, ...group[multiplier]];
		});

		for (let multiplierString in group) {
			let attributes = group[multiplierString];
			let attributeString = this.toAttributeString(attributes, 'or');
			let multiplier = this.mult(Number(multiplierString));

			result.push(`ATK x${multiplier} for clearing each ${attributeString} orbs in a cross formation.`);
		}

		return result.length === 0 ? '' : result.join(' ');
	}

	public LSMatchXOrMoreOrbsMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);

		let HPMultiplier = this.multiFloor(data[4]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSMatchXOrMoreOrbs(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let minMatch = data[0];
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);
		let HPMultiplier = this.multiFloor(data[4]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `Can no longer clear ${minMatch} or less connected orbs. ${attributeString} Attribute cards ${boost}`;
		}

		if (types.length > 0) {
			return `Can no longer clear ${minMatch} or less connected orbs. ${typeString} Attribute cards ${boost}`;
		}

		return 'None';
	}
	public LSAdvancedBlobMatchMultiplier(): number[] {
		let data = this.mergeDefaults([0, 1, 100, 0, 0]);

		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4] || minCount;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		return [1, maxATKMultiplier, 1, 1];
	}

	public LSAdvancedBlobMatch(): string {
		let data = this.mergeDefaults([0, 1, 100, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minCount = data[1];
		let minATKMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let maxCount = data[4] || minCount;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCount - minCount);

		if (minATKMultiplier === maxATKMultiplier || !ATKStep) {
			return `ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs.`;
		} else {
			return `ATK x${minATKMultiplier} when simultaneously clearing ${minCount} connected ${attributeString} orbs. ATK multiplier increases by ${ATKStep} for each additional orb, up to ATK x${maxATKMultiplier} at ${maxCount} connected orbs.`;
		}
	}

	public LSSevenBySix(): string {
		return `Change the board to 7x6 size.`;
	}

	public LSSevenBySixMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSNoSkyfallBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 0]);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data[6];

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
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
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let shield = data[6];
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier, shield);

		if (attributes.length > 0) {
			return `No skyfall matches. ${attributeString} Attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `No skyfall matches. ${typeString} Type cards ${boost}.`;
		}

		return `No skyfall matches.`;
	}

	public LSAttrComboConditionalAtkRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 100, 100, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let minMatch = data[4];
		let minATKMultiplier = this.mult(data[5]);
		let minRCVMultiplier = this.mult(data[6]);
		let ATKStep = this.mult(data[7]);
		let RCVStep = ATKStep;
		let maxMatch = attributes.length;
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxMatch - minMatch);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxMatch - minMatch);

		return [1, maxATKMultiplier, maxRCVMultiplier, 1];
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

		return `All Attribute cards ATK x${maxATKMultiplier}, RCV x${maxRCVMultiplier} when reaching ${attributeString} combos.`;
	}

	public LSRainbowAtkRcvMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 0, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
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

		return [1, maxATKMultiplier === 0 ? 1 : maxATKMultiplier, maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier, 1];
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

		let stepBoost = this.stringifyScaleBoost(ATKStep === 0 ? 1 : ATKStep, RCVStep === 0 ? 1 : RCVStep);
		let minBoost = this.stringifyBoost(
			1,
			minATKMultiplier === 0 ? 1 : minATKMultiplier,
			minRCVMultiplier === 0 ? 1 : minRCVMultiplier
		);
		let maxBoost = this.stringifyBoost(
			1,
			maxATKMultiplier === 0 ? 1 : maxATKMultiplier,
			maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier
		);

		if (ATKStep !== 0 || RCVStep !== 0) {
			return `All Attribute cards ${minBoost} when attacking with ${minAttributesRequired} of following orb types: ${attributeString}. ${stepBoost} for each additional orb type, up to ${maxBoost} for ${maxAttributesRequired} matches.`;
		} else {
			return `All Attribute cards ${minBoost} when attacking with ${minAttributesRequired} of following orb types: ${attributeString}.`;
		}
	}

	public LSAtkRcvComboScaleMultiplier(): number[] {
		let data = this.mergeDefaults([1, 100, 100, 0, 0, 0]);
		let minCombosRequired = data[0];
		let minATKMultiplier = this.mult(data[1]);
		let minRCVMultiplier = this.mult(data[2]);
		let ATKStep = this.mult(data[3]);
		let RCVStep = this.mult(data[4]);
		let maxCombosRequired = data[5];
		let maxATKMultiplier = minATKMultiplier + ATKStep * (maxCombosRequired - minCombosRequired);
		let maxRCVMultiplier = minRCVMultiplier + RCVStep * (maxCombosRequired - minCombosRequired);

		return [1, maxATKMultiplier === 0 ? 1 : maxATKMultiplier, maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier, 1];
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

		let stepBoost = this.stringifyScaleBoost(ATKStep === 0 ? 1 : ATKStep, RCVStep === 0 ? 1 : RCVStep);
		let minBoost = this.stringifyBoost(
			1,
			minATKMultiplier === 0 ? 1 : minATKMultiplier,
			minRCVMultiplier === 0 ? 1 : minRCVMultiplier
		);
		let maxBoost = this.stringifyBoost(
			1,
			maxATKMultiplier === 0 ? 1 : maxATKMultiplier,
			maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier
		);

		if (ATKStep !== 0 || RCVStep !== 0) {
			return `${minBoost} when reaching ${minCombosRequired} combos. ${stepBoost} for each additional combo, up to ${maxBoost} at ${maxCombosRequired} combos.`;
		} else {
			return `${minBoost} when reaching ${minCombosRequired} combos.`;
		}
	}

	public LSBlobAtkRcvBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 0, 0, 0]);
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

		return [1, maxATKMultiplier === 0 ? 1 : maxATKMultiplier, maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier, 1];
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

		let stepBoost = this.stringifyScaleBoost(ATKStep === 0 ? 1 : ATKStep, RCVStep === 0 ? 1 : RCVStep);
		let minBoost = this.stringifyBoost(
			1,
			minATKMultiplier === 0 ? 1 : minATKMultiplier,
			minRCVMultiplier === 0 ? 1 : minRCVMultiplier
		);
		let maxBoost = this.stringifyBoost(
			1,
			maxATKMultiplier === 0 ? 1 : maxATKMultiplier,
			maxRCVMultiplier === 0 ? 1 : maxRCVMultiplier
		);

		if (ATKStep !== 0 || RCVStep !== 0) {
			return `All Attribute cards ${minBoost} when simultaneously clearing ${minCount} connected ${attributeString} orbs. ${stepBoost} for each additional orb, up to ${maxBoost} at ${maxCount} connected orbs.`;
		} else {
			return `All Attribute cards ${minBoost} when simultaneously clearing ${minCount} connected ${attributeString} orbs.`;
		}
	}

	public LSComboMultPlusShieldMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 0]);

		let ATKMultiplier = this.mult(data[1]);
		let shield = data[2];

		return [1, ATKMultiplier, 1, 1 - this.mult(shield)];
	}

	public LSComboMultPlusShield(): string {
		let data = this.mergeDefaults([0, 100, 0]);
		let combosRequired = data[0];
		let ATKMultiplier = this.mult(data[1]);
		let shield = data[2];

		return `All Attribute cards ATK x${ATKMultiplier}, ${shield}% all damage reduction when reaching ${combosRequired} combos.`;
	}

	public LSRainbowMultPlusShieldMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 0]);

		let ATKMultiplier = this.mult(data[2]);
		let shield = data[3];

		return [1, ATKMultiplier, 1, 1 - this.mult(shield)];
	}

	public LSRainbowMultPlusShield(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let attributesRequired = data[1];
		let ATKMultiplier = this.mult(data[2]);
		let shield = data[3];
		let boost = this.stringifyBoost(1, ATKMultiplier, 1, shield);

		return `All Attribute cards ${boost} when attacking with ${attributesRequired} of ${attributeString} orb types at the same time.`;
	}

	public LSMatchAttrPlusShieldMultiplier(): number[] {
		let data = this.params;
		let ATKMultiplier = this.mult(data[5]);
		let shield = data[6];

		return [1, ATKMultiplier, 1, 1 - this.mult(shield)];
	}

	public LSMatchAttrPlusShield(): string {
		let data = this.params;
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);
		let attributeString = this.toAttributeString(attributes);
		let attributesRequired = data[4];
		let ATKMultiplier = this.mult(data[5]);
		let shield = data[6];

		return `All Attribute cards ATK x${ATKMultiplier}, ${shield}% all damage reduction when attacking with ${attributesRequired} ${attributeString} combos at the same time.`;
	}

	public LSCollabConditionalBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, null, null, 100, 100, 100]);
		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSCollabConditionalBoost(): string {
		let data = this.mergeDefaults([0, null, null, 100, 100, 100]);
		let collabId = data[0];
		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return `HP x${HPMultiplier}, ATK x${ATKMultiplier}, RCV ${RCVMultiplier} when all subs are from ${MONSTER_COLLABS[collabId]} Collab.`;
	}

	public LSOrbRemainingMultiplierMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100, 0, 100, 0]);

		let orbCount = data[5];
		let minATKMultiplier = this.multiFloor(data[3]);
		let baseATKMultiplier = this.mult(data[6]);
		let bonusATK = this.mult(data[7]);
		let maxBonusATK = baseATKMultiplier + bonusATK * orbCount;
		let HPMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let ATKMultiplier = minATKMultiplier * maxBonusATK;

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
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
		let ATKMultiplier = minATKMultiplier * maxBonusATK; //What is this?

		let boost = this.stringifyBoost(HPMultiplier, minATKMultiplier, RCVMultiplier);

		let result = [];
		result.push('No skyfall combos.');

		if (boost) result.push(boost);

		result.push(`ATK x${baseATKMultiplier} when there are ${orbCount} or less orbs on the board after matching.`);

		if (baseATKMultiplier !== maxBonusATK) {
			result.push(`ATK multiplier increases by 1 for every missing orb afterwards, up to ATK x${maxBonusATK}.`);
		}

		return result.join(' ');
	}

	public LSFixedMovementTimeMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let time = data[0];

		//@TODO: This needs to be overhauled, just accept the value here if it != 0.
		if (time === 0) {
			//Ignore this case; bad skill
			return [0, 0, 0, 0]; // this should fairly obviously indicate that something's wrong
		}

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
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
			return 'None';
		}

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `Fixed orb movement time at ${time} seconds. ${attributeString} Attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `Fixed orb movement time at ${time} seconds. ${typeString} Type cards ${boost}.`;
		}

		return `Fixed orb movement time at ${time} seconds.`;
	}

	public LSRowMatcHPlusDamageReductionMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 0]);

		let ATKMultiplier = this.multiFloor(data[2]);
		let shield = data[3];

		return [1, ATKMultiplier, 1, 1 - this.mult(shield)];
	}

	public LSRowMatcHPlusDamageReduction(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let count = data[1];
		let ATKMultiplier = this.multiFloor(data[2]);
		let shield = data[3];
		let boost = this.stringifyBoost(1, ATKMultiplier, 1, shield);

		return `${this.capitalizeFirstLetter(boost)} when matching ${count}+ ${attributeString} orbs.`;
	}

	public LSDualThresholdBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 0, 0, 100, 100]);

		//More than x%
		let firstATKMultiplier = this.mult(data[3]) || 1;
		let firstRCVMultiplier = 1;
		let firstShield = data[4];

		//Less than x%
		let secondATKMultiplier = this.mult(data[6]);
		let secondRCVMultiplier = this.mult(data[7]);
		let secondShield = 0;

		let ATKMultiplier = firstATKMultiplier > secondATKMultiplier ? firstATKMultiplier : secondATKMultiplier;
		let RCVMultiplier = firstRCVMultiplier > secondRCVMultiplier ? firstRCVMultiplier : secondRCVMultiplier;
		let shield = firstShield > secondShield ? firstShield : secondShield;

		return [1, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
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

		let ATKMultiplier = firstATKMultiplier > secondATKMultiplier ? firstATKMultiplier : secondATKMultiplier;
		let RCVMultiplier = firstRCVMultiplier > secondRCVMultiplier ? firstRCVMultiplier : secondRCVMultiplier;
		let shield = firstShield > secondShield ? firstShield : secondShield;

		if (firstThreshold && !secondThreshold) {
			return `All Attribute cards ${firstBoost} when HP ${this.stringifyHPCondition(firstThreshold, true)}.`;
		} else if (secondThreshold && !firstThreshold) {
			return `All Attribute cards ${secondBoost} when HP ${this.stringifyHPCondition(secondThreshold, false)}.`;
		} else if (firstThreshold && secondThreshold) {
			return `All Attribute cards ${firstBoost} when HP ${this.stringifyHPCondition(
				firstThreshold,
				true
			)}. All Attribute cards ${secondBoost} when HP ${this.stringifyHPCondition(secondThreshold, false)}.`;
		}

		return 'None';
	}

	public LSBonusTimeStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSBonusTimeStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 0, 100, 100, 100]);
		let time = this.mult(data[0]);
		let attributes = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[2]);
		let typeString = this.toTypeString(types);

		let HPMultiplier = this.multiFloor(data[3]);
		let ATKMultiplier = this.multiFloor(data[4]);
		let RCVMultiplier = this.multiFloor(data[5]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `${attributeString} Attribute cards ${boost}. Increases time limit of orb movement by ${time} seconds.`;
		}

		if (types.length > 0) {
			return `${typeString} Type cards ${boost}. Increases time limit of orb movement by ${time} seconds.`;
		}

		return `Increases time limit of orb movement by ${time} seconds.`;
	}

	public LSSevenBySixStatBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSSevenBySixStatBoost(): string {
		let data = this.mergeDefaults([0, 0, 100, 100, 100]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let types = this.getTypesFromBinary(data[1]);
		let typeString = this.toTypeString(types);

		let HPMultiplier = this.multiFloor(data[2]);
		let ATKMultiplier = this.multiFloor(data[3]);
		let RCVMultiplier = this.multiFloor(data[4]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		if (attributes.length > 0) {
			return `Change the board to 7x6 size. ${attributeString} Attribute cards ${boost}.`;
		}

		if (types.length > 0) {
			return `Change the board to 7x6 size. ${typeString} Type cards ${boost}.`;
		}

		return 'None';
	}

	public LSBlobMatchBonusComboMultiplier(): number[] {
		let data = this.mergeDefaults([0, 0, 100, 0]);

		let ATKMultiplier = this.multiFloor(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSBlobMatchBonusCombo(): string {
		let data = this.mergeDefaults([0, 0, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minMatch = data[1];
		let bonusCombo = data[3];
		let ATKMultiplier = this.multiFloor(data[2]);

		if (ATKMultiplier !== 1) {
			return `All Attribute cards ATK x${ATKMultiplier} and +${bonusCombo} combo when matching ${minMatch}+ connected ${attributeString} orbs.`;
		} else {
			return `+${bonusCombo} combo when matching ${minMatch}+ connected ${attributeString} orbs.`;
		}
	}

	public LSLMatchBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 100, 0]);
		let ATKMultiplier = this.multiFloor(data[1]);
		let RCVMultiplier = this.multiFloor(data[2]);
		let shield = data[3];

		return [1, ATKMultiplier, RCVMultiplier, 1 - this.mult(shield)];
	}

	public LSLMatchBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes, 'or');
		let ATKMultiplier = this.multiFloor(data[1]);
		let RCVMultiplier = this.multiFloor(data[2]);
		let shield = data[3];
		let boost = this.stringifyBoost(1, ATKMultiplier, RCVMultiplier, shield);

		return `All Attribute cards cards ${boost} when matching ${attributeString} orbs in a L formation.`;
	}

	public LSAttrMatchBonusComboMultiplier(): number[] {
		let data = this.params;

		let ATKMultiplier = this.multiFloor(data[2]);

		return [1, ATKMultiplier, 1, 1];
	}

	public LSAttrMatchBonusCombo(): string {
		let data = this.params;
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let minAttributesRequired = data[1];
		let bonusCombo = data[3];
		let ATKMultiplier = this.multiFloor(data[2]);

		if (ATKMultiplier !== 1) {
			return `All Attribute cards ATK x${ATKMultiplier} and +${bonusCombo} combo when attacking with ${minAttributesRequired} of ${attributeString} orbs at the same time.`;
		} else {
			return `+${bonusCombo} combo when attacking with ${minAttributesRequired} of ${attributeString} orbs at the same time.`;
		}
	}

	public LSDisablePoisonEffectsMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSDisablePoisonEffects(): string {
		return `Gain immunity to poison damage.`;
	}

	public LSHealMatchBoostUnbindMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 0, 0]);

		let ATKMultiplier = this.multiFloor(data[1]);
		let shield = data[2];

		return [1, ATKMultiplier, 1, shield];
	}

	public LSHealMatchBoostUnbind(): string {
		let data = this.mergeDefaults([0, 100, 0, 0]);
		let healAmount = data[0];
		let unbindAmount = data[3];
		let ATKMultiplier = this.multiFloor(data[1]);
		let shield = data[2];
		let boost = this.stringifyBoost(1, ATKMultiplier, 1, shield);

		return `All Attribute cards ${boost} when recovering ${this.numberWithCommas(healAmount)}+ HP with Heal orbs.`;
	}

	public LSRainbowBonusDamageMultiplier(): number[] {
		return [1, 1, 1, 1];
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

	public LSBlobBonusDamageMultiplier(): number[] {
		return [1, 1, 1, 1];
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

	public LSColorComboBonusDamageMultiplier(): number[] {
		return [1, 1, 1, 1];
	}

	public LSColorComboBonusDamage(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0]);
		let attributes = this.getAttributesFromMultipleBinary([data[0], data[1], data[2], data[3]]);

		let attributeString = this.toAttributeString(attributes, 'and');
		let minCombosRequired = data[4];
		let bonusDamage = data[5];

		return `${this.numberWithCommas(
			bonusDamage
		)} damage to all enemies, ignoring enemy element and defense when attack with ${attributeString} combos at the same time.`;
	}

	public LSGroupConditionalBoostMultiplier(): number[] {
		let data = this.mergeDefaults([0, 100, 100, 100]);

		let HPMultiplier = this.multiFloor(data[1]);
		let ATKMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);

		return [HPMultiplier, ATKMultiplier, RCVMultiplier, 1];
	}

	public LSGroupConditionalBoost(): string {
		let data = this.mergeDefaults([0, 100, 100, 100]);
		let groupId = data[0];
		let HPMultiplier = this.multiFloor(data[1]);
		let ATKMultiplier = this.multiFloor(data[2]);
		let RCVMultiplier = this.multiFloor(data[3]);
		let boost = this.stringifyBoost(HPMultiplier, ATKMultiplier, RCVMultiplier);

		return `${boost} when all subs are ${MONSTER_GROUPS[groupId]}.`;
	}

	public LSColorComboBonusComboMultiplier(): number[] {
		return [1, 1, 1, 1];
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
