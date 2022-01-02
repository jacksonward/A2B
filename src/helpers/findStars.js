const cv = require('opencv4nodejs')

const findStars = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// declare star templates for detecting champions
	const templateOneStar = cv.imread('D:\\A2B\\src\\starCutouts\\one-star.png')
	const templateTwoStar = cv.imread('D:\\A2B\\src\\starCutouts\\two-star.png')
	const templateThreeStar = cv.imread(
		'D:\\A2B\\src\\starCutouts\\three-star.png'
	)
	const starTemplates = [
		{ name: 'one-star', image: templateOneStar },
		{ name: 'two-star', image: templateTwoStar },
		{ name: 'three-star', image: templateThreeStar },
	]

	// Threshold can be high here because star banners are always the same
	const threshold = 0.9
	starTemplates.forEach((template, index) => {
		let matched = image.matchTemplate(template.image, 3, template.image)
		let dataList = matched.getDataAsArray()
		for (let y = 0; y < dataList.length; y++) {
			for (let x = 0; x < dataList[y].length; x++) {
				if (dataList[y][x] > threshold) {
					// Found a result above threshold, push to results
                    console.log(`Found ${template.name} at ${x}, ${y} with confidence ${dataList[y][x]}`)
					let needle = {
						type: template.name,
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
	cv.imshow('multiple matches', image)
	cv.waitKey()

	// Or return to main process
	return results
}

module.exports = findStars