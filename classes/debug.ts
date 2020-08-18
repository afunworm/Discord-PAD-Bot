const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { LeaderSkill } from './leaderSkill.class';

// Find all cards with ID
let SEARCH_FOR = 13;
// for (let i = 1; i <= 7804; i++) {
// 	let monster = new MonsterParser(i);
// 	let leaderSkillId = monster.getLeaderSkill().id;
// 	let skill = SKILL_DATA[leaderSkillId];
// 	let firstSkill = skill[6];
// 	let secondSkill = skill[7];

// 	let firstSkilLDetails = SKILL_DATA[firstSkill];
// 	if (!firstSkilLDetails) continue;
// 	let firstSkillType = firstSkilLDetails[2];

// 	if (firstSkillType === SEARCH_FOR) console.log(monster.getName());

// 	if (!secondSkill) continue;

// 	let secondSkillDetail = SKILL_DATA[secondSkill];
// 	let secondSkillType = secondSkillDetail[2];

// 	if (secondSkillType === SEARCH_FOR) console.log(monster.getName());
// }
// process.exit();

const MONSTER_ID = 2519;
// let monster = new MonsterParser(MONSTER_ID);
// let leaderSkillId = monster.getLeaderSkill().id;
// let result;

// try {
// 	let skillId = SKILL_DATA[leaderSkillId][6];
// 	let ls = new LeaderSkill(skillId);
// 	result = ls.testOutput();
// } catch (error) {
// 	let skillId = SKILL_DATA[leaderSkillId][7];
// 	let ls = new LeaderSkill(skillId);
// 	result = ls.testOutput();
// }

// console.log(result);
