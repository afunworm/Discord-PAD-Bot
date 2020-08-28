import { AWAKEN_EMOTES } from '../shared/monster.awakens';
import { KILLER_EMOTES } from '../shared/monster.awakens';
import { ATTRIBUTE_EMOTES } from '../shared/monster.attributes';
import { RESPONSE_PHRASES } from './responsePhrases';
import { MONSTER_SERIES } from '../shared/monster.series';
import { MONSTER_COLLABS } from '../shared/monster.collabs';
const jimp = require('jimp');

export class Common {
	static fillTemplate(templateString: string, templateVars: { [key: string]: string }): string {
		let result = templateString;

		for (let replace in templateVars) {
			let replaceWith = templateVars[replace];

			if (replaceWith === undefined || replaceWith === null) {
				continue;
			}

			let regex = new RegExp('{{ *' + replace + ' *}}', 'g');
			result = result.replace(regex, replaceWith);
		}

		return result;
	}

	static dynamicResponse(templateId: string, templateVars: { [key: string]: string } = {}): string {
		let r = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
		let responses = RESPONSE_PHRASES[templateId];
		let randomIndex = r(0, responses.length - 1);
		let response = responses[randomIndex];

		return response ? this.fillTemplate(response, templateVars) : '';
	}

	static killerEmotesMapping(killerLatents: any[]): string[] {
		let result = [];
		for (let i = 0; i < killerLatents.length; i++) {
			let temp = KILLER_EMOTES[killerLatents[i]];
			if (temp != 'None') {
				result.push(temp);
			}
		}

		return result;
	}

	static awakenEmotesMapping(awakenList: any[]): string {
		let result = '';
		for (let i = 0; i < awakenList.length; i++) {
			if (awakenList[i] === '') {
				return '';
			}
			let temp = AWAKEN_EMOTES[awakenList[i]];
			if (temp != 'None') {
				result += ' ' + temp;
			}
		}

		return result ? result : '';
	}

	static attributeEmotesMapping(attributes: any[]): string[] {
		let result = [];
		for (let i = 0; i < attributes.length; i++) {
			let temp = ATTRIBUTE_EMOTES[attributes[i]];
			if (temp != 'None') {
				result.push(temp);
			}
		}
		return result;
	}

	static toSlug = (input: string) => input.replace(/[^a-zA-Z0-9]/gi, '_').toLowerCase();
	static camelize = (input: string) =>
		input
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]/gi, ' ')
			.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
			.replace(/\s+/g, '');

	static getCardSeriesInfo(
		cardId: number
	): {
		id: string | null;
		name: string | null;
	} {
		let result = {
			id: null,
			name: null,
		};

		MONSTER_SERIES.forEach((series) => {
			let name = series.name;
			let slug = this.camelize(name);
			let cards = series.cards;

			if (cards.includes(cardId)) {
				result = {
					id: slug,
					name: name,
				};
			}
		});

		return result;
	}
	static getCardSeriesGroup(cardId: number, cardCollabId: number): string | null {
		let result = null;

		MONSTER_SERIES.forEach((series) => {
			let group = series.group;
			let cards = series.cards;

			if (cards.includes(cardId) && group !== null) {
				result = group;
			}
		});

		if (MONSTER_COLLABS[cardCollabId]?.group) {
			result = MONSTER_COLLABS[cardCollabId]?.group;
		}

		return result;
	}

	static writeDisplayIcons(icons: string[], padding: number = 8): Promise<string> {
		return new Promise(async (resolve, reject) => {
			let jimps = [];

			//Turns the images into readable variables for jimp, then pushes them into a new array
			for (var i = 0; i < icons.length; i++) {
				jimps.push(jimp.read(icons[i]));
			}

			//Creates a promise to handle the jimps
			await Promise.all(jimps)
				.then((data) => {
					return Promise.all(jimps);
				})
				.then((data) => {
					let maxWidth = data.reduce(
						(accumulator, pic, index) => accumulator + pic.bitmap.width + padding,
						0
					);

					new jimp(maxWidth, 100, async (err, image) => {
						if (err) {
							reject(err);
						}

						data.forEach((icon, index) => {
							image.composite(icon, 100 * index + padding * index, 0);
						});

						let temp =
							Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
						image.write(`../temp/${temp}.png`);
						// let base64 = await image.getBase64Async('image/png');
						resolve(`../temp/${temp}.png`);
					});
				});
		});
	}
}
