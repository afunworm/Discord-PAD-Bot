/*-------------------------------------------------------*
 * LIBRARIES
 *-------------------------------------------------------*/
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const https = require('https');

let startNumber = Number(process.env.PARSER_MONSTER_START_NUMBER);
let endNumber = Number(process.env.PARSER_MONSTER_END_NUMBER);
let highestValidMonsterId = Number(process.env.HIGHEST_VALID_MONSTER_ID);
let endPoint = process.env.MEDIA_SCRAPING_URL;

async function fileExists(path) {
	return new Promise((resolve, reject) => {
		try {
			if (fs.existsSync(path)) {
				resolve(true);
			} else {
				resolve(false);
			}
		} catch (error) {
			reject(error);
		}
	});
}

let assetsPath = __dirname + `/../../../assets`;
function downloadImage(id, type: 'portrait' | 'icon') {
	return new Promise((resolve, reject) => {
		let fileName = id.toString().padStart(5, '0') + '.png';
		let localPath = assetsPath + (type === 'portrait' ? '/portraits/' : '/icons/') + fileName;
		let url =
			type === 'portrait' ? endPoint + '/media/portraits/' + fileName : endPoint + '/media/icons/' + fileName;

		console.log(url);
		let file = fs.createWriteStream(localPath);

		let request = https
			.get(url, function (response) {
				response.pipe(file);
				file.on('finish', function () {
					resolve(localPath);
				});
			})
			.on('error', function (error) {
				// Handle errors
				fs.unlink(localPath); // Delete the file async. (But we don't check the result)
				console.log(error);
				reject(error);
			});
	});
}

(async () => {
	for (let id = startNumber; id <= highestValidMonsterId; id++) {
		//Portraits
		if (await fileExists(assetsPath + '/portraits/' + id.toString().padStart(5, '0') + '.png')) {
			console.log('Portrait exists for monster id ' + id + '.');
		} else {
			try {
				let url = await downloadImage(id, 'portrait');
				console.log('Portrait downloaded for monster id ' + id);
			} catch (error) {
				console.log('Unable to download portrait for monster id ' + id);
			}
		}

		//Icons
		if (await fileExists(assetsPath + '/icons/' + id.toString().padStart(5, '0') + '.png')) {
			console.log('Icon exists for monster id ' + id + '.');
		} else {
			try {
				let url = await downloadImage(id, 'icon');
				console.log('Icon downloaded for monster id ' + id);
			} catch (error) {
				console.log('Unable to download icon for monster id ' + id);
			}
		}
	}

	console.log('Image data populated successfully.');
	process.exit();
})();
