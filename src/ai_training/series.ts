import { MONSTER_SERIES } from '../shared/monster.series';
import { MONSTER_COLLABS } from '../shared/monster.collabs';
const fs = require('fs');

let camelize = (input: string) =>
	input
		.toLowerCase()
		.replace(/[^a-zA-Z0-9]/gi, ' ')
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
		.replace(/\s+/g, '');

let getInitials = (input: string) =>
	input
		.toLowerCase()
		.split(' ')
		.map((n) => n[0])
		.join('');

let data = [];
let computedNameTracker = [];
let numberOfNamesTrained = 0;

(async () => {
	MONSTER_SERIES.forEach((series) => {
		let name = series.name.toLowerCase().replace(/[^a-zA-Z0-9]/gi, ' ');
		let alias = series.aliases;
		let id = camelize(name);
		let synonyms = [];

		//Train for full name
		synonyms.push(name);
		alias.forEach((alia) => {
			synonyms.push(alia.toLowerCase().replace(/[^a-zA-Z0-9]/gi, ' '));
		});

		//Train for parts of names
		let nameParts = name.split(' ');
		nameParts.forEach((namePart) => {
			synonyms.push(namePart);
		});

		//Train for initials
		let initials = getInitials(name);
		synonyms.push(initials);

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

		data.push({
			value: id,
			synonyms: synonyms,
		});

		numberOfNamesTrained += synonyms.length;

		console.log(`Training data populated for series ${series.name}. ${synonyms.length} entries created.`);
	});

	for (let collabId in MONSTER_COLLABS) {
		let collab = MONSTER_COLLABS[collabId];
		let name = collab.name.toLowerCase().replace(/[^a-zA-Z0-9\-\/]/gi, ' ');
		let alias = collab.aliases;
		let id = collabId; //Collab uses Id
		let synonyms = [];

		//Train for full name
		synonyms.push(name);
		alias.forEach((alia) => {
			synonyms.push(alia.toLowerCase().replace(/[^a-zA-Z0-9]/gi, ' '));
		});

		//Train for parts of names
		let nameParts = name.split(' ');
		nameParts.forEach((namePart) => {
			synonyms.push(namePart);
		});

		//Train for initials
		let initials = getInitials(name);
		synonyms.push(initials);

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

		data.push({
			value: id,
			synonyms: synonyms,
		});

		numberOfNamesTrained += synonyms.length;

		console.log(`Training data populated for collab ${collab.name}. ${synonyms.length} entries created.`);
	}

	await fs.writeFileSync('./monsterSeries.json', JSON.stringify(data, null, 4));

	console.log(
		`\n\nTraining data populated successfully. A total of ${numberOfNamesTrained} names were created to train AI.`
	);
	console.log('Series training file for AI is ready at ./monsterSeries.json');
	process.exit();
})();
