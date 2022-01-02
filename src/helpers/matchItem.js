const cv = require('opencv4nodejs')
const fs = require('fs')
const { Mat } = require('opencv4nodejs')
const itemFolder = 'D:\\A2B\\src\\items\\'

const matchItem = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}
    let templates = []
	
	fs.readdirSync(itemFolder).forEach((file) => {
		console.log(file)
        let mat = cv.imread(itemFolder + file).resize(58, 58)
        templates.push(mat)
	})
	
	// Threshold can be high here because star banners are always the same
	const threshold = 0.9
	templates.forEach((template, index) => {
		let matched = image.matchTemplate(template, 0)
		let dataList = matched.getDataAsArray()
		for (let y = 0; y < dataList.length; y++) {
			for (let x = 0; x < dataList[y].length; x++) {
				if (dataList[y][x] > threshold) {
					// Found a result above threshold, push to results
					console.log(
						`Found item at ${x}, ${y} with confidence ${dataList[y][x]}`
					)
					let needle = {
						location: {
							x: x,
							y: y,
						},
						confidence: dataList[y][x],
					}
					results.data.push(needle)
					let starRect = new cv.Rect(
						x,
						y,
						template.image.cols,
						template.image.rows
					)
					console.log(starRect)
					results.drawRects.push(starRect) // push rectangle to return object
					image.drawRectangle(starRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)
				}
			}
		}
	})

	// Show on screen
	cv.imshow('matches', image)
	cv.waitKey()

	// Or return to main process
	return results
}

module.exports = matchItem
