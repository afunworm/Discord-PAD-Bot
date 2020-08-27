import { AWAKEN_EMOTES } from '../shared/monster.awakens';
import { KILLER_EMOTES } from '../shared/monster.awakens';
import { ATTRIBUTE_EMOTES } from '../shared/monster.attributes';
import { RESPONSE_PHRASES } from './responsePhrases';
import { MONSTER_SERIES } from '../shared/monster.series';
import { MONSTER_COLLABS } from '../shared/monster.collabs';

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
			let slug = series.aliases.length > 0 ? series.aliases[0] : this.toSlug(name);
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
}
