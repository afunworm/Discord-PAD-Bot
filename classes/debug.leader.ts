const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { LeaderSkill } from './leaderSkill.class';

//Skill test
const MONSTER_ID = 5390;
let monster = new MonsterParser(MONSTER_ID);
let leaderSkillId = monster.getLeaderSkill().id;

console.log('\n+=======================================================+');
console.log('| ' + monster.getName().padEnd(54, ' ') + '|');
console.log('+=======================================================+');

if (SKILL_DATA[leaderSkillId][2] === 138) {
	//Multipart
	let skills = SKILL_DATA[leaderSkillId];
	let skillIds = [];

	for (let i = 6; i < skills.length; i++) {
		skillIds.push(skills[i]);
	}

	skillIds.forEach((skillId, index) => {
		let skillData = SKILL_DATA[skillId];
		let ls = new LeaderSkill(skillData);
		let result = ls.testOutput();
		console.log((index !== 0 ? '---\n' : '') + result);
	});
} else {
	let skillData = SKILL_DATA[leaderSkillId];
	let ls = new LeaderSkill(skillData);
	let result = ls.testOutput();
	console.log(result);
}
process.exit();
// Find all cards with skill type of
let SEARCH_FOR = 129;
try {
	for (let i = 1; i <= 6450; i++) {
		let monster = new MonsterParser(i);
		let leaderSkillId = monster.getLeaderSkill().id;
		let skill = SKILL_DATA[leaderSkillId];

		let isMultipart = skill[2] === 138;

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
