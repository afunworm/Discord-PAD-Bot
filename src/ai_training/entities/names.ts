/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
import { MonsterParser } from '../../classes/monsterParser.class';
import { CUSTOM_NAMES } from './customNames';
import { ADDITIONAL_NAMES } from './additionalNames';
import { MANUAL_LIST } from './manualList';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.HIGHEST_VALID_MONSTER_ID);
// startNumber = 3203;
// endNumber = startNumber + 1;
let data = [];
let computedNameTracker = [];
let limitedAttributeTraining = [2514];
let numberOfNamesTrained = 0;

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
	let synonyms = [];

	let shouldTrain = (name: string) => {
		let result = true;
		prefixes.forEach((prefix) => {
			if (
				name.includes(prefix) ||
				name.replace(/[^a-zA-Z0-9]/gi, '').includes(prefix) ||
				name.includes(prefix.replace(/[^a-zA-Z0-9]/gi, ''))
			)
				result = false;
		});
		return result;
	};

	prefixes.forEach((prefix) => {
		if (!shouldTrain(processedName)) return;

		synonyms.push(prefix + processedName);
	});

	return synonyms;
}

function shouldLimitAttributeTraining(monster: MonsterParser) {
	return limitedAttributeTraining.includes(monster.getId());
}

function trainAttributeReading(
	nameList: string[],
	mainAttribute: string,
	subAttribute: string | null = null,
	limitedTraining: boolean = false
): string[] {
	let groups = {
		fire: ['fire', 'red', 'r'],
		water: ['water', 'blue', 'b'],
		wood: ['wood', 'green', 'g'],
		light: ['light', 'l'],
		dark: ['dark', 'd'],
		none: ['x', ''],
	};
	let synonyms = nameList; //Return the original entries back too!
	if (!subAttribute) subAttribute = 'none';

	//Find groups of main & sub attributes
	let mainAttributeAlias = groups[mainAttribute.toLowerCase()];
	let subAttributeAlias = groups[subAttribute.toLowerCase()];

	nameList.forEach((name) => {
		if (/^\d+$/.test(name)) return; //We don't need to process IDs

		mainAttributeAlias.forEach((mainAttributeAlia) => {
			subAttributeAlias.forEach((subAttributeAlia) => {
				let trainedName;

				if (
					limitedTraining &&
					(subAttributeAlia === 'fire' || subAttributeAlia === 'water' || subAttributeAlia === 'wood')
				) {
					//People probably won't query fire green liu bei - save data processing time for AI
					return;
				}

				//For case like dark anubis
				if (subAttributeAlia === '') {
					trainedName = mainAttributeAlia + ' ' + name;
					synonyms.push(trainedName);
					return;
				}

				//Train for ab
				trainedName = mainAttributeAlia + subAttributeAlia + ' ' + name;
				synonyms.push(trainedName);

				//Train for a/b
				trainedName = mainAttributeAlia + '/' + subAttributeAlia + ' ' + name;
				synonyms.push(trainedName);

				//Train for a b
				trainedName = mainAttributeAlia + ' ' + subAttributeAlia + ' ' + name;
				synonyms.push(trainedName);
			});
		});
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
		synonyms.push(name);

		name = guessName(fullName, true); //Without ( and ) only, keep content inside
		synonyms.push(name);
	} else {
		//Process info for names with '()' but without ',' like 'Superman (Comics)'
		if (fullName.includes('(') && fullName.includes(')')) {
			let name = fullName.replace(/(\(.*\))/gi, '').trim();
			synonyms.push(name);
		} else {
			synonyms.push(fullName);
		}
	}

	//Extra training
	synonyms.forEach((name) => {
		//Also train name with -kun & -san for this version
		if (name.includes('-kun')) {
			synonyms.push(name.replace('-kun', ''));
		}
		if (name.includes('-san')) {
			synonyms.push(name.replace('-san', ''));
		}

		//Split names that contains & to train them separately
		if (name.includes('&')) {
			synonyms.push(...name.split('&').map((n) => n.replace(' ', '')));
		}
	});

	//Train for Super Reincarnated
	if (fullName.includes('super reincarnated')) {
		let processedName = fullName.replace('super reincarnated', '').trim();
		let prefixes = ['sr ', 'srevo '];

		computePrefixes(processedName, prefixes).forEach((computedName) => {
			synonyms.push(computedName);
		});
	}

	//Train for PAD Island
	if (monster.getMonsterSeries() === 'beach') {
		let prefixes = ['beach '];

		if (fullName.includes(',')) {
			//Calculated by splitting ',' and determining real name with the content inside ()
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for June Bride
	if (monster.getMonsterSeries() === 'wedding') {
		let prefixes = ['bride ', 'wedding '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for Halloween
	if (monster.getMonsterSeries() === 'halloween') {
		let prefixes = ['halloween '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for New Year
	if (monster.getMonsterSeries() === 'ny') {
		let prefixes = ['ny ', 'new year ', 'newyear '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for Christmas
	if (monster.getMonsterSeries() === 'xmas') {
		let prefixes = ['xmas ', 'christmas '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for Valentines
	if (monster.getMonsterSeries() === 'valentine') {
		let prefixes = ['valentine ', 'valentines ', 'v'];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for PAD Acedamy
	if (monster.getMonsterSeries() === 'academy') {
		let prefixes = ['academy ', 'school '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}
	}

	//Train for collab in general
	if (monster.getCollabId() !== 0) {
		let prefixes = [monster.getReadableCollab().toLowerCase() + ' '];

		if (fullName.includes(',')) {
			let name = guessName(fullName, true); //Without ( and ) only, keep content inside

			computePrefixes(name, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		} else {
			computePrefixes(fullName, prefixes).forEach((computedName) => {
				synonyms.push(computedName);
			});
		}

		if (fullName.split(' ').length === 2) {
			//Just train a litte bit extra
			let names = fullName.split(' ');
			names.forEach((name) => {
				computePrefixes(name, prefixes).forEach((computedName) => {
					synonyms.push(computedName);
				});
			});
		}
	}

	return synonyms;
}

(async () => {
	for (let id = startNumber; id < endNumber; id++) {
		try {
			let monster = new MonsterParser(id);
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

			if (!monster.getName().includes('*****') && !monster.getName().includes('????')) {
				//If the id is in the MANUAL_LIST, just replace and do nothing else
				if (MANUAL_LIST[id]) {
					let synonyms = [id.toString()];
					MANUAL_LIST[id].forEach((replacedName) => {
						synonyms.push(replacedName);
					});
				} else {
					let monsterName = monster.getName().replace('"', '\\"');

					let optional = monsterName.toLowerCase().match(/(\(.*\))/gi); //Extra things between ()
					if (optional !== null && optional.length > 0) {
						if (!allowedOptional.includes(optional[0])) {
							monsterName = monsterName.replace(/(\(.*\))/gi, '');
						}
					}

					monsterName = monsterName.trim().toLowerCase();

					let computedNames = noComputedName.includes(id) ? [] : computeNames(monsterName, monster);
					synonyms.push(id.toString(), monsterName.replace('(', '').replace(')', ''), ...computedNames);

					//Run 2 word names
					if (monsterName.split(' ').length === 2) {
						let parts = monsterName.split(' ');
						parts.forEach((part) => synonyms.push(part));
					}

					//Run for custom names replacement too
					synonyms.forEach((synonym) => {
						synonyms.push(...computeCustomNames(synonym, monster));
					});

					//Add in additional names
					if (ADDITIONAL_NAMES[id.toString()]) {
						let additonalNames = ADDITIONAL_NAMES[id.toString()];
						additonalNames.forEach((additionalName) => {
							synonyms.push(additionalName);
						});
					}
				}

				//Finally, train the whole synonym entry with readable attribtues
				//Don't really need to train attribute for gems tho
				if (monster.getReadableMonsterSeries() !== 'evo_gems') {
					synonyms = trainAttributeReading(
						synonyms,
						monster.getReadableMainAttribute(),
						monster.getReadableSubAttribute(),
						shouldLimitAttributeTraining(monster)
					);
				}

				//Process the synonyms and put it to tracker
				//Remove all duplication in the synonyms itself
				//Only add the synonyms that haven't been input int if computedNameTracker
				synonyms = synonyms.reduce((a, b) => {
					if (a.indexOf(b) < 0) a.push(b);
					return a;
				}, []);
				synonyms = synonyms
					.map((synonym) => {
						if (!computedNameTracker.includes(synonym)) {
							computedNameTracker.push(synonym);
							return synonym;
						}
					})
					.filter((synonym) => synonym !== undefined);

				//If the sample contains more than 200 entries, truncate it
				if (synonyms.length > 200) {
					//Start off by truncating all names > 3 words
					synonyms = synonyms.filter((synonym) => synonym.split(' ').length <= 3);
					//Something else, but only when needed LOL
				}

				data.push({
					value: id.toString(),
					synonyms: synonyms,
				});

				numberOfNamesTrained += synonyms.length;

				console.log(
					`Training data populated for ${id}. ${monster.getName()} - ${synonyms.length} entries created.`
				);
			}
		} catch (error) {
			console.log(error.message);
			console.log('An error has occurred.');
			process.exit();
		}
	}

	await fs.writeFileSync('./monsterNames.json', JSON.stringify(data, null, 4));

	console.log(`\n\nTraining data populated successfully. ${numberOfNamesTrained} names trained.`);
	console.log('Name training file for AI is ready at ./monsterNames.json');
	process.exit();
})();
