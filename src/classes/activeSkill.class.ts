//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/active_skill_info.py
import { ACTIVESKILL_MAP } from './activeSkill.map';
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { MONSTER_TYPES } from '../shared/monster.types';
import { AWAKENINGS as MONSTER_AWAKENS } from '../shared/monster.awakens';
import { MonsterParser } from '../classes/monsterParser.class';
const { skill: SKILL_DATA } = require('../raw/download_skill_data.json');

export class ActiveSkill {
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

	public getDetailDescription(): string | null {
		let functionToCall = ACTIVESKILL_MAP[this.type.toString()];
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

	private toAttributeString(attributes: number[] | number, connector: string = '&'): string {
		if (attributes.toString().length === 0 || (Array.isArray(attributes) && attributes.length === 0)) return '';

		if (!Array.isArray(attributes)) attributes = [attributes];
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

	private toTypeString(types: number[] | number, connector: string = '&'): string {
		if (types.toString().length === 0 || (Array.isArray(types) && types.length === 0)) return '';

		if (!Array.isArray(types)) types = [types];

		let typeArray: any[] = types.sort((a, b) => a - b); //Sort it
		typeArray = typeArray.map((type) => MONSTER_TYPES[type]);

		return typeArray.length > 1 ? typeArray.join(', ').replace(/,([^,]*)$/, ` ${connector}$1`) : typeArray[0];
	}

	private toAwakenString(awakens: number[] | number, connector: string = 'and'): string {
		if (awakens.toString().length === 0 || (Array.isArray(awakens) && awakens.length === 0)) return '';

		if (!Array.isArray(awakens)) awakens = [awakens];

		let awakenArray: any[] = awakens.sort((a, b) => a - b); //Sort it
		awakenArray = awakenArray.map((awaken) => MONSTER_AWAKENS[awaken]);

		return awakenArray.length > 1 ? awakenArray.join(', ').replace(/,([^,]*)$/, ` ${connector}$1`) : awakenArray[0];
	}

	private getRowPositionFromBinary(dec: number, connector: string = 'and'): string {
		if (dec === 0) return '';

		let binary = this.decimalToBinary(dec).padStart(5, '0');
		let rowPosition = [];

		//Refer 00000 - 00001 = top row, 00010 = second row and so on
		if (binary[0] === '1') rowPosition.push('bottom'); //Bottom
		if (binary[1] === '1') rowPosition.push('2nd from the bottom'); //4th from top
		if (binary[2] === '1') rowPosition.push('the middle'); //3rd from top
		if (binary[3] === '1') rowPosition.push('2nd from the top'); //2nd from top
		if (binary[4] === '1') rowPosition.push('top'); //Top row

		//Reverse to get top as the first element
		return rowPosition
			.reverse()
			.join(', ')
			.replace(/,([^,]*)$/, ` ${connector}$1`);
	}

	private getColumnPositionFromBinary(dec: number, connector: string = 'and'): string {
		if (dec === 0) return '';

		let binary = this.decimalToBinary(dec).padStart(6, '0');
		let columnPosition = [];

		//Refer 000000 - 000001 = rightmost, 1000000 = leftmost
		if (binary[0] === '1') columnPosition.push('rightmost'); //Right
		if (binary[1] === '1') columnPosition.push('2nd from the right'); //2nd from the right
		if (binary[2] === '1') columnPosition.push('3rd from the right'); //3rd from the right
		if (binary[3] === '1') columnPosition.push('3rd from the left'); //4th from right
		if (binary[4] === '1') columnPosition.push('2nd from the left'); //5th from right
		if (binary[5] === '1') columnPosition.push('leftmost'); //6th from right

		//Reverse to get top as the first element
		return columnPosition
			.reverse()
			.join(', ')
			.replace(/,([^,]*)$/, ` ${connector}$1`);
	}

	private multiFloor(stat: number) {
		return stat !== 0 ? stat / 100 : 1;
	}

	private listConcat(list: number[]) {
		return list.filter((id) => id > 0);
	}

	private numberWithCommas = (x: number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	public testOutput(): string {
		let functionToCall = ACTIVESKILL_MAP[this.type];
		return typeof this[functionToCall] === 'function' ? this[functionToCall].call(this) : null;
	}

	public ASMultiplierMultiTargetAttrNuke(): string {
		//CANNOT DEVELOP/TEST. CANNOT FIND THE MONSTER WITH SKILL TYPE 0
		let data = this.mergeDefaults([0, 100]);
		let attribute = [data[0]];
		let attributeString = this.toAttributeString(attribute);
		let multiplier = this.mult(data[1]);

		return `Inflict ${attributeString} damage equal to ATK x${multiplier} to all enemies. Affected by enemy element and defense.`;
	}

	public ASFixedMultiTargetAttrNuke(): string {
		let data = this.mergeDefaults([0, 1]);
		let attribute = [data[0]];
		let attributeString = this.toAttributeString(attribute);
		let damage = this.mult(data[1]);

		return `Inflict ${this.numberWithCommas(damage)} ${attributeString} damage on all enemies.`;
	}

	public ASMultiplierSelfAttrSingleTargetNuke(): string {
		let data = this.mergeDefaults([1, -1]);
		let multiplier = this.mult(data[0]);

		return `Inflict damage that has the same Attribute as this monster's original Attributes equal to ATK x${multiplier} to all enemies. Affected by enemy element and defense.`;
	}

	public ASDamageReduction(): string {
		let data = this.mergeDefaults([1, 0]);
		let duration = data[0];
		let shield = data[1];

		return `${shield}% damage reduction for ${duration} turns.`;
	}

	public ASPoisonEnemies(): string {
		let data = this.mergeDefaults([1]);
		let multiplier = this.mult(data[0]);

		return `Inflict Poison damage equal to ATK x${multiplier} to all enemies every turn. Ignore enemy element and defense.`;
	}

	public ASFreeOrbMovement(): string {
		let data = this.mergeDefaults([0]);
		let duration = this.mult(data[0]);

		return `Move orbs freely for ${duration} seconds.`;
	}

	public ASGravity(): string {
		let data = this.mergeDefaults([0]);
		let percentage = data[0];

		return `Reduce all enemies' HP by ${percentage}%. Ignore enemy element and defense.`;
	}

	public ASHpRecoverFromRcv(): string {
		let data = this.mergeDefaults([0]);
		let amount = data[0];

		return `Heal ${amount}x this card's RCV.`;
	}

	public ASHpRecoverStatic(): string {
		let data = this.mergeDefaults([0]);
		let amount = data[0];

		return `Heal ${amount} HP`;
	}

	public ASOneAttrtoOneAttr(): string {
		let data = this.mergeDefaults([0, 0]);
		let fromAttribute = data[0];
		let fromAttributeString = this.toAttributeString(fromAttribute);
		let toAttribute = data[1];
		let toAttributeString = this.toAttributeString(toAttribute);

		return `Change ${fromAttributeString} orbs to ${toAttributeString} orbs.`;
	}

	public ASOrbRefresh(): string {
		return 'Replace all orbs';
	}

	public ASDelay(): string {
		let data = this.mergeDefaults([0]);
		let turn = data[0];

		return `Delay ${turn} turns to all enemies.`;
	}

	public ASDefenseBreak(): string {
		let data = this.mergeDefaults([0, 0]);
		let duration = data[0];
		let amount = data[1];

		return `Reduce enemies' defense by ${amount}% for ${duration} turn. Effects carry forward on sweep.`;
	}

	public ASTwoAttrtoOneTwoAttr(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);

		let firstFromAttribute = data[0];
		let firstFromAttributeString = this.toAttributeString(firstFromAttribute);
		let firstToAttribute = data[1];
		let firstToAttributeString = this.toAttributeString(firstToAttribute);

		let secondFromAttribute = data[2];
		let secondFromAttributeString = this.toAttributeString(secondFromAttribute);
		let secondToAttribute = data[3];
		let secondToAttributeString = this.toAttributeString(secondToAttribute);

		return `Change ${firstFromAttributeString} orbs to ${firstToAttributeString} orbs, ${secondFromAttributeString} orbs to ${secondToAttributeString} orbs.`;
	}

	public ASDamageVoid(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let duration = data[0];
		let attribute = data[1];
		let shield = data[2];

		return `${shield}% ${attribute} damage for ${duration} turn.`;
	}

	public ASAtkBasedNuke(): string {
		let data = this.mergeDefaults([0, 0]);
		let damageAmount = this.mult(data[0]);
		let RCVAmount = this.mult(data[1]);

		return `Inflict damage equal to ATK x${damageAmount} to 1 enemy, and drain ${RCVAmount}% of the damage you dealt. Affected by enemy element and defense.`;
	}

	public ASSingleTargetTeamAttrNuke(): string {
		let data = this.mergeDefaults([]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let amount = this.mult(data[1]);

		return `Inflict a ${amount}x ${attributeString} attack on 1 enemy.`;
	}

	public ASAttrOnAttrNuke(): string {
		let data = this.mergeDefaults([0, 0, 1]);
		let enemyAttribute = data[0];
		let enemyAttributeString = this.toAttributeString(enemyAttribute);
		let attackAttribute = data[1];
		let attackAttributeString = this.toAttributeString(attackAttribute);
		let amount = data[2];

		return `Deal ${this.numberWithCommas(
			amount
		)} ${attackAttributeString} damage to all ${enemyAttributeString} enemies. Affected by enemy element and defense.`;
	}

	public ASAttrBurst(): string {
		let data = this.mergeDefaults([0, 0]);
		let duration = data[0];
		let attribute = data[1];
		let attributeString = this.toAttributeString(attribute);
		let multiplier = this.mult(data[2]);

		if (attribute === 5) {
			return `All Attribute cards RCV x${multiplier} for ${duration} turns.`;
		} else {
			return `${attributeString} Attribute ATK x${multiplier} for ${duration} turns.`;
		}
	}

	public ASMassAttack(): string {
		let data = this.mergeDefaults([0]);
		let duration = data[0];

		return `All attacks become mass attacks for ${duration} turns.`;
	}

	public ASOrbEnhance(): string {
		let data = this.params;
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);

		return `Enhance ${attributeString} orbs.`;
	}

	public ASTrueDamageNuke(): string {
		let data = this.mergeDefaults([0]);
		let amount = data[0];

		return `Deal ${this.numberWithCommas(amount)} damage to 1 enemy. Ignore enemy element and defense.`;
	}

	public ASTrueDamageNukeAll(): string {
		let data = this.mergeDefaults([0]);
		let amount = data[0];

		return `Deal ${this.numberWithCommas(amount)} damage to all enemies. Ignore enemy element and defense.`;
	}

	public ASAttrMassAttack(): string {
		let data = this.mergeDefaults([0, 1, 1]);
		let atrribute = data[0];
		let attributeString = this.toAttributeString(atrribute);
		let minATKMultiplier = this.mult(data[1]);
		let maxATKMultiplier = this.mult(data[2]);

		return `Inflict a ${minATKMultiplier}x-${maxATKMultiplier}x ${attributeString} attack on all enemies. Affected by enemy element and defense.`;
	}

	public ASAttrRandomNuke(): string {
		let data = this.mergeDefaults([0, 1, 1]);
		let atrribute = data[0];
		let attributeString = this.toAttributeString(atrribute);
		let minATKMultiplier = this.mult(data[1]);
		let maxATKMultiplier = this.mult(data[2]);

		return `Inflict a ${minATKMultiplier}x-${maxATKMultiplier}x ${attributeString} attack on 1 enemy. Affected by enemy element and defense.`;
	}

	public ASCounterattack(): string {
		let data = this.mergeDefaults([1, 1, 0]);
		let duration = data[0];
		let multiplier = this.mult(data[1]);
		let attribute = data[2];
		let attributeString = this.toAttributeString(attribute);

		return `${multiplier}x ${attributeString} counterattack for ${duration} turns.`;
	}

	public ASBoardChange(): string {
		let data = this.mergeDefaults([]);
		let toAttributes = [];

		for (let i = 0; i < data.length; i++) {
			if (data[i] === -1) break;
			toAttributes.push(data[i]);
		}

		let toAttributeString = this.toAttributeString(toAttributes);

		return `Change all orbs to ${toAttributeString} orbs.`;
	}

	public ASHpConditionalTargetNuke(): string {
		let data = this.mergeDefaults([0, 1, 1, 0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let minMultiplier = this.mult(data[1]);
		let maxMultiplier = this.mult(data[2]);
		let remainingHPPercentage = data[3];

		if (remainingHPPercentage === 0) {
			return `Inflict a ${maxMultiplier}x ${attributeString} attack to 1 enemy but HP falls to 1. Affected by enemy element and defense.`;
		} else {
			return `Inflict a ${maxMultiplier}x ${attributeString} attack to 1 enemy but HP falls to ${remainingHPPercentage}%. Affected by enemy element and defense.`;
		}
	}

	public ASHpConditionalMassNuke(): string {
		let data = this.mergeDefaults([0, 1, 1, 0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let minMultiplier = this.mult(data[1]);
		let maxMultiplier = this.mult(data[2]);
		let remainingHPPercentage = data[3];

		if (remainingHPPercentage === 0) {
			return `Inflict a ${maxMultiplier}x ${attributeString} attack to all enemies but HP falls to 1. Affected by enemy element and defense.`;
		} else {
			return `Inflict a ${maxMultiplier}x ${attributeString} attack to all enemies but HP falls to ${remainingHPPercentage}%. Affected by enemy element and defense.`;
		}
	}

	public ASTargetNukeWithHpPenalty(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let minDamage = this.mult(data[1]);
		let maxDamage = this.mult(data[2]);
		let remainingHPPercentage = data[3];

		if (remainingHPPercentage === 0) {
			return `Inflict ${this.numberWithCommas(
				maxDamage
			)} ${attributeString} damage to 1 enemy but HP falls to 1. Affected by enemy element and defense.`;
		} else {
			return `Inflict ${this.numberWithCommas(
				maxDamage
			)} ${attributeString} damage to 1 enemy but HP falls to ${remainingHPPercentage}%. Affected by enemy element and defense.`;
		}
	}

	public ASMassNukeWithHpPenalty(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let minDamage = this.mult(data[1]);
		let maxDamage = this.mult(data[2]);
		let remainingHPPercentage = data[3];

		if (remainingHPPercentage === 0) {
			return `Inflict ${this.numberWithCommas(
				maxDamage
			)} ${attributeString} damage to all enemies but HP falls to 1. Affected by enemy element and defense.`;
		} else {
			return `Inflict ${this.numberWithCommas(
				maxDamage
			)} ${attributeString} damage to all enemies but HP falls to ${remainingHPPercentage}%. Affected by enemy element and defense.`;
		}
	}

	public ASTypeBurst(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let duration = data[0];
		let type = data[1];
		let typeString = this.toTypeString(type);
		let ATKMultiplier = this.mult(data[2]);

		return `${typeString} Type cards ATK x${ATKMultiplier} for ${duration} turn.`;
	}

	public ASAttrBurstMultiPart(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0]);
		let duration = data[0];
		let attributes = [data[1], data[2], data[3]];
		let ATKMultiplier = this.mult(data[3]);
		let RCV = false;

		if (attributes.includes(5)) {
			//Heart-attribute
			RCV = true;
			attributes = attributes.filter((attribute) => attribute !== 5);
		} else {
			attributes = [data[1], data[2]]; //Because there will be only 2 elements
		}

		//Do attributeString after to remove the RCV if any
		let attributeString = this.toAttributeString(attributes);
		let boost = RCV ? this.stringifyBoost(1, ATKMultiplier, ATKMultiplier) : this.stringifyBoost(1, ATKMultiplier);

		return `${attributeString} Attribute cards ${boost} for ${duration} turns.`;
	}

	public ASBicolorOrbEnhance(): string {
		let data = this.mergeDefaults([]);
		let firstAttribute = data[0];
		let firstAttributeString = this.toAttributeString(firstAttribute);
		let secondAttribute = data[1];
		let secondAttributeString = this.toAttributeString(secondAttribute);

		return `Enhance ${firstAttributeString} & ${secondAttributeString} orbs.`;
	}

	public ASTypeBurstNew(): string {
		let data = this.mergeDefaults([0, 0, 0, 1]);
		let duration = data[0];
		let types = [data[1], data[2]];
		let typeString = this.toTypeString(types);
		let multiplier = this.mult(data[3]);

		return `${typeString} Type cards ATK x${multiplier} for ${duration} turns.`;
	}

	public ASLeaderSwap(): string {
		return `Switch places with leader. Use again to switch back.`;
	}

	public ASLowHpConditionalAttrDamageBoost(): string {
		let data = this.mergeDefaults([0, 0, 1, 1]);
		let massAttack = data[0] === 0;
		let attribute = data[1];
		let attributeString = this.toAttributeString(attribute);
		let highHPMultiplier = this.mult(data[2]);
		let lowHPMultiplier = this.mult(data[3]);

		if (massAttack) {
			return `Inflict ${attributeString} damage to all enemies based on player's HP (${highHPMultiplier}x at full HP, up to x${lowHPMultiplier} at 1 HP). Affected by enemy element and defense.`;
		} else {
			return `Inflict ${attributeString} damage to 1 enemy based on player's HP (${highHPMultiplier}x at full HP, up to x${lowHPMultiplier} at 1 HP). Affected by enemy element and defense.`;
		}
	}

	public ASMiniNukeandHpRecovery(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);
		let ATKMultiplier = this.mult(data[1]);
		let RCVMultiplier = data[2];

		return `Inflict ${ATKMultiplier}x ${attributeString} damage to 1 enemy. Recover ${RCVMultiplier}% of the damage dealt as HP. Affected by enemy element and defense.`;
	}

	public ASHpRecoveryandBindClear(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0]);
		let bindRecovery = data[0];
		let RCVMultiplierAsHP = this.mult(data[1]); //Uused
		let HP = data[2]; //Unused
		let maxHPPercentageRecovery = data[3];
		let awokenBindRecovery = data[4];

		let result = [];

		if (maxHPPercentageRecovery > 0) result.push(`Recover ${maxHPPercentageRecovery}% of max HP.`);
		if (bindRecovery > 0) result.push(`${bindRecovery} turn bind recovery.`);
		if (awokenBindRecovery > 0) result.push(`${awokenBindRecovery} turn awoken bind recovery.`);

		return result.length > 0 ? result.join(' ') : '';
	}

	public ASRandomSkill(): string {
		let skillIds = this.params;
		let result = [];

		skillIds.forEach((skillId) => result.push('{{' + skillId + '}} ' + SKILL_DATA[skillId][0]));

		return result.join('\n');
	}

	public ASIncreasedSkyfallChance(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let duration = data[1];
		let maxDuration = data[2];
		let percentage = data[3];

		return `Increase skyfall chance of ${attributeString} orbs by ${percentage}% for ${duration} turns.`;
	}

	public ASColumnOrbChange(): string {
		let data = this.mergeDefaults([]);
		let result = [];

		data.forEach((datum, index) => {
			if (index % 2 === 0) return; //Process in pair

			let attribute = this.getAttributesFromBinary(datum);
			let attributeString = this.toAttributeString(attribute);
			let position = data[index - 1];
			let positionString = this.getColumnPositionFromBinary(position);

			result.push(`Change the ${positionString} column into ${attributeString} orbs.`);
		});

		return result.join(' ');
	}

	public ASRowOrbChange(): string {
		let data = this.mergeDefaults([]);
		let result = [];

		data.forEach((datum, index) => {
			if (index % 2 === 0) return; //Process in pair

			let attribute = this.getAttributesFromBinary(datum);
			let attributeString = this.toAttributeString(attribute);
			let position = data[index - 1];
			let positionString = this.getRowPositionFromBinary(position);

			result.push(`Change the ${positionString} row into ${attributeString} orbs.`);
		});

		return result.join(' ');
	}

	public ASIncreasedOrbMovementTime(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let duration = data[0];
		let staticOrbMovementTime = data[1] / 10;
		let percentageOrbMovementTime = this.mult(data[2]);

		if (staticOrbMovementTime !== 0) {
			return `Orb move time ${
				staticOrbMovementTime < 0 ? '' : '+'
			}${staticOrbMovementTime} seconds for ${duration} turn.`;
		}

		if (percentageOrbMovementTime) {
			return `${percentageOrbMovementTime}x orb move time for ${duration} turn.`;
		}

		return 'None';
	}

	public ASOrbEnhanceNew(): string {
		let data = this.mergeDefaults([0]);
		let attribute = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attribute);

		return `Enhance ${attributeString} orbs.`;
	}

