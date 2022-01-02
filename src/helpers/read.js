const cv = require('opencv4nodejs')
const { createWorker, createScheduler } = require('tesseract.js')
const stringSimilarity = require('string-similarity')
const champions = require('D:\\A2B\\src\\helpers\\champions.json')
const augments = require('D:\\A2B\\src\\helpers\\augments.json')
const items = require('D:\\A2B\\src\\helpers\\items.json')
const { Size } = require('opencv4nodejs')

const scheduler = createScheduler()
const worker1 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker2 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker3 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker4 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker5 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker6 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker7 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker8 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker9 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker10= createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})


let isReady = false;

(async () => {
	await worker1.load()
	await worker1.loadLanguage('eng')
	await worker1.initialize('eng')
	scheduler.addWorker(worker1)

	await worker2.load()
	await worker2.loadLanguage('eng')
	await worker2.initialize('eng')
	scheduler.addWorker(worker2)

	await worker3.load()
	await worker3.loadLanguage('eng')
	await worker3.initialize('eng')
	scheduler.addWorker(worker3)

	await worker4.load()
	await worker4.loadLanguage('eng')
	await worker4.initialize('eng')
	scheduler.addWorker(worker4)

	await worker5.load()
	await worker5.loadLanguage('eng')
	await worker5.initialize('eng')
	scheduler.addWorker(worker5)

	await worker6.load()
	await worker6.loadLanguage('eng')
	await worker6.initialize('eng')
	scheduler.addWorker(worker6)

	await worker7.load()
	await worker7.loadLanguage('eng')
	await worker7.initialize('eng')
	scheduler.addWorker(worker7)

	await worker8.load()
	await worker8.loadLanguage('eng')
	await worker8.initialize('eng')
	scheduler.addWorker(worker8)

	await worker9.load()
	await worker9.loadLanguage('eng')
	await worker9.initialize('eng')
	scheduler.addWorker(worker9)

	await worker10.load()
	await worker10.loadLanguage('eng')
	await worker10.initialize('eng')
	scheduler.addWorker(worker10)
	isReady = true
})()

const champNames = Object.keys(champions)
let itemNames = Object.keys(items)
items.Components.forEach(comp => {
	itemNames.push(comp)
})
const augNames = augments.map(augment => {
	return augment.Name
})

/*
	*image | png to be analyzed
	*type | argument specifying information needed
*/
const read = async (image, type) => {
	let regions
	let ocrData
	let textResults
	/* prepare region data */
    if (type == 'stage') {
        regions = [
            // region for stage 2+
            new cv.Rect(761, 5, 58, 31),
            // region for stage 1
            new cv.Rect(817, 5, 58, 31),
        ]
    }
    if (type == 'gold') {
		regions = [
			// shop name regions
			new cv.Rect(868, 885, 36, 22),
		]
    }
	if (type == 'level') {
		regions = [
			// shop name regions
			new cv.Rect(316, 882, 20, 25),
		]
	}
	if (type == 'xp') {
		regions = [
			// shop name regions
			new cv.Rect(404, 887, 40, 20),
		]
	}
    if (type == 'shop') {
		regions = [
			// shop name regions
			new cv.Rect(483, 1041, 138, 27),
			new cv.Rect(684, 1041, 138, 27),
			new cv.Rect(885, 1041, 138, 27),
			new cv.Rect(1087, 1041, 138, 27),
			new cv.Rect(1288, 1041, 138, 27),
		]
    }
	if (type == 'augments') {
		regions = [
			// shop name regions
			new cv.Rect(487, 559, 207, 20),
			new cv.Rect(847, 559, 207, 20),
			new cv.Rect(1208, 559, 207, 20),
		]
	}
	if (type == 'champion') {
		let ROI = image.cvtColor(6).threshold(200, 255, 1)
		ROI = cv.medianBlur(ROI, 1)
		let ROIPng = cv.imencode('.png', ROI)

		ocrData = await scheduler.addJob('recognize', ROIPng)

		textResults = ocrData.data.text

		let foundMatch = false
		champNames.forEach(name => {
			if (textResults.includes(name)) {
				textResults = name
				foundMatch = true
			}
		})

		// if no match yet found, get closest match
		if (!foundMatch) {
			let matches = stringSimilarity.findBestMatch(textResults, champNames)
			if (matches.bestMatch.rating > 0.2) {
				return matches.bestMatch.target
			} else {
				textResults = ''
			}
		}

		return textResults
	}
	if (type == 'item') {
		let ROI = image.cvtColor(6).threshold(150, 255, 1)
		ROI = cv.medianBlur(ROI, 1)
		let ROIPng = cv.imencode('.png', ROI)

		ocrData = await scheduler.addJob('recognize', ROIPng)

		textResults = ocrData.data.text

		let foundMatch = false
		itemNames.forEach((name) => {
			if (textResults.includes(name)) {
				textResults = name
				foundMatch = true
			}
		})

		// if no match yet found, get closest match
		if (!foundMatch) {
			let matches = stringSimilarity.findBestMatch(textResults, itemNames)
			if (matches.bestMatch.rating > 0.2) {
				return matches.bestMatch.target
			} else {
				textResults = ''
			}
		}
		return textResults
	}


	/* preprocessing */
	
	let crops = []
	regions.forEach((region) => {
		let ROI = image.getRegion(region).cvtColor(6).threshold(127, 255, 1)
		if (type == 'xp') {
			ROI = ROI.rescale(4)
			ROI = cv.gaussianBlur(ROI, new cv.Size(3,3), 0)
		}
		let ROIPng = cv.imencode('.png', ROI)
		crops.push(ROIPng)
	})

	ocrData = await Promise.all(
		crops.map((crop) => scheduler.addJob('recognize', crop, { crop }))
	)

	textResults = ocrData.map((r) => r.data.text.replace('\n', ''))


	/* post processing */

	if (type == 'shop') {
		textResults = textResults.map((name) => {
			if (name == '') {
				return ''
			}
			let matches = stringSimilarity.findBestMatch(name, champNames)
			// return name of best match
			if (matches.bestMatch.rating > 0.2) {
				return matches.bestMatch.target
			} else return ''
		})
	}

	if (type == 'stage') {
		textResults = textResults.filter(res => res.includes('-'))
	}
	if (type == 'xp') {
		if (textResults[0].includes(':')) {
			console.log('found :')
			textResults = textResults[0].split(':')
		}
		if (textResults[0].includes('/')) {
			console.log('found /')
			textResults = textResults[0].split('/')
		}
		if (textResults.length != 2) {
			return
		}
	}
	if (type == 'augments') {
		textResults = textResults.map((name) => {
			if (name == '') {
				return ''
			}
			let matches = stringSimilarity.findBestMatch(name, augNames)
			// return name of best match
			if (matches.bestMatch.rating > 0.5) {
				return matches.bestMatch.target
			} else return ''
		})
	}

	return textResults
}

module.exports = read