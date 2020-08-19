const { card: MONSTER_DATA } = require('../download_card_data.json');
const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { AWAKENINGS } from '../shared/monster.awakens';
import { MONSTER_TYPES } from '../shared/monster.types';
import { LeaderSkill } from './leaderSkill.class';

export class MonsterParser {
	private id;
	private data;

	constructor(id: number) {
		if (!Number.isInteger(id) || id > MONSTER_DATA.length || id < 1) {
			throw new Error('Invalid id');
		}

		this.id = id;
		this.data = MONSTER_DATA[id];
	}

	private getLatentKillers(types): number[] {
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

		for (let i = 0; i < types.length; i++) {
			let monsterType = types[i];
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

	public getId(): number {
		return this.id;
	}

	public getName(): string {
		return this.data[1];
	}

	public getMainAttribute(): number {
		return this.data[2];
	}

	public getReadableMainAttribute(): string {
		let attribute = this.getMainAttribute();
		return MONSTER_ATTRIBUTES[attribute];
	}

	public getSubAttribute(): number {
		return this.data[3] === -1 ? null : this.data[3];
	}

	public getReadableSubAttribute(): string {
		let attribute = this.getSubAttribute();
		return attribute === null ? 'None' : MONSTER_ATTRIBUTES[attribute];
	}

	public isEvoReversible(): boolean {
		return this.data[4] === 1;
	}

	public getTypes(): number[] {
		let types = [];

		//First/second type is at index 5/6
		if (this.data[5] !== -1) types.push(this.data[5]);
		if (this.data[6] !== -1) types.push(this.data[6]);

		//Last type is at index, well, look at the reference file
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;
		let thirdTypeIndex = baseMonsterIndex + 2;
		let thirdType = this.data[thirdTypeIndex];

		if (thirdType !== -1) types.push(thirdType);

		return types;
	}

	public getReadableTypes(): string[] {
		let result = [];

		this.getTypes().forEach((typeId) => {
			result.push(MONSTER_TYPES[typeId]);
		});

		return result;
	}

	public getRarity(): number {
		return this.data[7];
	}

	public getCost(): number {
		return this.data[8];
	}

	public getMaxLevel(): number {
		return this.data[10];
	}

	public getFeedExp(level: number = 1): number {
		return (this.data[11] / 4) * level;
	}

	public getSellPrice(level: number = 1): number {
		return this.data[13] * level;
	}

	public getMinHP(): number {
		return this.data[14];
	}

	public getMaxHP(): number {
		return this.data[15];
	}

	public getMinATK(): number {
		return this.data[17];
	}

	public getMaxATK(): number {
		return this.data[18];
	}

	public getMinRCV(): number {
		return this.data[20];
	}

	public getMaxRCV(): number {
		return this.data[21];
	}

	public getExpCurve(): number {
		return this.data[23];
	}

	public getActiveSkill() {
		let skillId = this.data[25];
		let skillData = SKILL_DATA[skillId];
		return {
			id: skillId,
			name: skillData[0],
			description: skillData[1],
			cooldownAtLevelMax: skillData[3],
			cooldownAtLevel1: skillData[4],
		};
	}

	public getLeaderSkillDescriptionDetails(leaderSkillId: number): string[] {
		let result = [];

		if (SKILL_DATA[leaderSkillId][2] === 138 || SKILL_DATA[leaderSkillId][2] === 116) {
			//Multipart
			let skills = SKILL_DATA[leaderSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			skillIds.forEach((skillId, index) => {
				let skillData = SKILL_DATA[skillId];
				let leaderSkill = new LeaderSkill(skillData);
				result.push(leaderSkill.getDetailDescription());
			});
		} else {
			let skillData = SKILL_DATA[leaderSkillId];
			let leaderSkill = new LeaderSkill(skillData);
			result.push(leaderSkill.getDetailDescription());
		}

		return result;
	}

	public getLeaderSkill() {
		let skillId = this.data[26];
		let skillData = SKILL_DATA[skillId];
		return {
			id: skillId,
			name: skillData[0],
			description: skillData[1],
			descriptionDetails: this.getLeaderSkillDescriptionDetails(skillId),
		};
	}

	public getTurnTimerAsEnemy(): number {
		return this.data[27];
	}

	public getHPAtLevel1AsEnemy(): number {
		return this.data[28];
	}

	public getHPAtLevel10AsEnemy(): number {
		return this.data[29];
	}

	public getATKAtLevel1AsEnemy(): number {
		return this.data[31];
	}

	public getATKAtLevel10AsEnemy(): number {
		return this.data[32];
	}

	public getDEFAtLevel1AsEnemy(): number {
		return this.data[34];
	}

	public getDEFAtLevel10AsEnemy(): number {
		return this.data[35];
	}

	public getCoinDropAsEnemy(level: number = 1): number {
		return (this.data[38] / 2) * level;
	}

	public getExpDropAsEnemy(level: number = 1): number {
		return (this.data[39] / 2) * level;
	}

	public getPreviousEvo(): number {
		return this.data[40];
	}

	public getEvoMaterials(): number[] {
		return [this.data[41], this.data[42], this.data[43], this.data[44], this.data[45]];
	}

	public getDevoMaterials(): number[] {
		return [this.data[46], this.data[47], this.data[48], this.data[49], this.data[50]];
	}

	public getNumberOfSkillsAsEnemy(): number {
		return this.data[57];
	}

	public getAwakenings(): number[] {
		let result = [];
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];

		for (let i = 0; i < numberOfAwakenings; i++) {
			result.push(this.data[numberOfAwakeningsIndex + 1 + i]);
		}

		return result;
	}

	public getReadableAwakenings(): string[] {
		let result = [];

		let awakenings = this.getAwakenings();

		awakenings.forEach((awakeningId) => {
			result.push(AWAKENINGS[awakeningId]);
		});

		return result;
	}

	public getSuperAwakenings(): number[] {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;

		let superAwakening = this.data[superAwakeningsIndex];

		if (superAwakening.toString().includes(',')) {
			return superAwakening.split(',');
		} else {
			return superAwakening === '' ? [] : [superAwakening];
		}
	}

	public getReadableSuperAwakenings(): string[] {
		let result = [];

		let awakenings = this.getSuperAwakenings();

		awakenings.forEach((awakeningId) => {
			result.push(AWAKENINGS[awakeningId]);
		});

		return result;
	}

	public getBaseMonster(): number {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;

		return this.data[baseMonsterIndex];
	}

	public getMonsterPoints(): number {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;
		let thirdTypeIndex = baseMonsterIndex + 2;
		let monsterPointIndex = thirdTypeIndex + 1;

		return this.data[monsterPointIndex];
	}

	public getLimitBreakPercentage(): number {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;
		let thirdTypeIndex = baseMonsterIndex + 2;
		let monsterPointIndex = thirdTypeIndex + 1;
		let limitBreakPercentageIndex = monsterPointIndex + 5;

		return this.data[limitBreakPercentageIndex];
	}

	public getTransformIntoId(): number | null {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;
		let thirdTypeIndex = baseMonsterIndex + 2;
		let monsterPointIndex = thirdTypeIndex + 1;
		let limitBreakPercentageIndex = monsterPointIndex + 5;
		let transformIntoIndex = limitBreakPercentageIndex + 3;

		let transformInto = this.data[transformIntoIndex];

		if (transformInto.toString().includes('link:')) {
			return Number(transformInto.replace('link:', ''));
		} else {
			return null;
		}
	}

	public getAvailableKillerLatents(): number[] {
		let types = this.getTypes();

		return this.getLatentKillers(types);
	}
}
