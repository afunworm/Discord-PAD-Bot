const { skill: SKILL_DATA } = require('../download_skill_data.json');
import { MonsterParser } from '../classes/monsterParser.class';
import { LeaderSkill } from './leaderSkill.class';

// Find all cards with ID
let SEARCH_FOR = 17;
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
            let firstSkillType = firstSkilLDetails[2];)

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

process.exit();

const MONSTER_ID = 1221;
let monster = new MonsterParser(MONSTER_ID);
let leaderSkillId = monster.getLeaderSkill().id;

try {
	let skillId = SKILL_DATA[leaderSkillId][6];
	let ls = new LeaderSkill(skillId);
	let result = ls.testOutput();
	console.log(result);

	skillId = SKILL_DATA[leaderSkillId][7];
	ls = new LeaderSkill(skillId);
	result = ls.testOutput();
	console.log(result);
} catch (error) {
	let skillId = SKILL_DATA[leaderSkillId][7];
	let ls = new LeaderSkill(skillId);
	let result = ls.testOutput();
	console.log(result);
}
