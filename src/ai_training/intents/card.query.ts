export {};

const fs = require('fs');

const CARD_QUERY_TRAINING_PHRASES = [
	`what {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} have {{queryMinMax}} {{monsterAwakenings1}} from the {{monsterSeries}} collab`,
	`{{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{queryMinMax}} {{monsterAwakenings1}} from the {{monsterSeries}} series`,
	`show me {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{queryMinMax}} {{monsterAwakenings1}} from the {{monsterSeries}} collab`,
	`list {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{queryMinMax}} {{monsterAwakenings1}} from the {{monsterSeries}} series`,
	`search for {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{queryMinMax}} {{monsterAwakenings1}} from the {{monsterSeries}} collab`,
	`help me find {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{queryMinMax}} {{monsterAwakenings1}}`,
	`{{ATTRIBUTES}} {{targetObject}} from {{monsterSeries}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} from {{monsterSeries}}`,
	`{{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} from {{monsterSeries}} series`,
	`{{monsterSeries}} series`,
	`{{monsterSeries}} collab`,
	`{{targetObject}} from {{monsterSeries}} collab`,
	`{{targetObject}} from {{monsterSeries}} series`,
	`show me all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`list all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} series`,
	`I want a list of all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`What are the {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}} from bleach series`,
	`Find me all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Show me a list of {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}} from {{monsterSeries}} series`,
	`Search for all {{ATTRIBUTES}} {{queryEvoType}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Help me find all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} with {{FILTERS}} from {{monsterSeries}} collab`,
	`Search {{monsterSeries}} series for all {{ATTRIBUTES}} {{queryEvoType}} {{targetObject}} that have {{FILTERS}}`,
];

let r = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
let placers = {
	queryMinMax: () => ['the most', 'the least'][r(0, 1)],
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
	CARD_QUERY_TRAINING_PHRASES.forEach((phrase) => {
		let regex = new RegExp('{{ *ATTRIBUTES *}}', 'g');
		if (!phrase.match(regex)) {
			first.push(phrase);
			return;
		}

		//With both attribtues
		first.push(phrase.replace(regex, '{{monsterAttribute1}} {{monsterAttribute2}}'));
		first.push(phrase.replace(regex, '{{monsterAttribute1}}/{{monsterAttribute2}}'));

		//With no attributes
		first.push(phrase.replace(regex, ''));
	});

	let second = [];

	//Run through FILTERS
	first.forEach((phrase) => {
		let regex = new RegExp('{{ *FILTERS *}}', 'g');
		if (!phrase.match(regex)) {
			second.push(phrase);
			return;
		}

		second.push(phrase.replace(regex, '{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}}'));
		second.push(
			phrase.replace(
				regex,
				'{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}} and {{queryCompare2}} {{queryQuantity2}} {{monsterAwakenings2}}'
			)
		);
		second.push(
			phrase.replace(
				regex,
				'{{queryCompare1}} {{queryQuantity1}} {{monsterAwakenings1}}, {{queryCompare2}} {{queryQuantity2}} {{monsterAwakenings2}} and {{queryCompare3}} {{queryQuantity3}} {{monsterAwakenings3}}'
			)
		);
	});

	//Trim all phrases
	second = second.map((phrase) => phrase.trim().replace(/\s\s+/g, ' '));

	//Finally, run through pre-defined replacers
	let data = [];
	second.forEach((phrase) => {
		let entry = {
			isTemplate: false,
			count: 0,
			updated: null,
			// id: guid(), //Do not supply the id
			data: [],
		};

		let terms = phrase.split(' ');

		terms.forEach((term) => {
			if (term.includes('/')) {
				let multipleTerms = term.split('/');
				multipleTerms.forEach((singleTerm, index) => {
					let name = singleTerm.replace(/\{/gi, '').replace(/\}/gi, '').replace(',', '');

					if (typeof placers[name] !== 'function') {
						entry.data.push({
							text: term,
							userDefined: false,
						});
					} else {
						entry.data.push({
							text: placers[name].call().toString(),
							userDefined: true,
							alias: name,
							meta: `@${name}`,
						});
					}
					if (index !== multipleTerms.length - 1) {
						entry.data.push({
							text: '/',
							userDefined: false,
						});
					}
				});
			} else {
				let name = term.replace(/\{/gi, '').replace(/\}/gi, '').replace(',', '');

				if (typeof placers[name] !== 'function') {
					entry.data.push({
						text: term,
						userDefined: false,
					});
				} else {
					entry.data.push({
						text: placers[name].call().toString(),
						userDefined: true,
						alias: name,
						meta: `@${name}`,
					});
				}
			}

			if (term.endsWith(',')) {
				entry.data.push({
					text: ', ',
					userDefined: false,
				});
			} else {
				entry.data.push({
					text: ' ',
					userDefined: false,
				});
			}
		});

		entry.data.splice(-1, 1);
		data.push(entry);

		console.log('Completed Training Phrase: ' + phrase);
	});

	await fs.writeFileSync('./intent.card.query.json', JSON.stringify(data, null, 4));
	console.log('Intent data populated.');
})();
