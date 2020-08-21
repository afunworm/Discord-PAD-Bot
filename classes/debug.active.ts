const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { ActiveSkill } from './activeSkill.class';

//Skill test
const MONSTER_ID = 5359;
let monster = new MonsterParser(MONSTER_ID);
let skillId = monster.getActiveSkill().id;

console.log('\n+=======================================================+');
console.log('| ' + monster.getName().padEnd(54, ' ') + '|');
console.log('+=======================================================+');

if (SKILL_DATA[skillId][2] === 116) {
	//Multipart
	let skills = SKILL_DATA[skillId];
	let skillIds = [];

	for (let i = 6; i < skills.length; i++) {
		skillIds.push(skills[i]);
	}

	skillIds.forEach((skillId, index) => {
		let skillData = SKILL_DATA[skillId];
		let ls = new ActiveSkill(skillData);
		let result = ls.testOutput();
		console.log(`[${index + 1}] ` + result);
	});
} else {
	let skillData = SKILL_DATA[skillId];
	let ls = new ActiveSkill(skillData);
	let result = ls.testOutput();
	console.log(`[1] ` + result);
}
console.log('');
process.exit();
// Find all cards with skill type of
let SEARCH_FOR = 47;
try {
	for (let i = 1; i <= 6450; i++) {
		let monster = new MonsterParser(i);
		let skillId = monster.getActiveSkill().id;
		let skill = SKILL_DATA[skillId];

		let isMultipart = skill[2] === 116;

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
