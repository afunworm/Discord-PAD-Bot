/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
import { MonsterParser } from '../../classes/monsterParser.class';
import { MonsterData } from '../../shared/monster.interfaces';
import { Common } from '../../classes/common.class';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);
let data = [];
(async () => {
	for (let id = startNumber; id <= endNumber; id++) {
		try {
			let monster = new MonsterParser(id);

			//Check to see if the monster is present in the NA database, if not, switch to JP database
			//We can get around this by checking cooldown of an active skill
			//It should never be 0
			if (
				(monster.getActiveSkill().cooldown === 0 && monster.isRegularMonster()) ||
				monster.getName().toLowerCase().startsWith('alt.')
			) {
				//The clever eggs don't have skills
				if (![3538, 3540, 3542, 3544, 3546].includes(monster.getId())) {
					try {
						monster = new MonsterParser(id, true);
					} catch (error) {
						console.log('Unable to use Japanese database for monster id ' + id);
					}
				}
			}

			let series, seriesReadable;

			let seriesInfo = Common.getCardSeriesInfo(id);
			series = seriesInfo.id;
			seriesReadable = seriesInfo.name;

			let monsterData: MonsterData = {
				_lastUpdatedAt: new Date(),
				id: monster.getId(),
				name: monster.getName(),
				mainAttribute: monster.getMainAttribute(),
				mainAttributeReadable: monster.getReadableMainAttribute(),
				subAttribute: monster.getSubAttribute(),
				subAttributeReadable: monster.getReadableSubAttribute(),
				isEvoReversible: monster.isEvoReversible(),
				isInheritable: monster.isInheritable(),
				isExtraSlottable: monster.isExtraSlottable(),
				isLimitBreakable: monster.isLimitBreakable(),
				types: monster.getTypes(),
				typesReadable: monster.getReadableTypes(),
				rarity: monster.getRarity(),
				cost: monster.getCost(),
				collab: monster.getCollabId(),
				collabReadable: monster.getReadableCollab(),
				series: series,
				seriesReadable: seriesReadable,
				evolutionType: monster.getEvolutionType(),
				evolutionTypeReadable: monster.getReadableEvolutionType(),
				group: monster.getMonsterSeriesGroup(),
				maxLevel: monster.getMaxLevel(),
				feedExp: monster.getFeedExp(),
				sellPrice: monster.getSellPrice(),
				minHP: monster.getMinHP(),
				maxHP: monster.getMaxHP(),
				minATK: monster.getMinATK(),
				maxATK: monster.getMaxATK(),
				minRCV: monster.getMinRCV(),
				maxRCV: monster.getMaxRCV(),
				limitBreakHP: monster.getLimitBreakHP(),
				limitBreakATK: monster.getLimitBreakATK(),
				limitBreakRCV: monster.getLimitBreakRCV(),
				expCurve: monster.getExpCurve(),
				activeSkill: monster.getActiveSkill(),
				leaderSkill: monster.getLeaderSkill(),
				asEnemy: {
					turnTimer: monster.getTurnTimerAsEnemy(),
					minHP: monster.getHPAtLevel1AsEnemy(),
					maxHP: monster.getHPAtLevel10AsEnemy(),
					minATK: monster.getATKAtLevel1AsEnemy(),
					maxATK: monster.getATKAtLevel10AsEnemy(),
					minDEF: monster.getDEFAtLevel1AsEnemy(),
					maxDEF: monster.getATKAtLevel10AsEnemy(),
					coinDropped: monster.getCoinDropAsEnemy(),
					expDropped: monster.getExpDropAsEnemy(),
				},
				previousEvoId: monster.getPreviousEvo(),
				evoMaterials: monster.getEvoMaterials(),
				devoMaterials: monster.getDevoMaterials(),
				awakenings: monster.getAwakenings(),
				awakeningsReadable: monster.getReadableAwakenings(),
				superAwakenings: monster.getSuperAwakenings(),
				superAwakeningsReadable: monster.getReadableSuperAwakenings(),
				monsterPoints: monster.getMonsterPoints(),
				limitBreakPercentage: monster.getLimitBreakPercentage(),
				transformIntoId: monster.getTransformIntoId(),
				totalAwakeningsWithSA: monster.getTotalAwakenings(true),
				totalAwakeningsWithoutSA: monster.getTotalAwakenings(false),
				computedAwakeningsWithSA: monster.getComputedAwakenings(true),
				computedAwakeningsWithoutSA: monster.getComputedAwakenings(false),
			};
			data[id] = monsterData;
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	let leaderOutput = 'Name,In-game Description,Parsed Description';
	let activeOutput = 'Name, Skill CD (Max), # of Skillups, In-Game Description, Parsed Description';
	data.forEach((monster: MonsterData, index) => {
		leaderOutput += `\n"${monster.leaderSkill.name.replace('"', '\\"')}","${
			monster.leaderSkill.description
		}","${monster.leaderSkill.descriptionDetails.join('\n')}"`;

		activeOutput += `\n"${monster.activeSkill.name.replace('"', '\\"')}","${
			monster.activeSkill.cooldownAtMaxLevel
		}","${monster.activeSkill.maxSkillLevel}","${
			monster.activeSkill.description
		}","${monster.activeSkill.descriptionDetails.join('\n')}"`;
	});

	await fs.writeFileSync('./leaderSkills.csv', leaderOutput, { encoding: 'utf8' });
	await fs.writeFileSync('./activeSkills.csv', activeOutput, { encoding: 'utf8' });

	console.log('Database parsing completed');
	process.exit();
})();
