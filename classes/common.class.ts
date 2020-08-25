import { AWAKEN_EMOTES } from '../shared/monster.awakens';
import { KILLER_EMOTES } from '../shared/monster.awakens';
import { ATTRIBUTE_EMOTES } from '../shared/monster.attributes';
import { RESPONSE_PHRASES } from './responsePhrases';

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
}
