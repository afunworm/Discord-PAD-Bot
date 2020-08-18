//Reference: https://github.com/nachoapps/dadguide-data/blob/master/etl/pad/raw/skills/leader_skill_info.py
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { LEADERSKILL_MAP } from './leaderSkill.map';
import { MonsterParser } from '../classes/monsterParser.class';
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';

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

	public getDetailDescription(): string {
		let map = LEADERSKILL_MAP;
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
		let functionToCall = LEADERSKILL_MAP[this.type];
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
		let data = this.mergeDefaults(this.params, [0]);
		let threshold = data[0];
		return `While your HP is ${threshold}% or above, a single hit that normally kills you will instead leave you with 1 HP. For the consecutive hits, this skill will only affect the first hit.`;
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
