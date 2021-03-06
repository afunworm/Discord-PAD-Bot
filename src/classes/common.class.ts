const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { AWAKEN_EMOTES } from '../shared/monster.awakens';
import { KILLER_EMOTES } from '../shared/monster.awakens';
import { ATTRIBUTE_EMOTES } from '../shared/monster.attributes';
import { RESPONSE_PHRASES } from './responsePhrases';
import { MONSTER_SERIES } from '../shared/monster.series';
import { MONSTER_COLLABS } from '../shared/monster.collabs';
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const MEDIA_URL = process.env.MEDIA_URL;

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

	static awakenEmotesMapping(awakenList: any[]): string[] {
		let result = [];
		for (let i = 0; i < awakenList.length; i++) {
			if (awakenList[i] === '') {
				return [];
			}
			let temp = AWAKEN_EMOTES[awakenList[i]];
			if (temp != 'None') {
				result.push(temp);
			}
		}

		return result;
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

	static randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

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
			let slug = series.series;
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

	static getThumbnailUrl(id: number): string {
		let cardId = id.toString().padStart(5, '0');

		return `${MEDIA_URL}/icons/${cardId}.png`;
	}

	static getImageUrl(id: number): string {
		let cardId = id.toString().padStart(5, '0');

		return `${MEDIA_URL}/portraits/${cardId}.png`;
	}

	static getEvoImageUrl(id: number): string {
		let cardId = id.toString().padStart(5, '0');

		return `${MEDIA_URL}/evos/${cardId}.png`;
	}

	static getDevoImageUrl(id: number): string {
		let cardId = id.toString().padStart(5, '0');

		return `${MEDIA_URL}/devos/${cardId}.png`;
	}

	static displayEvoIcons(
		from: { id: number; url: string },
		to: { id: number; url: string },
		evoMats: { id: number; url: string }[]
	): Promise<string> {
		let hPadding = 8;
		let vPadding = 3;
		return new Promise(async (resolve, reject) => {
			try {
				let resources = [loadImage(from.url), loadImage(__dirname + '/../raw/arrow.png'), loadImage(to.url)];

				//Turns the images into readable variables for jimp, then pushes them into a new array
				for (var i = 0; i < evoMats.length; i++) {
					resources.push(loadImage(evoMats[i].url));
				}

				//Creates a promise to handle the jimps
				await Promise.all(resources)
					.then((data) => {
						return Promise.all(resources);
					})
					.then(async (data) => {
						let maxWidth = 100 * (data.length - 3) + hPadding * (data.length - 4);
						if (maxWidth < 200 + hPadding) maxWidth = 200 + hPadding;

						let canvas = createCanvas(maxWidth, 200 + vPadding);
						let context = canvas.getContext('2d');
						context.font = '16px Arial';
						context.strokeStyle = 'black';
						context.lineWidth = 5;
						context.textAlign = 'right';
						context.lineJoin = 'miter'; //Experiment with "bevel" & "round"
						context.miterLimit = 2;
						context.fillStyle = 'white';

						let fromImage = data[0];
						let arrowImage = data[1];
						let toImage = data[2];

						//Draw from > to
						context.drawImage(fromImage, 0, 0);
						context.drawImage(toImage, 100 + hPadding, 0);
						context.drawImage(
							arrowImage,
							(200 + hPadding - arrowImage.width) / 2,
							(100 - arrowImage.height) / 2
						);

						//Draw ID
						context.strokeText(from.id, 100 - 5, 100 - 7);
						context.fillText(from.id, 100 - 5, 100 - 7);
						context.strokeText(to.id, 200, 100 - 7);
						context.fillText(to.id, 200, 100 - 7);

						//Data should only contain materials
						data.splice(0, 3);

						data.forEach((icon, index) => {
							let startX = 100 * index + hPadding * index;
							let endX = startX + 100;

							//Draw icon
							context.drawImage(icon, startX, 100 + vPadding);

							//Draw ID
							context.strokeText(evoMats[index].id, endX - 5, 200 - 7 + vPadding);
							context.fillText(evoMats[index].id, endX - 5, 200 - 7 + vPadding);
						});

						let temp =
							Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

						const buffer = canvas.toBuffer('image/png');
						await fs.writeFileSync(__dirname + `/../temp/${temp}.png`, buffer);
						resolve(__dirname + `/../temp/${temp}.png`);
					});
			} catch (error) {
				reject(error);
			}
		});
	}

	static displayCardIcons(monsters: { id: number; url: string }[]): Promise<string> {
		let hPadding = monsters.length <= 8 ? 5 : 3;
		let vPadding = 3;
		let maxPerRow = monsters.length <= 8 ? 4 : 5;
		// monsters = monsters.slice(0, 8);

		return new Promise(async (resolve, reject) => {
			try {
				let resources = [];

				//Turns the images into readable variables for jimp, then pushes them into a new array
				for (var i = 0; i < monsters.length; i++) {
					resources.push(loadImage(monsters[i].url));
				}

				//Creates a promise to handle the jimps
				await Promise.all(resources)
					.then((data) => {
						return Promise.all(resources);
					})
					.then(async (data) => {
						let maxWidth;

						if (data.length > maxPerRow) maxWidth = 100 * maxPerRow + hPadding * (maxPerRow - 1);
						else maxWidth = 100 * data.length + hPadding * (data.length - 1);

						let numberOfRows = Math.ceil(data.length / maxPerRow);
						let maxHeight = data.length <= maxPerRow ? 100 : 200 + vPadding;
						maxHeight = numberOfRows * 100 + vPadding * (numberOfRows - 1);

						let canvas = createCanvas(maxWidth, maxHeight);
						let context = canvas.getContext('2d');
						context.font = '16px Arial';
						context.strokeStyle = 'black';
						context.lineWidth = 5;
						context.textAlign = 'right';
						context.lineJoin = 'miter'; //Experiment with "bevel" & "round"
						context.miterLimit = 2;
						context.fillStyle = 'white';

						data.forEach((icon, index) => {
							let startX, endX, startY, endY;

							startY = Math.floor(index / maxPerRow) * 100 + vPadding * Math.floor(index / maxPerRow);
							endY = startY + 100;

							startX = 100 * (index % maxPerRow) + hPadding * (index % maxPerRow);
							endX = startX + 100;

							//Draw icon
							context.drawImage(icon, startX, startY);

							//Draw ID
							context.strokeText(monsters[index].id, endX - 5, endY - 7);
							context.fillText(monsters[index].id, endX - 5, endY - 7);
						});

						let temp =
							Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

						const buffer = canvas.toBuffer('image/png');
						await fs.writeFileSync(__dirname + `/../temp/${temp}.png`, buffer);
						resolve(__dirname + `/../temp/${temp}.png`);
					});
			} catch (error) {
				reject(error);
			}
		});
	}
}
