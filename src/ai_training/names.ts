/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
require('dotenv').config({ path: '../.env' });
import { MonsterParser } from '../classes/monsterParser.class';
import { CUSTOM_NAMES } from './customNames';
import { ADDITIONAL_NAMES } from './additionalNames';
import { MANUAL_LIST } from './manualList';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let data = [];
let computedNameTracker = [];

function computeCustomNames(monsterName: string, monster: MonsterParser): string[] {
	let synonyms = [];

	//Run for custom names replacement too
	CUSTOM_NAMES.forEach((customNameData) => {
		let customName = customNameData.name;
		let customAlias = customNameData.alias;

		customAlias.forEach((customAlia) => {
			if (!monsterName.includes(customName)) return;
			let alia = monsterName.replace(customName, customAlia);

			let computedNames = computeNames(monsterName, monster);
			synonyms.push(alia, ...computedNames);
		});
	});

	return synonyms;
}

function computePrefixes(processedName: string, prefixes: string[]): string[] {
	let nameParts = processedName.split(' ');
	let synonyms = [];

	//Let's train all variations of name. For example: Viper Orochi can be Viper or Orochi
	nameParts.forEach((namePart) => {
		prefixes.forEach((prefix) => {
			synonyms.push(prefix + namePart);
		});
	});

	//Also train fullname
	prefixes.forEach((prefix) => {
		synonyms.push(prefix + processedName);
	});

	return synonyms;
}

function guessName(fullName: string, withParenthesesContent: boolean = false): string {
	//Calculated by splitting ',' and determining real name WITHOUT the content inside ()
	let nameParts = withParenthesesContent
		? fullName.replace('(', '').replace(')', '').trim().split(',')
		: fullName
				.replace(/(\(.*\))/gi, '')
				.trim()
				.split(',');
	let name =
		//In case of special character like DQXQ
		nameParts[0].trim().replace(/[^a-z A-Z]/gi, '').length >= nameParts[1].trim().replace(/[^a-z A-Z]/gi, '').length
			? nameParts[1].trim()
			: nameParts[0].trim();

	return name;
}

function computeNames(fullName: string, monster: MonsterParser): string[] {
	let synonyms = [];

	//Automatic synonym extract for computed names
	if (fullName.includes(',')) {
		let name = guessName(fullName, false); //Without anything between (***)

		//Only push if the name has never been computed
		if (!computedNameTracker.includes(name)) {
			synonyms.push(name);
			computedNameTracker.push(name);
		}

		name = guessName(fullName, true); //Without ( and ) only, keep content inside
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

	//Train for Super Reincarnated
	if (fullName.includes('super reincarnated')) {
		let processedName = fullName.replace('super reincarnated', '').trim();
		let prefixes = ['sr ', 'srevo '];

		computePrefixes(processedName, prefixes).forEach((computedName) => {
			//Only push if the name has never been computed
			if (!computedNameTracker.includes(computedName)) {
				synonyms.push(computedName);
				computedNameTracker.push(computedName);
			}
		});
	}

	//Train for PAD Island
	if (monster.getMonsterSeries() === 'beach') {
		let prefixes = ['beach '];

		if (fullName.includes(',')) {
			//Calculated by splitting ',' and determining real name with the content inside ()
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for June Bride
	if (monster.getMonsterSeries() === 'wedding') {
		let prefixes = ['bride ', 'wedding '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for Halloween
	if (monster.getMonsterSeries() === 'halloween') {
		let prefixes = ['halloween '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for New Year
	if (monster.getMonsterSeries() === 'ny') {
		let prefixes = ['ny ', 'new year ', 'newyear '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for Christmas
	if (monster.getMonsterSeries() === 'xmas') {
		let prefixes = ['xmas ', 'christmas '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for Valentines
	if (monster.getMonsterSeries() === 'valentine') {
		let prefixes = ['valentine ', 'valentines ', 'v'];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//Train for PAD Acedamy
	if (monster.getMonsterSeries() === 'academy') {
		let prefixes = ['academy ', 'school '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				//Only push if the name has never been computed
				if (!computedNameTracker.includes(computedName)) {
					synonyms.push(computedName);
					computedNameTracker.push(computedName);
				}
			});
		}
	}

	//@TODO: Train on pixel, awoken, ultimate evo, super ultimate evo, reincarnated, equips

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

				let computedNames = noComputedName.includes(id) ? [] : computeNames(monsterName, monster);
				synonyms.push(id.toString(), monsterName.replace('(', '').replace(')', ''), ...computedNames);

				//Run for custom names replacement too
				synonyms.forEach((synonym) => {
					synonyms.push(...computeCustomNames(synonym, monster));
				});

				//Add in additional names
				if (ADDITIONAL_NAMES[id.toString()]) {
					let additonalNames = ADDITIONAL_NAMES[id.toString()];
					additonalNames.forEach((additionalName) => {
						if (!computedNameTracker.includes(additionalName)) {
							computedNameTracker.push(additionalName);
							synonyms.push(additionalName);
						}
					});
				}

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
