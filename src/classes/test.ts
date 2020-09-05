const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

function displayEvoIcons(
	from: { id: number; url: string },
	to: { id: number; url: string },
	evoMats: { id: number; url: string }[],
	padding: number = 8
): Promise<string> {
	return new Promise(async (resolve, reject) => {
		let resources = [loadImage(from.url), loadImage('./arrow.png'), loadImage(to.url)];

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
				let maxWidth = data.reduce((accumulator, pic, index) => accumulator + pic.width + padding, 0);
				maxWidth = maxWidth >= 200 ? maxWidth : 200;
				maxWidth = maxWidth <= 1000 + padding ? maxWidth : 1000 + padding;

				let canvas = createCanvas(maxWidth, 200);
				let context = canvas.getContext('2d');
				context.font = '16px Sans-serif';
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
				context.drawImage(toImage, 100 + padding, 0);
				context.drawImage(arrowImage, (200 + padding - arrowImage.width) / 2, (100 - arrowImage.height) / 2);

				//Draw ID
				context.strokeText(from.id, 100 - 5, 100 - 7);
				context.fillText(from.id, 100 - 5, 100 - 7);
				context.strokeText(to.id, 200 - 5, 100 - 7);
				context.fillText(to.id, 200 - 5, 100 - 7);

				//Data should only contain materials
				data.splice(0, 3);

				data.forEach((icon, index) => {
					let startX = 100 * index + padding * index;
					let endX = startX + 100;

					//Draw icon
					context.drawImage(icon, startX, 100);

					//Draw ID
					context.strokeText(evoMats[index].id, endX - 5, 200 - 7);
					context.fillText(evoMats[index].id, endX - 5, 200 - 7);
				});

				let temp = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

				const buffer = canvas.toBuffer('image/png');
				await fs.writeFileSync(`./${temp}.png`, buffer);
				resolve(`${temp}.png`);
			});
	});
}

(async () => {
	let fn = await displayEvoIcons(
		{
			id: 5478,
			url: 'https://static.pad.byh.uy/icons/05478.png',
		},
		{
			id: 5479,
			url: 'https://static.pad.byh.uy/icons/05478.png',
		},
		[
			{
				id: 345,
				url: 'https://static.pad.byh.uy/icons/00345.png',
			},
			{
				id: 346,
				url: 'https://static.pad.byh.uy/icons/00346.png',
			},
			{
				id: 347,
				url: 'https://static.pad.byh.uy/icons/00347.png',
			},
			{
				id: 348,
				url: 'https://static.pad.byh.uy/icons/00348.png',
			},
			{
				id: 349,
				url: 'https://static.pad.byh.uy/icons/00349.png',
			},
		]
	);

	console.log(fn);
})();
