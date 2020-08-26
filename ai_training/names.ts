/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import { MonsterParser } from '../classes/monsterParser.class';
import { CUSTOM_NAMES } from './customNames';
import { MANUAL_LIST } from './manualList';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let data = [];
let computedNameTracker = [];

function computeNames(fullName: string): string[] {
	let synonyms = [];

	//Automatic synonym extract for computed names
	if (fullName.includes(',')) {
		//Calculated by splitting ',' and determining real name WITHOUT the content inside ()
		let nameParts = fullName.replace(/(\(.*\))/gi, '').split(',');
		let name =
			//In case of special character like DQXQ
			nameParts[0].trim().replace(/[^a-z A-Z]/gi, '').length >=
			nameParts[1].trim().replace(/[^a-z A-Z]/gi, '').length
				? nameParts[1].trim()
				: nameParts[0].trim();

		//Only push if the name has never been computed
		if (!computedNameTracker.includes(name)) {
			synonyms.push(name);
			computedNameTracker.push(name);
		}

		//Calculated by splitting ',' and determining real name with the content inside ()
		nameParts = fullName.replace('(', '').replace(')', '').split(',');
		name =
			//In case of special character like DQXQ
			nameParts[0].trim().replace(/[^a-z A-Z]/gi, '').length >=
			nameParts[1].trim().replace(/[^a-z A-Z]/gi, '').length
				? nameParts[1].trim()
				: nameParts[0].trim();

		//Only push if the name has never been computed
		if (!computedNameTracker.includes(name)) {
			synonyms.push(name);
			computedNameTracker.push(name);
		}
	} else {
		//Process info for names with '()' but without ',' like 'Superman (Comics)'
		if (fullName.includes('(') && fullName.includes(')')) {
			let name = fullName.replace(/(\(.*\))/gi, '').trim();

			//Only push if the name has never been computed
			if (!computedNameTracker.includes(name)) {
				synonyms.push(name);
				computedNameTracker.push(name);
			}
		}
	}

	//Automatic synonym extract for Super Reincarnated
	if (fullName.includes('super reincarnated')) {
		let name = fullName.replace('super reincarnated', '').trim();
		let replacements = ['sr', 'srevo'];
		let nameParts = name.split(' ');

		//Let's train all variations of name. For example: Viper Orochi can be Viper or Orochi
		nameParts.forEach((namePart) => {
			replacements.forEach((replacement) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(replacement + ' ' + namePart)) {
					synonyms.push(replacement + ' ' + namePart);
					computedNameTracker.push(replacement + ' ' + namePart);
				}
			});
		});

		//Also train fullname
		replacements.forEach((replacement) => {
			//Only push if the name has never been computed
			if (!computedNameTracker.includes(replacement + ' ' + name)) {
				synonyms.push(replacement + ' ' + name);
				computedNameTracker.push(replacement + ' ' + name);
			}
		});
	}

	return synonyms;
}

(async () => {
	for (let id = startNumber; id < endNumber; id++) {
		try {
			let monster = new MonsterParser(id);
			if (!monster.getName().includes('*****') && !monster.getName().includes('????')) {
				//If the id is in the MANUAL_LIST, just replace and do nothing else
				if (MANUAL_LIST[id]) {
					MANUAL_LIST[id].forEach((replacedName) => computedNameTracker.push(replacedName));
					data.push({
						value: id.toString(),
						synonyms: [id.toString(), ...MANUAL_LIST[id]],
					});
					continue;
				}

				let synonyms = [];
				let allowedOptional = [
					'(dark color)',
					'(ilmina)',
					'(romia)',
					'(film)',
					'(comics)',
					'(suzaku)',
					'(seiryuu)',
					'(genbu)',
					'(kirin)',
					'(byakko)',
					'(megazord)',
					'(bronze)',
					'(silver)',
					'(gold)',
					'(rainbow)',
					'(fate/stay night (hf))',
				];
				let noComputedName = [
					823, //Torrential Fenrir Knight, Kamui -> Kamui will overlap
					2740, //Reincarnated Fenrir Knight, Kamui
				];

				let monsterName = monster.getName().replace('"', '\\"');

				let optional = monsterName.toLowerCase().match(/(\(.*\))/gi);
				if (optional !== null && optional.length > 0) {
					if (!allowedOptional.includes(optional[0])) {
						monsterName = monsterName.replace(/(\(.*\))/gi, '');
					}
				}

				monsterName = monsterName.trim().toLowerCase();

				//Use this to overwrite already-existed custom monster main name
				computedNameTracker.push(monsterName.replace('(', '').replace(')', ''));

				let computedNames = noComputedName.includes(id) ? [] : computeNames(monsterName);
				synonyms.push(id.toString(), monsterName.replace('(', '').replace(')', ''), ...computedNames);

				//Run for custom names replacement too
				CUSTOM_NAMES.forEach((customNameData) => {
					let monsterName = monster
						.getName()
						.replace('"', '\\"')
						.replace(/(\(.*\))/gi, '')
						.trim()
						.toLowerCase();
					let customName = customNameData.name;
					let customAlias = customNameData.alias;

					customAlias.forEach((customAlia) => {
						if (!monsterName.includes(customName)) return;
						let alia = monsterName.replace(customName, customAlia);

						let computedNames = computeNames(monsterName);
						synonyms.push(alia, ...computedNames);
					});
				});

				data.push({
					value: id.toString(),
					synonyms: synonyms,
				});
			}
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	await fs.writeFileSync('./monsterNames.json', JSON.stringify(data, null, 0));

	console.log('Name training file for AI is ready at /ai_training/monsterNames.json');
	process.exit();
})();
