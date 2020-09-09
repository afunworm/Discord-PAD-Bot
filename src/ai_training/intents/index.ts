export {};

const fs = require('fs');
import { CARD_QUERY_TRAINING_PHRASES } from './card.query';
import { CARD_QUERY_MINMAX_TRAINING_PHRASES } from './card.query.minMax';
import { CARD_INFO_TRAINING_PHRASES } from './card.info';
import { CARD_QUERY_RANDOM_TRAINING_PHRASES } from './card.query.random';

let currentlyTraining = CARD_QUERY_RANDOM_TRAINING_PHRASES;

let r = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
let placers = {
	actionType: () => ['call', 'name', 'sell', 'inherit', 'list', 'evolve', 'devolve'][r(0, 6)],
	queryMinMax: () => ['the most', 'the least', 'the highest', 'the lowest', 'most', 'least'][r(0, 5)],
	queryAdditionalTypes: () => ['random'][0],
	questionType: () => ['what', 'how', 'which'][r(0, 1)],
	targetActionType: () => ['look', 'take', 'sell'][r(0, 2)],
	targetPronoun: () => ['it', 'him', 'her', 'them', 'they', 'he', 'she'][r(0, 6)],
	queryMonsterStats: () => ['atk', 'attack', 'hp', 'health', 'rcv', 'recover'][r(0, 5)],
	queryIncludeLB: () =>
		['after 110', 'after limit break', 'when lb', 'without limit break', 'without lb', 'without limitbreak'][
			r(0, 5)
		],
	eggMachines: () => ['rare egg machine', 'event egg machine', 'collab egg machine'][r(0, 2)],
	monsterName: () => {
		let prefixes = [
			'sr ',
			'srevo ',
			'super ultimate ',
			'awoken ',
			'reincarnated ',
			'equip ',
			'assist',
			'weapon',
			'equip ',
			'assist',
			'weapon',
			'equip ',
			'assist',
			'weapon',
		];
		let prefix = Math.random() > 0.5 ? prefixes[r(0, prefixes.length - 1)] : '';
		let names = [
			'anubis',
			'myr',
			'eschamali',
			'venus',
			'tsubaki',
			'kaede',
			'hades',
			'perseus',
			'kali',
			'supergirl',
			'yusuke',
			'aamir',
			'australis',
			'saline',
			'madoo',
			'zela',
			'uriel',
			'yugi',
			'galford',
			'dark magician',
			'ilmina',
			'ilm',
			'bakura',
			'marik',
			'noctis',
			'hino',
			'izanagi',
			'izanami',
			'scheat',
			'sun wukong',
			'cotton',
			'aljea',
			'rex',
			'ideal',
			'dyer',
			'haku',
			'karin',
			'valeria',
			'fat chocobo',
			'undine',
			'roche',
			'rehven',
			'orochi',
			'senri',
			'suou',
			'gremory',
			'grigory',
			'marthis',
			'shelling ford',
			'idunn & idunna',
		];
		return prefix + names[r(0, names.length - 1)];
	},
	infoType: () =>
		[
			'photo',
			'icon',
			'awakenings',
			'name',
			'super awakenings',
			'types',
			'attack',
			'hp',
			'recover',
			'rarity',
			'stats',
			'active skills',
			'leader skills',
			'monster points',
			'evo materials',
			'evo list',
			'id',
			'info',
			'series',
			'devo materials',
		][r(0, 19)],
	queryEvoType: () =>
		[
			'equip',
			'assist',
			'equip evo',
			'assist evo',
			'normal',
			'base',
			'ultimate evolution',
			'ultimate evo',
			'uevo',
			'split evo',
			'ultimate',
			'awoken',
			'pixel',
			'reincarnated',
			'super ultimate',
			'super reincarnated',
		][r(0, 15)],
	targetObject: () => ['cards', 'card', 'monsters', 'monster'][r(0, 3)],
	monsterSeries: () =>
		[
			'yugioh',
			'dragon bound dragon callers',
			'bleach',
			'valentine',
			'monster hunter',
			'pad academy',
			'power ranger',
			'beach',
			'god fest exclusive',
		][r(0, 8)],
	queryQuantity1: () => r(1, 15),
	queryQuantity2: () => r(1, 15),
	queryQuantity3: () => r(1, 15),
	monsterAwakenings1: () =>
		[
			'skill boosts',
			'super skill boosts',
			'super blind resist',
			'super poison resist',
			'poison resist',
			'blind resist',
			'te',
			'time extend',
			'time extend plus',
			'fat finger',
			'tape resist',
			'cloud resist',
			'7c',
			'enhanced combo',
			'super enhanced combo',
			'jammer blessing',
			'poison blessing',
		][r(0, 16)],
	monsterAwakenings2: () => placers.monsterAwakenings1(),
	monsterAwakenings3: () => placers.monsterAwakenings1(),
	queryIncludeSA: () =>
		['including super awakenings', 'excluding super awakenings', 'including sa', 'excluding sa'][r(0, 3)],
	monsterAttribute1: () =>
		['fire', 'water', 'wood', 'light', 'dark', 'red', 'green', 'blue', 'r', 'g', 'b', 'l', 'd', 'x', 'none'][
			r(0, 14)
		],
	monsterAttribute2: () => placers.monsterAttribute1(),
	queryCompare1: () =>
		['at least', 'at most', 'exactly', 'no more than', 'no less than', 'more than', 'less than'][r(0, 6)],
	queryCompare2: () => placers.queryCompare1(),
	queryCompare3: () => placers.queryCompare1(),
};

