//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/leader_skill_info.py
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { LEADERSKILL_MAP } from './leaderSkill.map';

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
		//TODO - VERIFY MAP
		const MONSTER_ATTRIBUTES = {
			'-1': 'None',
			0: 'Fire',
			1: 'Water',
			2: 'Wood',
			3: 'Light',
			4: 'Dark',
			5: 'Heart',
			6: 'Jammer',
			7: 'Poison',
			8: 'Mortal Poison',
		};
		return MONSTER_ATTRIBUTES[attributeId];
	}

	private mapType(typeId: number): string {
		//TODO - VERIFY MAP
		const MONSTER_TYPES = {
			'-1': 'None',
			0: 'Evo Material',
			1: 'Balanced',
			2: 'Physical',
			3: 'Healer',
			4: 'Dragon',
			5: 'God',
			6: 'Attacker',
			7: 'Devil',
			8: 'Machine',
			12: 'Awaken Material',
			14: 'Enhance Material',
			15: 'Redeemable Material',
		};
		return MONSTER_TYPES[typeId];
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
	// 26: 'LSStaticAtkBoost',
	// 28: 'LSAttrAtkRcvBoost',
	// 29: 'LSAllStatBoost',
	// 30: 'LSTwoTypeHpBoost',
	// 31: 'LSTwoTypeAtkBoost',
	// 33: 'LSTaikoDrum',
}
