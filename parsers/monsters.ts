/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import * as admin from 'firebase-admin';
import { MonsterParser } from '../classes/monsterParser.class';
import { MonsterData } from '../shared/monster.interfaces';

/*-------------------------------------------------------*
 * FIREBASE ADMIN
 *-------------------------------------------------------*/
if (admin.apps.length === 0) {
	admin.initializeApp({
		credential: admin.credential.cert(require('../' + process.env.FIREBASE_SERVICE_ACCOUNT)),
		databaseURL: process.env.FIREBASE_DATABASE_URL,
	});
}
const firestore = admin.firestore();

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);

(async () => {
	for (let id = startNumber; id < endNumber; id++) {
		try {
			let monster = new MonsterParser(id);

			let data: MonsterData = {
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
				types: monster.getTypes(),
				typesReadable: monster.getReadableTypes(),
				rarity: monster.getRarity(),
				cost: monster.getCost(),
				maxLevel: monster.getMaxLevel(),
				feedExp: monster.getFeedExp(),
				sellPrice: monster.getSellPrice(),
				minHP: monster.getMinHP(),
				maxHP: monster.getMaxHP(),
				minATK: monster.getMinATK(),
				maxATK: monster.getMaxATK(),
				minRCV: monster.getMinRCV(),
				maxRCV: monster.getMaxRCV(),
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
				evoMaterial: monster.getEvoMaterials(),
				devoMaterial: monster.getDevoMaterials(),
				awakenings: monster.getAwakenings(),
				awakeningsReadable: monster.getReadableAwakenings(),
				superAwakenings: monster.getSuperAwakenings(),
				superAwakeningsReadable: monster.getReadableSuperAwakenings(),
				monsterPoints: monster.getMonsterPoints(),
				limitBreakPercentage: monster.getLimitBreakPercentage(),
				transformIntoId: monster.getTransformIntoId(),
			};
			console.log(data);
			// await firestore.collection('Monsters').doc(id.toString()).set(data);
			console.log(`Parsed data for monster id ${id}`);
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	console.log('Database parsing completed');
	process.exit();
})();
