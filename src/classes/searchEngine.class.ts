/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Fuse = require('fuse.js');
import { first } from 'lodash';
// const database = require('../../database.json');
import { MonsterParser } from './monsterParser.class';
let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let highestValidMonsterId = Number(process.env.HIGHEST_VALID_MONSTER_ID);
// const fs = require('fs');

export class SearchEngine {
	private _fuse;
	private _index = [];

	constructor() {}

	public buildIndex() {
		return new Promise(async (resolve, reject) => {
			const options = {
				isCaseSensitive: false,
				includeScore: true,
				shouldSort: true,
				includeMatches: true,
				findAllMatches: true,
				minMatchCharLength: 2,
				location: 0,
				threshold: 0.3,
				distance: 200,
				useExtendedSearch: false,
				ignoreLocation: false,
				ignoreFieldNorm: false,
				keys: ['id', 'name'],
			};

			for (let id = startNumber; id <= highestValidMonsterId; id++) {
				let monster = new MonsterParser(id);
				this._index.push({ id: monster.getId(), name: monster.getName() });
			}

			console.log(`${this._index.length} items indexed`);

			this._fuse = new Fuse(this._index, options);

			//For debugging
			//await fs.writeFileSync('./src/classes/nameDatabase.json', JSON.stringify(list));

			resolve(this._fuse);
		});
	}

	public simpleSearch(pattern: string) {
		pattern = pattern.toLowerCase();

		let isFuzzy = (name: string, needle: string) => {
			let hay = name.toLowerCase(),
				i = 0,
				n = -1,
				l;
			needle = needle.toLowerCase();
			let apart = 0;
			for (; (l = needle[i++]); ) {
				apart++;
				if (!~(n = hay.indexOf(l, n + 1))) return false;
			}
			return apart <= 5 ? true : false;
		};

		let matches = this._index.filter((item) => isFuzzy(item.name, pattern));

		return matches.map((item) => {
			return {
				item: {
					name: item.name,
					id: item.id,
					score: 0,
				},
				matches: [
					{
						indices: [],
					},
				],
			};
		});
	}

	public firstLetterSearch(pattern: string) {
		pattern = pattern.replace(/\s/g, '');

		let matches = this._index.filter((item) => {
			//Create a short version of name with initials only
			let initials = item.name
				.toLowerCase()
				.split(' ')
				.map((word) => word.charAt(0))
				.join('');

			//Search for the currentLetter
			let matched = false;

			let clonePattern = pattern;
			while (clonePattern.length) {
				let currentLetter = clonePattern[0];

				if (initials.indexOf(currentLetter) !== -1) {
					clonePattern = clonePattern.substring(1);
					//If the character is found at the position n, remove the first n characters
					initials = initials.slice(initials.indexOf(currentLetter) + 1);

					if (clonePattern.length === 0) {
						matched = true;
					}
				} else {
					break;
				}
			}

			return matched;
		});

		return matches.map((item) => {
			return {
				item: {
					name: item.name,
					id: item.id,
					score: 0,
				},
			};
		});
	}

	public async rawSearch(pattern: string) {
		console.log('Searching for pattern "' + pattern + '"');
		return new Promise((resolve, reject) => {
			if (!this._fuse) {
				return reject('SearchEngine.buildIndex() must be run before SearchEngine.rawSearch()');
			}

			pattern = pattern.toLowerCase();
			let result = this._fuse.search(`${pattern}`);

			//If the string is long enough, allow simple search
			if (pattern.length >= 7) {
				let simpleSearchResult = this.simpleSearch(pattern);
				result = simpleSearchResult.concat(result);
			}

			//Do first letter search result
			let firstLetterSearchResult = this.firstLetterSearch(pattern);
			result = firstLetterSearchResult.concat(result);

			//Sort result by fuzzy matching score
			result = result.sort((a, b) => a.score - b.score);

			//Take all the ones that has the exact match and add it to the top
			let sortedResult = [];

			result.forEach((item, index) => {
				if (item.item.name.toLowerCase().includes(pattern.toLowerCase())) {
					sortedResult.push(item);
				}
			});

			//Merge the rest of the result
			sortedResult = sortedResult.concat(result);

			//Remove duplicates
			sortedResult = sortedResult.reduce((a, b) => {
				let existed = false;
				a.forEach((existedItem) => {
					if (existedItem.item.name === b.item.name) existed = true;
				});
				if (!existed) a.push(b);
				return a;
			}, []);

			resolve(sortedResult);
		});
	}

	public async search(pattern: string, highlight: boolean = false) {
		try {
			let result: any = await this.rawSearch(pattern);

			if (!highlight)
				return result.map((i) => {
					return {
						id: i.item.id,
						name: i.item.name,
					};
				});

			//Highlight words
			result = result.map((item) => {
				if (item.matches) {
					//From fusejs search
					let matches = item.matches[0].indices;
					let name = item.item.name;
					let parts = name.split('');

					matches.forEach((match) => {
						let startIndex = match[0];
						let endIndex = match[1];

						parts[startIndex] = '**' + parts[startIndex];
						parts[endIndex] = parts[endIndex] + '**';
					});

					return {
						id: item.item.id,
						name: parts.join(''),
					};
				} else {
					//From initial search
					let name = item.item.name;
					let parts = name.split(' ');

					parts = parts.map((word) => '**' + word.charAt(0) + '**' + word.substring(1));

					return {
						id: item.item.id,
						name: parts.join(' '),
					};
				}
			});

			return result;
		} catch (error) {
			console.log(error);
		}
	}
}