	public ASRandomLocationOrbSpawn(): string {
		let data = this.mergeDefaults([0, 0, 0]);
		let amount = data[0];
		let spawnAttributes = this.getAttributesFromBinary(data[1]);
		let spawnAttributeString = this.toAttributeString(spawnAttributes);
		let excluding = this.getAttributesFromBinary(data[2]);
		let excludingString = this.toAttributeString(excluding);

		return `Randomly spawn ${amount} ${spawnAttributeString} orbs each from non ${excludingString} orbs.`;
	}

	public ASAttributeChange(): string {
		let data = this.mergeDefaults([0, 0]);
		let duration = data[0];
		let attribute = data[1];
		let attributeString = this.toAttributeString(attribute);

		return `Change own attribute to ${attributeString} for ${duration} turns.`;
	}

	public ASHpMultiplierNuke(): string {
		let data = this.mergeDefaults([0]);
		let multiplier = this.mult(data[0]);
		//Note: another slot must contain the attribute, since this is a fixed nuke.
		let attribute = this.getAttributesFromBinary(data[1]);
		let attributeString = this.toAttributeString(attribute);

		return `Inflict a ${attributeString} attack to all enemies equal to ${multiplier}x of entire team's HP.`;
	}

	public ASAttrNukeOfAttrTwoAtk(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let teamAttribute = this.getAttributesFromBinary(data[0]);
		let teamAttributeString = this.toAttributeString(teamAttribute);
		let multiplier = this.mult(data[1]);
		let isMassAttack = data[2] === 0;
		let attackAttribute = data[3];
		let attackAttributeString = this.toAttributeString(attackAttribute);

		return `Inflict a ${attackAttributeString} attack to ${
			isMassAttack ? 'all enemies' : '1 enemy'
		} equal to ${multiplier}x of entire team's ${teamAttributeString} ATK.`;
	}

