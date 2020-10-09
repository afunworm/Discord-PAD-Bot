/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
import { MonsterParser } from '../../classes/monsterParser.class';
import { CUSTOM_NAMES } from './customNames';
import { ADDITIONAL_NAMES } from './additionalNames';
import { MANUAL_LIST } from './manualList';
import { JAPANESE_NAMES } from '../../shared/monster.japanese';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.HIGHEST_VALID_MONSTER_ID);
// startNumber = 4787;
// endNumber = startNumber;
let data = [];
let computedNameTracker = [];
let limitedAttributeTraining = [2514];
let numberOfNamesTrained = 0;
let mainNames = ['valkyrie'];

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

function trainAttributeReadingWithCustomGroups(
	nameList: string[],
	mainAttribute: string,
	subAttribute: string | null = null,
	limitedTraining: boolean = false,
	groups = {}
): string[] {
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
				if (
					(subAttributeAlia === '' || subAttributeAlia === 'x' || subAttributeAlia === 'none') &&
					mainAttributeAlia !== 'x' &&
					mainAttributeAlia !== '' &&
					mainAttributeAlia !== 'none'
				) {
					trainedName = mainAttributeAlia + ' ' + name;
					synonyms.push(trainedName);
					return;
				}

				//Train for ab IF a is not none OR alia is not fully spelled of an attribute
				if (
					mainAttributeAlia !== 'x' &&
					mainAttributeAlia !== 'none' &&
					mainAttributeAlia !== '' &&
					!['fire', 'red', 'wood', 'green', 'water', 'blue', 'light', 'dark'].includes(mainAttributeAlia) &&
					!['fire', 'red', 'wood', 'green', 'water', 'blue', 'light', 'dark'].includes(subAttributeAlia)
				) {
					trainedName = mainAttributeAlia + subAttributeAlia + ' ' + name;
					synonyms.push(trainedName);
				}

				//Train for a/b IF a is not none
				if (mainAttributeAlia !== 'x' && mainAttributeAlia !== 'none' && mainAttributeAlia !== '') {
					trainedName = mainAttributeAlia + '/' + subAttributeAlia + ' ' + name;
					synonyms.push(trainedName);
				}

				//Train for a b IF a is not none
				if (mainAttributeAlia !== 'x' && mainAttributeAlia !== 'none' && mainAttributeAlia !== '') {
					trainedName = mainAttributeAlia + ' ' + subAttributeAlia + ' ' + name;
					synonyms.push(trainedName);
				}
			});
		});
	});

	return synonyms;
}

function trainAttributeReading(
	nameList: string[],
	mainAttribute: string,
	subAttribute: string | null = null,
	limitedTraining: boolean = false,
	customGroup = {}
): string[] {
	let synonyms = nameList; //Return the original entries back too!
	synonyms = [
		...synonyms,
		...trainAttributeReadingWithCustomGroups(nameList, mainAttribute, subAttribute, limitedTraining, {
			fire: ['fire', 'red'],
			water: ['water', 'blue'],
			wood: ['wood', 'green'],
			light: ['light'],
			dark: ['dark'],
			none: ['x', ''],
			jammer: ['x', ''],
		}),
		...trainAttributeReadingWithCustomGroups(nameList, mainAttribute, subAttribute, limitedTraining, {
			fire: ['r'],
			water: ['b'],
			wood: ['g'],
			light: ['l'],
			dark: ['d'],
			none: ['x', ''],
			jammer: ['x', ''],
		}),
	];

	return synonyms;
}

