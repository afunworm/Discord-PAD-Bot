/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
import { Common } from '../../classes/common.class';
import { MonsterParser } from '../../classes/monsterParser.class';
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let highestValidMonsterId = Number(process.env.HIGHEST_VALID_MONSTER_ID);

async function fileExists(path) {
	return new Promise((resolve, reject) => {
		try {
			if (fs.existsSync(path)) {
				resolve(true);
			} else {
				resolve(false);
			}
		} catch (err) {
			console.error(err);
		}
	});
}

let assetsPath = __dirname + `/../../../assets`;
async function writeMaterialIcons(
	from: { id: number; url: string },
	to: { id: number; url: string },
	evoMats: { id: number; url: string }[],
	type: 'evo' | 'devo' = 'evo'
): Promise<string> {
	let hPadding = 8;
	let vPadding = 3;
	return new Promise(async (resolve, reject) => {
		try {
			let resources = [loadImage(from.url), loadImage(__dirname + '/../../raw/arrow.png'), loadImage(to.url)];

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

					const buffer = canvas.toBuffer('image/png');
					let id = type === 'evo' ? to.id.toString().padStart(5, '0') : from.id.toString().padStart(5, '0');
					let path = assetsPath + `/${type === 'evo' ? 'evos' : 'devos'}/${id}.png`;
					await fs.writeFileSync(path, buffer);
					resolve(path);
				});
		} catch (error) {
			reject(error);
		}
	});
}

(async () => {
	for (let id = startNumber; id <= highestValidMonsterId; id++) {
		//For evo materials
		let monster = new MonsterParser(id);
		let mats = monster.getEvoMaterials();
		mats = mats.filter((mat) => mat !== 0);

		if (mats.length === 0) {
			console.log('No material found for monster ' + id);
			continue;
		}

		if (await fileExists(assetsPath + '/evos/' + id.toString().padStart(5, '0') + '.png')) {
			console.log('Evo image exists for monster id ' + id + '..');
		} else {
			let iconUrls = [];

			for (let i = 0; i < mats.length; i++) {
				let evoMatId = mats[i];
				let monster = new MonsterParser(evoMatId);
				iconUrls.push({
					id: monster.getId(),
					url: Common.getThumbnailUrl(monster.getId()),
				});
			}

			let from = {
				id: monster.getPreviousEvo(),
				url: Common.getThumbnailUrl(monster.getPreviousEvo()),
			};
			let to = {
				id: monster.getId(),
				url: Common.getThumbnailUrl(monster.getId()),
			};

			try {
				let imagePath = await writeMaterialIcons(from, to, iconUrls, 'evo');
				console.log('Evo image written for monster id ' + id + ' at ' + imagePath);
			} catch (error) {
				console.log('Error occurred while writing material image for monster id ' + id);
			}
		}

		if (await fileExists(assetsPath + '/devos/' + id.toString().padStart(5, '0') + '.png')) {
			console.log('Devo image exists for monster id ' + id + '..');
		} else {
			let iconUrls = [];

			for (let i = 0; i < mats.length; i++) {
				let evoMatId = mats[i];
				let monster = new MonsterParser(evoMatId);
				iconUrls.push({
					id: monster.getId(),
					url: Common.getThumbnailUrl(monster.getId()),
				});
			}

			let from = {
				id: monster.getId(),
				url: Common.getThumbnailUrl(monster.getId()),
			};
			let to = {
				id: monster.getPreviousEvo(),
				url: Common.getThumbnailUrl(monster.getPreviousEvo()),
			};

			try {
				let imagePath = await writeMaterialIcons(from, to, iconUrls, 'devo');
				console.log('Devo image written for monster id ' + id + ' at ' + imagePath);
			} catch (error) {
				console.log('Error occurred while writing material image for monster id ' + id);
			}
		}
	}

	console.log('Image data populated successfully.');
	process.exit();
})();
