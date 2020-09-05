import { AWAKENINGS_ALIAS } from '../../shared/monster.awakens';
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
    for (let awakeningId in AWAKENINGS_ALIAS) {
        let awakenings = AWAKENINGS_ALIAS[awakeningId];
        let synonyms = [];
        let id = awakeningId;
        
        awakenings.forEach(awakening => {
            //Train real name
            synonyms.push(awakening);

            //Train name without special character
            let name = awakening.toLowerCase().replace(/[^a-zAZ0-9%\+\>\<]/gi, ' ');
            synonyms.push(name);

            //Train for parts of names
            let nameParts = name.split(' ');
            nameParts.forEach((namePart) => {
                synonyms.push(namePart);
            });

            //Train for initials
            let initials = getInitials(name);
            synonyms.push(initials);

            synonyms.forEach(synonym => {
                synonyms.push(synonym.replace('hp', 'hit points'));
                synonyms.push(synonym.replace('hp', 'hitpoints'));
                synonyms.push(synonym.replace('hp', 'hit point'));
                synonyms.push(synonym.replace('hp', 'hitpoint'));
                synonyms.push(synonym.replace('attack', 'atk'));
                synonyms.push(synonym.replace('recovery', 'rcv'));
                synonyms.push(synonym.replace('recovery', 'recover'));
                synonyms.push(synonym.replace('+', ' plus'));
                synonyms.push(synonym.replace(' resist', ' resistance'));
            });
        });

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

		console.log(`Training data populated for series ${awakeningId}. ${awakenings[0]} - ${synonyms.length} entries created.`);
	});

	await fs.writeFileSync('./monsterAwakenings.json', JSON.stringify(data, null, 4));

	console.log(
		`\n\nTraining data populated successfully. A total of ${numberOfNamesTrained} names were created to train AI.`
	);
	console.log('Series training file for AI is ready at ./monsterAwakenings.json');
	process.exit();
})();
