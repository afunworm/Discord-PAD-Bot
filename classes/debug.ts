const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { LeaderSkill } from './leaderSkill.class';

//Skill test
const MONSTER_ID = 2242;
let monster = new MonsterParser(MONSTER_ID);
let leaderSkillId = monster.getLeaderSkill().id;

console.log('\n===========');

try {
	if (SKILL_DATA[leaderSkillId][2] === 138 || SKILL_DATA[leaderSkillId][2] === 116) {
		//Multipart
		let skillId = SKILL_DATA[leaderSkillId][6];
		let skillData = SKILL_DATA[skillId];
		let ls = new LeaderSkill(skillData);
		let result = ls.testOutput();
		console.log(result);

		skillId = SKILL_DATA[leaderSkillId][7];
		skillData = SKILL_DATA[skillId];
		ls = new LeaderSkill(skillData);
		result = ls.testOutput();
		console.log('---\n' + result);
	} else {
		let skillData = SKILL_DATA[leaderSkillId];
		let ls = new LeaderSkill(skillData);
		let result = ls.testOutput();
		console.log(result);
	}
} catch (error) {
	//Only multipart skill will catch errors
	let skillId = SKILL_DATA[leaderSkillId][7];
	let ls = new LeaderSkill(skillId);
	let result = ls.testOutput();
	console.log(result);
}
process.exit();
// Find all cards with skill type of
let SEARCH_FOR = 61;
try {
	for (let i = 1; i <= 6450; i++) {
		let monster = new MonsterParser(i);
		let leaderSkillId = monster.getLeaderSkill().id;
		let skill = SKILL_DATA[leaderSkillId];

		let isMultipart = skill[2] === 138 || skill[2] === 116;

		if (isMultipart) {
			let firstSkill = skill[6];
			let secondSkill = skill[7];

			let firstSkilLDetails = SKILL_DATA[firstSkill];
			if (!firstSkilLDetails) continue;
			let firstSkillType = firstSkilLDetails[2];

			if (firstSkillType === SEARCH_FOR) {
				console.log(monster.getId() + ' - ' + monster.getName());
			}

			if (!secondSkill) continue;

			let secondSkillDetail = SKILL_DATA[secondSkill];
			let secondSkillType = secondSkillDetail[2];

			if (secondSkillType === SEARCH_FOR) {
				console.log(monster.getId() + ' - ' + monster.getName());
			}
		} else {
			if (skill[2] === SEARCH_FOR) {
				console.log(monster.getId() + ' - ' + monster.getName());
			}
		}
	}
} catch (error) {
	process.exit();
}
