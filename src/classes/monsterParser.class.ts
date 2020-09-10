const { card: MONSTER_DATA } = require('../raw/download_card_data.json');
const { card: JP_MONSTER_DATA } = require('../raw/download_card_data.jp.json');
const { skill: SKILL_DATA } = require('../raw/download_skill_data.json');
const { skill: JP_SKILL_DATA } = require('../raw/download_skill_data.jp.json');
import { MONSTER_ATTRIBUTES } from '../shared/monster.attributes';
import { AWAKENINGS } from '../shared/monster.awakens';
import { MONSTER_TYPES } from '../shared/monster.types';
import { MONSTER_COLLABS } from '../shared/monster.collabs';
import { LeaderSkill } from './leaderSkill.class';
import { ActiveSkill } from './activeSkill.class';
import { Common } from './common.class';
import { JAPANESE_NAMES } from '../shared/monster.japanese';

export class MonsterParser {
	private id;
	private data;
	private useJP: boolean = false;
	private rawSkillData;

	public static shouldUseJP(id: number): boolean {
		let name = MONSTER_DATA[id][1].toLowerCase();
		return name.startsWith('alt.') || !/^[A-Za-z0-9\.\,\"\'\(\)&\?\- \!\+éóáí\%\:\/\[\]★=]*$/gi.test(name);
	}

	constructor(id: number, useJP: boolean = false) {
		this.id = id;

		if (useJP || MonsterParser.shouldUseJP(id)) {
			if (!Number.isInteger(id) || id > JP_MONSTER_DATA.length || id < 1) {
				throw new Error('Invalid id');
			}

			this.useJP = true;
			this.data = JP_MONSTER_DATA[id];
			this.rawSkillData = JP_SKILL_DATA;
		} else {
			if (!Number.isInteger(id) || id > MONSTER_DATA.length || id < 1) {
				//Attempt to use JP
				if (!Number.isInteger(id) || id > JP_MONSTER_DATA.length || id < 1) {
					throw new Error('Invalid id');
				} else {
					this.useJP = true;
					this.data = JP_MONSTER_DATA[id];
					this.rawSkillData = JP_SKILL_DATA;
				}
			} else {
				this.data = MONSTER_DATA[id];
				this.rawSkillData = SKILL_DATA;
			}
		}
	}

	static getMonsterDatabaseLength(): number {
		return MONSTER_DATA.length;
	}

	static getSkillDatabaseLength(): number {
		return SKILL_DATA.length;
	}

	static getMonsterDatabaseLengthJP(): number {
		return JP_MONSTER_DATA.length;
	}

	static getSkillDatabaseLengthJP(): number {
		return JP_SKILL_DATA.length;
	}

	public getRawData() {
		return this.data;
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
		let monsterName = this.data[1];
		if (
			monsterName.includes['*'] ||
			monsterName.includes('??') ||
			this.useJP ||
			!/^[A-Za-z0-9\.\,\"\'\(\)&\?\- \!\+éóáí\%\:\/\[\]★=]*$/gi.test(monsterName)
		) {
			if (typeof JAPANESE_NAMES[this.id.toString()] === 'string') {
				monsterName = JAPANESE_NAMES[this.id.toString()];
			}
		}
		return monsterName;
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

	public getLimitBreakHP(): number | null {
		if (!this.isLimitBreakable()) return null;

		return Math.round(this.getMaxHP() * (1 + this.getLimitBreakPercentage() / 100));
	}

	public getMinATK(): number {
		return this.data[17];
	}

	public getMaxATK(): number {
		return this.data[18];
	}

	public getLimitBreakATK(): number | null {
		if (!this.isLimitBreakable()) return null;

		return Math.round(this.getMaxATK() * (1 + this.getLimitBreakPercentage() / 100));
	}

	public getMinRCV(): number {
		return this.data[20];
	}

	public getMaxRCV(): number {
		return this.data[21];
	}

	public getLimitBreakRCV(): number | null {
		if (!this.isLimitBreakable()) return null;

		return Math.round(this.getMaxRCV() * (1 + this.getLimitBreakPercentage() / 100));
	}

	public getExpCurve(): number {
		return this.data[23];
	}

	public getActiveSkillDescriptionDetails(activeSkillId: number): string[] {
		let result = [];

		if (this.rawSkillData[activeSkillId][2] === 116) {
			//Multipart
			let skills = this.rawSkillData[activeSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			skillIds.forEach((skillId) => {
				let skillData = this.rawSkillData[skillId];
				let activeSkill = new ActiveSkill(skillData);
				result.push(activeSkill.getDetailDescription() === null ? 'None' : activeSkill.getDetailDescription());
			});
		} else {
			let skillData = this.rawSkillData[activeSkillId];
			let activeSkill = new ActiveSkill(skillData);
			result.push(activeSkill.getDetailDescription() === null ? 'None' : activeSkill.getDetailDescription());
		}

		return result;
	}

	public getActiveSkillTypes(activeSkillId: number): number[] {
		let result = [];

		if (this.rawSkillData[activeSkillId][2] === 116) {
			//Multipart
			let skills = this.rawSkillData[activeSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			skillIds.forEach((skillId) => {
				result.push(this.rawSkillData[skillId][2]);
			});
		} else {
			result.push(this.rawSkillData[activeSkillId][2]);
		}

		return result;
	}

	public getActiveSkill() {
		let skillId = this.data[25];
		let skillData = this.rawSkillData[skillId];
		let descriptionDetails = this.isRegularMonster()
			? this.getActiveSkillDescriptionDetails(skillId)
			: [skillData[1]];

		return {
			id: skillId,
			name: skillData[0],
			description: skillData[1],
			descriptionDetails: descriptionDetails,
			cooldown: skillData[4],
			maxSkillLevel: skillData[3],
			cooldownAtMaxLevel: Number(skillData[4]) - Number(skillData[3]) + 1,
			types: this.getActiveSkillTypes(skillId),
		};
	}

	public getMaxMultiplier(leaderSkillId: number): number[] {
		if (this.rawSkillData[leaderSkillId][2] === 138) {
			//Multipart
			let skills = this.rawSkillData[leaderSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			let result = [1, 1, 1, 1];

			let isSevenBySix = false;

			skillIds.forEach((skillId) => {
				let skillData = this.rawSkillData[skillId];
				let leaderSkill = new LeaderSkill(skillData);
				result = result.map((v, i) => v * leaderSkill.getMaxMultiplier()[i]);
			});

			result[3] = 1 - result[3]; // handling shield

			//Round the result
			result = result.map((stat) => +stat.toFixed(2));

			return result;
		} else {
			let skillData = this.rawSkillData[leaderSkillId];
			let leaderSkill = new LeaderSkill(skillData);
			let result = leaderSkill.getMaxMultiplier();
			result[3] = 1 - result[3];

			//Round the result
			result = result.map((stat) => +stat.toFixed(2));

			return result;
		}
	}

	public getLeaderSkillDescriptionDetails(leaderSkillId: number): string[] {
		let result = [];

		if (this.rawSkillData[leaderSkillId][2] === 138) {
			//Multipart
			let skills = this.rawSkillData[leaderSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			skillIds.forEach((skillId) => {
				let skillData = this.rawSkillData[skillId];
				let leaderSkill = new LeaderSkill(skillData);
				result.push(leaderSkill.getDetailDescription() === null ? 'None' : leaderSkill.getDetailDescription());
			});
		} else {
			let skillData = this.rawSkillData[leaderSkillId];
			let leaderSkill = new LeaderSkill(skillData);
			result.push(leaderSkill.getDetailDescription() === null ? 'None' : leaderSkill.getDetailDescription());
		}

		return result;
	}

	public getLeaderSkillTypes(leaderSkillId: number): number[] {
		let result = [];

		if (this.rawSkillData[leaderSkillId][2] === 138) {
			//Multipart
			let skills = this.rawSkillData[leaderSkillId];
			let skillIds = [];

			for (let i = 6; i < skills.length; i++) {
				skillIds.push(skills[i]);
			}

			skillIds.forEach((skillId) => {
				result.push(this.rawSkillData[skillId][2]);
			});
		} else {
			result.push(this.rawSkillData[leaderSkillId][2]);
		}

		return result;
	}

	public isRegularMonster() {
		let isRegularMonster = false;
		this.getTypes().forEach((type) => {
			//Balanced Physical Healer Dragon God Attacker Devil Machine are accepted
			if ([1, 2, 3, 4, 5, 6, 7, 8].includes(type)) {
				isRegularMonster = true;
			}
		});
		return isRegularMonster;
	}

	public getLeaderSkill() {
		let skillId = this.data[26];
		let skillData = this.rawSkillData[skillId];
		let descriptionDetails = this.isRegularMonster()
			? this.getLeaderSkillDescriptionDetails(skillId)
			: [skillData[1]];

		return {
			id: skillId,
			name: skillData[0],
			description: skillData[1],
			descriptionDetails: descriptionDetails,
			maxMultipliers: this.getMaxMultiplier(skillId),
			types: this.getLeaderSkillTypes(skillId),
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
			return superAwakening.split(',').map((awakening) => Number(awakening));
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

	public getCollabId(): number {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let baseMonsterIndex = superAwakeningsIndex + 1;
		let thirdTypeIndex = baseMonsterIndex + 2;
		let monsterPointIndex = thirdTypeIndex + 1;
		let collabIndex = monsterPointIndex + 2;

		return this.data[collabIndex];
	}

	public getReadableCollab(): string {
		let collabId = this.getCollabId();
		return MONSTER_COLLABS[collabId]?.name || 'Unknown';
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

	public isLimitBreakable(): boolean {
		return this.getLimitBreakPercentage() > 0;
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

	public isInheritable(): boolean {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let inheritanceTypeIndex = superAwakeningsIndex + 7;
		let inheritanceType = this.data[inheritanceTypeIndex];

		return !!(inheritanceType & 1); //Last index, so 0b000001 is inheritable
	}

	public isExtraSlottable(): boolean {
		let skillCount = this.data[57];
		let moveSets = skillCount * 3;
		let numberOfAwakeningsIndex = 57 + moveSets + 1;
		let numberOfAwakenings = this.data[numberOfAwakeningsIndex];
		let superAwakeningsIndex = numberOfAwakeningsIndex + numberOfAwakenings + 1;
		let inheritanceTypeIndex = superAwakeningsIndex + 7;
		let inheritanceType = this.data[inheritanceTypeIndex];

		return !!(inheritanceType & 32); //0b100000 is extra slottable
	}

	public getMonsterSeries(): string | null {
		let seriesInfo = Common.getCardSeriesInfo(this.id);
		return seriesInfo.id;
	}

	public getReadableMonsterSeries(): string | null {
		let seriesInfo = Common.getCardSeriesInfo(this.id);
		return seriesInfo.name;
	}

	public getMonsterSeriesGroup(): string | null {
		return Common.getCardSeriesGroup(this.getId(), this.getCollabId());
	}

	public getEvolutionType(): string {
		/*
            If the monster has Equip awakening -> Equip.
            If the monster has the transform into ID -> Transform.
            Else If the card can take 8 latents (SR, SU & R):
                [1] If it uses 'Event Medal', or has 'Super Reincarnated' in its name -> SR.
                [2] If it can be reversed evo, it is SU.
                [3] Else -> R.

            Else
                [1] If the monster has the word 'Pixel' in its name or uses 'Pixelits' -> Pixel.
                [3] If the card has the word 'Awoken' in its name -> Awoken.
                [4] If both of the above are false, then:
                    - If it is reversible -> Ultimate.
                    - Else -> Normal if not base, base if base.
        */
		if (this.getAwakenings().includes(49)) {
			return 'equip';
		} else if (this.getTransformIntoId() !== null) {
			return 'transform';
		} else if (this.isExtraSlottable()) {
			if (this.getEvoMaterials().includes(5077) || this.getName().toLowerCase().includes('super reincarnated')) {
				return 'superReincarnated';
			} else {
				if (this.isEvoReversible()) {
					return 'superUltimate';
				} else {
					return 'reincarnated';
				}
			}
		} else {
			if (this.getEvoMaterials().includes(3826) || this.getName().toLowerCase().includes('pixel')) {
				return 'pixel';
			} else if (this.getName().toLowerCase().includes('awoken')) {
				return 'awoken';
			} else {
				if (this.isEvoReversible()) {
					return 'ultimate';
				} else {
					if (this.getEvoMaterials().filter((mat) => mat !== 0).length === 0) {
						return 'base';
					} else {
						return 'normal';
					}
				}
			}
		}
	}

	public getReadableEvolutionType(): string {
		let map = {
			equip: 'Equip',
			normal: 'Normal',
			base: 'Base',
			ultimate: 'Ultimate',
			awoken: 'Awoken',
			pixel: 'Pixel',
			reincarnated: 'Reincarnated',
			superUltimate: 'Super Ultimate',
			superReincarnated: 'Super Reincarnated',
			transform: 'Transform',
		};

		let evolutionType = this.getEvolutionType();
		return map[evolutionType] || 'Unknown';
	}

	public getComputedAwakenings(withSA: boolean = true) {
		let result = {};
		let awakenings = this.getAwakenings();
		let superAwakenings = this.getSuperAwakenings();

		awakenings = withSA ? [...awakenings, ...superAwakenings] : awakenings;

		for (let id in AWAKENINGS) {
			result[id] = 0;
		}

		awakenings.forEach((awakening) => {
			let computedAwakening = awakening;
			let increment = 1;

			if (awakening === 52) {
				computedAwakening = 10;
				increment = 2;
			} else if (awakening === 68) {
				computedAwakening = 11;
				increment = 5;
			} else if (awakening === 69) {
				computedAwakening = 12;
				increment = 5;
			} else if (awakening === 70) {
				computedAwakening = 13;
				increment = 5;
			} else if (awakening === 53) {
				computedAwakening = 19;
				increment = 2;
			} else if (awakening === 56) {
				computedAwakening = 21;
				increment = 2;
			}

			result[computedAwakening] += increment;
		});

		return result;
	}

	public getTotalAwakenings(withSA: boolean = true) {
		let result = {};
		let awakenings = this.getAwakenings();
		let superAwakenings = this.getSuperAwakenings();

		awakenings = withSA ? [...awakenings, ...superAwakenings] : awakenings;

		for (let id in AWAKENINGS) {
			result[id] = 0;
		}

		awakenings.forEach((awakening) => {
			result[awakening] += 1;
		});

		return result;
	}
}
