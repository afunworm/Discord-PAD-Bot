/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
import * as admin from 'firebase-admin';
import { MonsterParser } from '../../classes/monsterParser.class';
import { MonsterData } from '../../shared/monster.interfaces';
import { Common } from '../../classes/common.class';
const fs = require('fs');

/*-------------------------------------------------------*
 * FIREBASE ADMIN
 *-------------------------------------------------------*/
if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(require(__dirname + '/../../' + process.env.FIREBASE_SERVICE_ACCOUNT)),
		databaseURL: process.env.FIREBASE_DATABASE_URL,
	});
}
const firestore = admin.firestore();

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);
let highestValidMonsterId = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let databaseStartId = Number(process.env.DATABASE_WRITE_START_ID);
// startNumber = 5881;
// endNumber = 5882;
// highestValidMonsterId = endNumber;
let data = [];
let evoTreeData = [];

(async () => {
	let findDataIndex = (id) => {
		let result = null;
		evoTreeData.forEach((entry, index) => {
			if (entry.includes(id)) result = index;
		});
		return result;
	};

	/**
	 * PARSE MONSTER DATA
	 */
	let computedInfoWithSA = {};
	let computedInfoWithoutSA = {};
	let computedStatsWithLB = {
		hp: 0,
		attack: 0,
		recover: 0,
	};
	let computedStatsWithoutLB = {
		hp: 0,
		attack: 0,
		recover: 0,
	};
	for (let id = startNumber; id < endNumber; id++) {
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

			//Calculated max awakenings
			if (Object.keys(computedInfoWithSA).length === 0) {
				computedInfoWithSA = monster.getComputedAwakenings(true);
				computedInfoWithoutSA = monster.getComputedAwakenings(false);
			} else {
				let currentMonsterComputedAwakeningsWithSA = monster.getComputedAwakenings(true);
				let currentMonsterComputedAwakeningsWithoutSA = monster.getComputedAwakenings(false);
				for (let awakening in computedInfoWithSA) {
					if (currentMonsterComputedAwakeningsWithSA[awakening] > computedInfoWithSA[awakening]) {
						computedInfoWithSA[awakening] = currentMonsterComputedAwakeningsWithSA[awakening];
					}
					if (currentMonsterComputedAwakeningsWithoutSA[awakening] > computedInfoWithoutSA[awakening]) {
						computedInfoWithoutSA[awakening] = currentMonsterComputedAwakeningsWithoutSA[awakening];
					}
				}
			}

			//Calculated max stats
			computedStatsWithLB = {
				hp:
					monster.getLimitBreakHP() === null
						? computedStatsWithLB.hp
						: Math.max(monster.getLimitBreakHP(), computedStatsWithLB.hp),
				attack:
					monster.getLimitBreakATK() === null
						? computedStatsWithLB.attack
						: Math.max(monster.getLimitBreakATK(), computedStatsWithLB.attack),
				recover:
					monster.getLimitBreakRCV() === null
						? computedStatsWithLB.recover
						: Math.max(monster.getLimitBreakRCV(), computedStatsWithLB.recover),
			};
			computedStatsWithoutLB = {
				hp: Math.max(monster.getMaxHP(), computedStatsWithoutLB.hp),
				attack: Math.max(monster.getMaxATK(), computedStatsWithoutLB.attack),
				recover: Math.max(monster.getMaxRCV(), computedStatsWithoutLB.recover),
			};

			let monsterData: MonsterData = {
				_lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
			console.log(`Parsed data for monster id ${id}`);
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	/**
	 * PARSE MONSTER EVO LIST - ONLY UP TO VALID MONSTER ID
	 */
	for (let id = startNumber; id < highestValidMonsterId; id++) {
		try {
			let monster = new MonsterParser(id);
			let previousEvoId = monster.getPreviousEvo();
			let monsterId = monster.getId();

			let currentIndex = findDataIndex(previousEvoId);

			if (currentIndex === null) {
				evoTreeData.push([monsterId]);
			} else {
				evoTreeData[currentIndex].push(monsterId);
			}

			console.log(`Processed evo data for monster id ${id}`);
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	/**
	 * MERGE EVO LISTS TO DATA
	 */
	console.log(evoTreeData);
	evoTreeData.forEach((tree) => {
		tree.forEach((monsterId) => {
			data[monsterId]['evoTree'] = tree;
		});
	});

	/**
	 * INSERT DATA TO FIRESTORE
	 */
	for (let i = 0; i < data.length; i++) {
		let entry = data[i];

		if (!entry) continue;

		try {
			if (i >= databaseStartId) {
				await firestore.collection('Monsters').doc(i.toString()).set(entry);
				console.log('Data written for monster id ' + i);
			} else {
				console.log('Skip data writing for id ' + i);
			}
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	await firestore.collection('Monsters').doc('@info').set({
		maxComputedInfoWithSA: computedInfoWithSA,
		maxComputedInfoWithoutSA: computedInfoWithoutSA,
		maxComputedStatsWithLB: computedStatsWithLB,
		maxComputedStatsWithoutLB: computedStatsWithoutLB,
	});
	console.log('Data written for precalculated stats.');

	await fs.writeFileSync('./database.json', JSON.stringify(data, null, 4));

	console.log('Database parsing completed');
	process.exit();
})();
