const jimp = require('jimp');
const fs = require('fs');

let displayIcons = (icons: string[], padding: number = 11) => {
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
				let maxWidth =
					data.reduce((accumulator, pic, index) => accumulator + pic.bitmap.width + padding, 0) - padding;

				new jimp(maxWidth, 100, async (err, image) => {
					data.forEach((icon, index) => {
						image.composite(icon, 100 * index + padding * index, 0);
					});

					//this saves our modified image
					// image.write('./test.png');
					let base64 = await image.getBase64Async('image/png');
					resolve(base64);
				});
			});
	});
};

(async () => {
	let result = await displayIcons([
		'https://static.pad.byh.uy/icons/00001.png',
		'https://static.pad.byh.uy/icons/00005.png',
		'https://static.pad.byh.uy/icons/00010.png',
		'https://static.pad.byh.uy/icons/00015.png',
		'https://static.pad.byh.uy/icons/00020.png',
	]);

	await fs.writeFileSync('./test.txt', result);
})();