let guid = () => {
	let randomParts = (l: number) => {
		let accepted = 'abcdefghiklmnoqrstuvwxyz0123456789'.split('');
		let result = '';
		for (let i = 0; i < l; i++) {
			result += accepted[Math.floor(Math.random() * accepted.length)];
		}
		return result;
	};

	return `${randomParts(8)}-${randomParts(4)}-${randomParts(4)}-${randomParts(4)}-${randomParts(12)}`;
};

(async () => {
	//Only process the pre-defined placers
	let first = [];

	//Run through attributes
	currentlyTraining.forEach((phrase) => {
		let regex = new RegExp('{{ *ATTRIBUTES *}}', 'g');
		if (phrase.match(regex)) {
			//With both attribtues
			first.push(phrase.replace(regex, '{{monsterAttribute1}} {{monsterAttribute2}}'));
			first.push(phrase.replace(regex, '{{monsterAttribute1}}/{{monsterAttribute2}}'));

			//With 1 attribute
			first.push(phrase.replace(regex, '{{monsterAttribute1}}'));

			//With no attributes
			first.push(phrase.replace(regex, ''));
		} else {
			first.push(phrase);
		}
	});

	let second = [];

	//Run through with monster names
	first.forEach((phrase) => {
		let regex = new RegExp('{{ *MONSTER *}}', 'g');
		if (phrase.match(regex)) {
			//With a monster name, randomly with prefixes
			second.push(phrase.replace(regex, '{{monsterName}}'));

			//With a pronoun
			second.push(phrase.replace(regex, '{{targetPronoun}}'));
		} else {
			second.push(phrase);
		}
	});

	let third = [];

	//Run through FILTERS
	second.forEach((phrase) => {
		let regex = new RegExp('{{ *FILTERS *}}', 'g');
		if (!phrase.match(regex)) {
			third.push(phrase);
			return;
		}

		third.push(
			phrase.replace(regex, '{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}} {{queryIncludeSA}}')
		);
		third.push(
			phrase.replace(
				regex,
				'{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}} and {{queryCompare2}} {{queryQuantity2}} {{monsterAwakenings2}} {{queryIncludeSA}}'
			)
		);
		third.push(
			phrase.replace(
				regex,
				'{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}}, {{queryCompare2}} {{queryQuantity2}} {{monsterAwakenings2}} and {{queryCompare3}} {{queryQuantity3}} {{monsterAwakenings3}} {{queryIncludeSA}}'
			)
		);
	});

	//Trim all phrases
	third = third.map((phrase) => phrase.trim().replace(/\s\s+/g, ' '));

	//Finally, run through pre-defined replacers
	let data = [];
	third.forEach((phrase) => {
		let entry = {
			isTemplate: false,
			count: 0,
			updated: null,
			// id: guid(), //Do not supply the id
			data: [],
		};
		let str = '';

		let terms = phrase.split(' ');

		terms.forEach((term) => {
			if (term.includes('/')) {
				let multipleTerms = term.split('/');
				multipleTerms.forEach((singleTerm, index) => {
					let name = singleTerm.replace(/\{/gi, '').replace(/\}/gi, '').replace(',', '').replace(`'s`, '');

					if (typeof placers[name] !== 'function') {
						if (name.includes(':')) {
							//If name is specifically defined (entityName:phrase1:phrase2, etc,) train it that way
							let parts = name.split(':');
							let entityName = parts[0];
							let options = [];
							parts.forEach((part, index) => {
								if (index !== 0) options.push(part);
							});
							let word = options[r(0, options.length - 1)];
							word = word.replace(/_/gi, ' ');
							entry.data.push({
								text: word,
								userDefined: true,
								alias: entityName,
								meta: `@${entityName}`,
							});
							str += word;
						} else if (name === 'sysNumber') {
							let number = r(1, 500);
							entry.data.push({
								text: number.toString(),
								userDefined: false,
								alias: 'number',
								meta: '@sys.number',
							});
							str += number;
						} else {
							entry.data.push({
								text: term,
								userDefined: false,
							});
							str += term;
						}
					} else {
						entry.data.push({
							text: placers[name].call().toString(),
							userDefined: true,
							alias: name,
							meta: `@${name}`,
						});
						str += placers[name].call().toString();
					}
					if (index !== multipleTerms.length - 1) {
						entry.data.push({
							text: '/',
							userDefined: false,
						});
						str += '/';
					}
				});
			} else {
				let name = term.replace(/\{/gi, '').replace(/\}/gi, '').replace(',', '').replace(`'s`, '');

				if (typeof placers[name] !== 'function') {
					if (name.includes(':')) {
						//If name is specifically defined (entityName:phrase1:phrase2, etc,) train it that way
						let parts = name.split(':');
						let entityName = parts[0];
						let options = [];
						parts.forEach((part, index) => {
							if (index !== 0) options.push(part);
						});
						let word = options[r(0, options.length - 1)];
						word = word.replace(/_/gi, ' ');
						entry.data.push({
							text: word,
							userDefined: true,
							alias: entityName,
							meta: `@${entityName}`,
						});
						str += word;
					} else if (name === 'sysNumber') {
						let number = r(1, 500);
						entry.data.push({
							text: number.toString(),
							userDefined: false,
							alias: 'number',
							meta: '@sys.number',
						});
						str += number;
					} else {
						entry.data.push({
							text: term,
							userDefined: false,
						});
						str += term;
					}
				} else {
					entry.data.push({
						text: placers[name].call().toString(),
						userDefined: true,
						alias: name,
						meta: `@${name}`,
					});
					str += placers[name].call().toString();
				}
			}

			if (term.endsWith(',')) {
				entry.data.push({
					text: ', ',
					userDefined: false,
				});
				str += ', ';
			} else if (term.endsWith(`'s`)) {
				entry.data.push({
					text: `'s`,
					userDefined: false,
				});
				str += `'s `;
			} else {
				entry.data.push({
					text: ' ',
					userDefined: false,
				});
				str += ' ';
			}
		});

		entry.data.splice(-1, 1);
		data.push(entry);

		console.log('Completed Training Phrase: ' + str);
	});

	await fs.writeFileSync('./intent.json', JSON.stringify(data, null, 4));
	console.log(`Intent data populated. ${second.length} phrase(s) trained.`);
})();
