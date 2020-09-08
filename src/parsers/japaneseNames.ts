/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { MonsterParser } from '../classes/monsterParser.class';
import { JAPANESE_NAMES } from '../shared/monster.japanese';
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);
let highestValidMonsterId = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let endPoint = process.env.JAPANESE_NAMES_SCRAPING_URL;

class Browser {
	private _browser;
	private _page;

	async init() {
		const puppeteer = require('puppeteer');
		this._browser = await puppeteer.launch();
		this._page = await this._browser.newPage();
	}

	getJapaneseName(monsterId) {
		return new Promise(async (resolve, reject) => {
			let url = endPoint + '/en/monster.asp?n=' + monsterId;

			try {
				await this._page.goto(url);
				let name = await this._page.$eval(
					'#wrapper #main #right #content .name h1',
					(element) => element.innerHTML
				);

				resolve(name);
			} catch (error) {
				reject('An error has occurred for monster id ' + monsterId);
				console.log(error);
			}
		});
	}

	async close() {
		await this._browser.close();
	}
}

(async () => {
	let data = JAPANESE_NAMES;
	let browser = new Browser();
	await browser.init();

	for (let id = startNumber; id <= highestValidMonsterId; id++) {
		let monster = new MonsterParser(id);
		let name = monster.getName();

		if (name.includes('*') || name.includes('??')) {
			//Indication of Japanese characters
			if (data[id] !== undefined) continue; //Already got those names before

			console.log('Getting name for monster id ' + id);

			try {
				let name = await browser.getJapaneseName(id);
				name = name.toString().replace('&amp;', '&');
				data[id.toString()] = name;

				//Write it down because this process takes forever...
				await fs.writeFileSync(
					'../shared/monster.japanese.ts',
					'export const JAPANESE_NAMES = ' + JSON.stringify(data, null, 4)
				);

				console.log('Name found. Database updated with ' + id + '. ' + name);
			} catch (error) {
				console.log(error);
				continue;
			}
		}
	}

	console.log(
		`Japanese Names database parsing completed. ${
			Object.keys(data).length
		} names parsed. You can now run the monster parsers.`
	);

	browser.close();
	process.exit();
})();