	public ASHpRecovery(): string {
		let data = this.mergeDefaults([0]);
		let amount = this.mult(data[0]);

		return `Heal ${amount}x of entire team's RCV.`;
	}

	public ASHaste(): string {
		let data = this.mergeDefaults([0, 0]);
		let turns = data[0];
		let maxTurns = data[1] || turns;

		if (maxTurns) {
			return `Team skills charged by ${turns} to ${maxTurns} turns.`;
		} else {
			return `Team skills charged by ${turns} turns.`;
		}
	}

	public ASOrbLock(): string {
		let data = this.mergeDefaults([0, 0]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let count = data[1]; //This can be 42 (7x6 board)/99 (just max?) (both mean 'all') or a fixed number

		if (!count || [42, 49].includes(count)) {
			return `Lock ${attributeString} orbs.`;
		} else {
			return `Randomly lock ${count} of the following orbs: ${attributeString}.`;
		}
	}

	public ASEnemyAttrChange(): string {
		let data = this.mergeDefaults([0]);
		let attribute = data[0];
		let attributeString = this.toAttributeString(attribute);

		return `Change all enemies attributes to ${attributeString}, iIgnoring status shield.`;
	}

	public ASThreeAttrtoOneAttr(): string {
		let data = this.mergeDefaults([0, 0]);
		let fromAttributes = this.getAttributesFromBinary(data[0]);
		let fromAttributeString = this.toAttributeString(fromAttributes);
		let toAttributes = this.getAttributesFromBinary(data[1]);
		let toAttributeString = this.toAttributeString(toAttributes);

		return `Changes ${fromAttributeString} orbs into ${toAttributeString} orbs.`;
	}

	public ASAwokenSkillBurst(): string {
		let data = this.mergeDefaults([1, 0, 0, 0, 0, 0]);
		let duration = data[0];
		let awakens = [data[1], data[2], data[3]]; //The reference file uses [1:4]
		awakens = awakens.filter((awakening) => awakening !== 0);
		let awakenString = this.toAwakenString(awakens);

		let toggle = data[4];
		let amountPer = null;

		if (toggle === 1) {
			amountPer = data[5] / 100;
		} else if (toggle === 2) {
			amountPer = data[5] - 100;
		} else if (toggle === 3) {
			amountPer = data[5];
		}

		if (amountPer === null) return 'None';

		switch (toggle) {
			case 1:
				return `Heal ${amountPer}x RCV as HP for every ${awakenString} awakening on team.`;
				break;
			case 2:
				return `For ${duration} turns, ATK increases by ${amountPer}% for every ${awakenString} awakening on team.`;
				break;
			case 3:
				return `For ${duration} turns, gain ${amountPer}% damage reduction for every ${awakenString} awakening on team.`;
				break;
			default:
				return 'None';
				break;
		}
	}

	public ASAwokenSkillBurst2(): string {
		let data = this.mergeDefaults([1, 1, 0, 0, 0, 0, 0, 1]);
		let duration = data[0];
		let awakens = [data[1], data[2], data[3], data[4]];
		awakens = awakens.filter((awakening) => awakening !== 0);
		let awakenString = this.toAwakenString(awakens);
		let unknown = data[5];
		let toggle = data[6];
		let amountPer = null;

		if (toggle === 1) {
			amountPer = data[7];
		} else if ([0, 2].includes(toggle)) {
			amountPer = data[7];
		} else if (toggle === 3) {
			amountPer = data[7];
		}

		if (amountPer === null) return 'None';

		switch (toggle) {
			case 0:
				return `For ${duration} turns, ATK increases by ${amountPer}% for every ${awakenString} awakening on team.`;
				break;
			case 1:
				return `Heal ${amountPer}x RCV as HP for every ${awakenString} awakening on team.`;
				break;
			case 2:
				return `For ${duration} turns, ATK increases by ${amountPer}% for every ${awakenString} awakening on team.`;
				break;
			case 3:
				return `For ${duration} turns, gain ${amountPer}% damage reduction for every ${awakenString} awakening on team.`;
				break;
			default:
				return 'None';
				break;
		}
	}

	public ASAddAdditionalCombos(): string {
		let data = this.mergeDefaults([0, 0]);
		let duration = data[0];
		let combo = data[1];

		return `+${combo} combo counts for ${duration} turn.`;
	}

	public ASTrueGravity(): string {
		let data = this.mergeDefaults([0]);
		let trueGravityPercentage = data[0];

		return `Reduce all enemies' current HP by ${trueGravityPercentage}% of their max HP.`;
	}

	public ASOrbLockRemoval(): string {
		return `Unlock all orbs.`;
	}

	public ASVoidDamageAbsorption(): string {
		let data = this.mergeDefaults([0, 0, 0, 0]);
		let duration = data[0];
		let isAttributeAbsorbVoid = !!data[1];
		let isDamageAbsorbVoid = !!data[3];

		if (isAttributeAbsorbVoid && isDamageAbsorbVoid) {
			return `Voids attribute absorption and damage absorption for ${duration} turns.`;
		} else {
			if (isAttributeAbsorbVoid) {
				return `Voids attribute absorption for ${duration} turns.`;
			}

			if (isDamageAbsorbVoid) {
				return `Voids attribute damage absorption for ${duration} turns.`;
			}
		}

		return 'None';
	}

	public ASFixedPosConvertSomething(): string {
		let data = this.mergeDefaults([0, 0, 0, 0, 0, 0]);
		let row_1 = this.decimalToBinary(data[0]).toString().split('').reverse().join('').padEnd(6, '0');
		let row_2 = this.decimalToBinary(data[1]).toString().split('').reverse().join('').padEnd(6, '0');
		let row_3 = this.decimalToBinary(data[2]).toString().split('').reverse().join('').padEnd(6, '0');
		let row_4 = this.decimalToBinary(data[3]).toString().split('').reverse().join('').padEnd(6, '0');
		let row_5 = this.decimalToBinary(data[4]).toString().split('').reverse().join('').padEnd(6, '0');

		return `${row_1}\n${row_2}\n${row_3}\n${row_4}\n${row_5}`;
	}

	public ASAutoHealConvert(): string {
		let data = this.mergeDefaults([0, null, 0, 0, 0]);
		let duration = data[0];
		let percentage = data[2];
		let bind = data[3]; //Why do we need this?
		let awokenBind = data[4]; //Why do we need this?

		return `Heal for ${percentage}% of max HP every turn for ${duration} turns.`;
	}

	public ASIncreasedEnhanceOrbSkyfall(): string {
		let data = this.mergeDefaults([0, 0]);
		let duration = data[0];
		let percentageIncrease = data[1];

		return `Increase skyfall chance of enhanced orb by ${percentageIncrease}% for ${duration} turns.`;
	}

	public ASNoSkyfallForXTurns(): string {
		let data = this.mergeDefaults([0]);
		let duration = data[0];

		return `No skyfall combos for ${duration} turns.`;
	}

	public ASMultiLaserConvert(): string {
		let data = this.mergeDefaults([0]);
		let damage = data[0];

		return `Inflict ${this.numberWithCommas(damage)} damage to 1 enemy. Ignore enemy element and defense.`;
	}

	public ASShowComboPath(): string {
		return `Display path to make 3 combos (only in Normal dungeon and 3-orb-match cases).`;
	}

	public ASReduceVoidDamage(): string {
		let data = this.mergeDefaults([0]);
		let duration = data[0];

		return `Ignores enemy damage void effects for ${duration} turn (does not include combo shield, attribute absorb, and damage absorb).`;
	}

	public ASSuicide195(): string {
		let data = this.mergeDefaults([0]);
		let HPRemaining = data[0];

		return `Reduces own HP by ${100 - HPRemaining}%.`;
	}

	public ASReduceDisableMatch(): string {
		let data = this.mergeDefaults([0]);
		let duration = data[0];

		return `Reduces unmatchable orb status by ${duration} turns.`;
	}

	public ASChangeMonster(): string {
		let data = this.mergeDefaults([0]);
		let changeToId = data[0];
		let monster = new MonsterParser(changeToId);

		return `Transform into ${monster.getName()} (#${monster.getId()}).`;
	}

	public ASSkyfallLock(): string {
		//The '1' in slot 0 is suspicious but it seems set for everything so it changes nothing
		let data = this.mergeDefaults([1, 1]);
		let attributes = this.getAttributesFromBinary(data[0]);
		let attributeString = this.toAttributeString(attributes);
		let duration = data[1];

		return `${attributeString} orbs skyfall as locked orbs for ${duration} turns.`;
	}

	public ASSpawnSpinner(): string {
		let data = this.mergeDefaults([1, 100, 0, 0, 0, 0, 0, 1]);
		//Only one example of this so far, so these are all just guesses
		let turns = data[0];
		let speed = this.mult(data[1]);
		let count = data[7];

		return `Randomly spawns spinner orbs for a certain number of turns.`;
	}
}
