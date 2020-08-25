/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import { MonsterParser } from '../classes/monsterParser.class';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);
let data = [];

(async () => {
	for (let id = startNumber; id < endNumber; id++) {
		try {
			let monster = new MonsterParser(id);
			data.push(id + '. ' + monster.getName());
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	await fs.writeFileSync('./monsterName.txt', data.join('\n')); //For debugging

	console.log('Database parsing completed');
	process.exit();
})();
