/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import { MonsterParser } from '../classes/monsterParser.class';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let data = [];

(async () => {
	for (let id = startNumber; id < endNumber; id++) {
		try {
			let monster = new MonsterParser(id);
			if (!monster.getName().includes('*****') && !monster.getName().includes('????')) {
				// data.push(`"${id}","${monster.getName().replace('"', '\\"')}"`);
				data.push({
					value: id.toString(),
					synonyms: [id.toString(), monster.getName().replace('"', '\\"')],
				});
			}
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	// await fs.writeFileSync('./monsterName.txt', data.join('\n')); //For debugging
	await fs.writeFileSync('./monsterNames.json', JSON.stringify(data));

	console.log('Database parsing completed');
	process.exit();
})();