function guessName(fullName: string, withParenthesesContent: boolean = false): string {
	//If card already includes the name precomputed above, it is the name
	let mapped = '';
	mainNames.forEach((name) => {
		if (fullName.includes(name)) mapped = name;
	});
	if (mapped.length) return mapped;

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

	//Train for series in general
	if (monster.getMonsterSeries() !== null) {
		let series = monster.getMonsterSeries();
		let prefixes = [];

		if (series === 'dbdc') prefixes = ['dbdc '];
		if (series === 'heroine') prefixes = ['heroine ', 'heroin '];
		if (series === 'dbdc') prefixes = ['dbdc '];
		if (series === 'chibi') prefixes = ['chibi ', 'mini '];
		if (series === 'xmas') prefixes = ['xmas ', 'christmas '];
		if (series === 'academy') prefixes = ['academy ', 'school ', 'pad academy '];
		if (series === 'beach') prefixes = ['beach ', 'b', 'bikini ', 'pad island '];
		if (series === 'halloween') prefixes = ['halloween '];
		if (series === 'ny') prefixes = ['ny ', 'new year ', 'newyear '];
		if (series === 'bride') prefixes = ['bride ', 'wedding '];
		if (series === 'valentine') prefixes = ['v ', 'valentine ', 'v', 'valentines '];

		if (prefixes.length > 0) {
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
	}

	//Train for collab in general
	if (monster.getCollabId() !== 0) {
		let collab = monster.getCollabId();
		let prefixes = [monster.getReadableCollab().toLowerCase() + ' '];

		//Manually replace training
		if (collab === 2) prefixes = ['taiko', 'donchan', 'don chan'].map((n) => n + ' ');
		if (collab === 6) prefixes = ['ffcd', 'defender'].map((n) => n + ' ');
		if (collab === 8) prefixes = ['punt', 'princess punt'].map((n) => n + ' ');
		if (collab === 10) prefixes = ['shinrabansho', 'shinra'].map((n) => n + ' ');
		if (collab === 11) prefixes = ['kapibara', 'kapybara', 'kapi', 'kapy'].map((n) => n + ' ');
		if (collab === 14) prefixes = ['eva', 'evagelion', 'evangelion'].map((n) => n + ' ');
		if (collab === 16) prefixes = ['coc', 'clash of clans'].map((n) => n + ' ');
		if (collab === 26) prefixes = ['hxh'].map((n) => n + ' ');
		if (collab === 27) prefixes = ['sanrio', 'hello kitty', 'kitty', 'hello'].map((n) => n + ' ');
		if (collab === 30) prefixes = ['dbz', 'db'].map((n) => n + ' ');
		if (collab === 26) prefixes = ['hxh'].map((n) => n + ' ');
		if (
			collab === 32 ||
			collab === 33 ||
			collab === 34 ||
			collab === 34 ||
			collab === 71 ||
			collab === 72 ||
			collab === 73
		)
			prefixes = ['gungho', 'gh'].map((n) => n + ' ');
		if (collab === 38 || collab === 53) prefixes = ['dc'].map((n) => n + ' ');
		if (collab === 40) prefixes = ['fotns', 'fist'].map((n) => n + ' ');
		if (collab === 41 || collab === 44) prefixes = ['chibi', 'mini'].map((n) => n + ' ');
		if (collab === 45) prefixes = ['ff'].map((n) => n + ' ');
		if (collab === 46) prefixes = ['gits'];
		if (collab === 47) prefixes = ['dm', 'duel masters'].map((n) => n + ' ');
		if (collab === 48) prefixes = ['aot'].map((n) => n + ' ');
		if (collab === 50) prefixes = ['sunday', 'shonen', 'jump'].map((n) => n + ' ');
		if (collab === 51) prefixes = ['crow'].map((n) => n + ' ');
		if (collab === 48) prefixes = ['aot'].map((n) => n + ' ');
		if (collab === 56) prefixes = ['kenshin'].map((n) => n + ' ');
		if (collab === 48) prefixes = ['aot'].map((n) => n + ' ');
		if (collab === 61) prefixes = ['mh', 'monhun'].map((n) => n + ' ');
		if (collab === 65) prefixes = ['fma'].map((n) => n + ' ');
		if (collab === 66) prefixes = ['kof'].map((n) => n + ' ');
		if (collab === 67) prefixes = ['yyh', 'yuyu', 'yusuke'].map((n) => n + ' ');
		if (collab === 70) prefixes = ['magic', 'mtg'].map((n) => n + ' ');
		if (collab === 76) prefixes = ['sao'].map((n) => n + ' ');
		if (collab === 77) prefixes = ['kamen', 'rider', 'kr'].map((n) => n + ' ');
		if (collab === 78 || collab === 86) prefixes = ['pr', 'mmpr'].map((n) => n + ' ');
		if (collab === 79) prefixes = ['fate'].map((n) => n + ' ');
		if (collab === 81) prefixes = ['sf', 'sfv', 'sf5', 'street fighter', 'streetfighter'].map((n) => n + ' ');
		if (collab === 82) prefixes = ['mc', 'mcdonald'].map((n) => n + ' ');
		if (collab === 83) prefixes = ['sk', 'shaman'].map((n) => n + ' ');
		if (collab === 85) prefixes = ['ss', 'samurai shodown', 'samurai showdown', 'samsho'].map((n) => n + ' ');
		if (collab === 87) prefixes = ['fujimi', 'fantasia'].map((n) => n + ' ');
		if (collab === 89) prefixes = ['ygo', 'yugioh', 'yugi'].map((n) => n + ' ');
		if (collab === 90) prefixes = ['mickey', 'disney'].map((n) => n + ' ');
		if (collab === 91) prefixes = ['devil may cry', 'dmc'].map((n) => n + ' ');
		if (collab === 92) prefixes = ['mha'].map((n) => n + ' ');

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
	for (let id = startNumber; id <= endNumber; id++) {
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

			let rawMonsterName = monster.getName();
			if (rawMonsterName.includes('*') && !rawMonsterName.includes('??')) {
				//Atttempt to use Japanese names
				if (typeof JAPANESE_NAMES[monster.getId().toString()] === 'string') {
					rawMonsterName = JAPANESE_NAMES[monster.getId().toString()];
				}
			}

			if (!rawMonsterName.includes('*') && !rawMonsterName.includes('??')) {
				//If the id is in the MANUAL_LIST, just replace and do nothing else
				if (MANUAL_LIST[id]) {
					let synonyms = [id.toString()];
					MANUAL_LIST[id].forEach((replacedName) => {
						synonyms.push(replacedName);
					});
				} else {
					let monsterName = rawMonsterName.replace('"', '\\"');

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
					`Training data populated for ${id}. ${rawMonsterName} - ${synonyms.length} entries created.`
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
