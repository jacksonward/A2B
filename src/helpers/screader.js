const cv = require('opencv4nodejs')
import { Mat, resize } from 'opencv4nodejs'
// For template matching with a mask, i.e. non-rectangular templates
// you must use method 0 or 3 in matchTemplate
const { createWorker, createScheduler } = require('tesseract.js')
import champions from './champions.json'

// init workers
const scheduler = createScheduler()
const worker1 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly'
})
const worker2 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker3 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker4 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker5 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})
const worker6 = createWorker({
	cachePath: 'D:\\A2B\\OCR\\tessdata',
	cacheMethod: 'readOnly',
})

const detectItems = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// declare templates inside function because app breaks if you dont
	const bfCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\bf-cutout.png')
	const chainvestCutout = cv.imread(
		'D:\\A2B\\src\\itemCutouts\\chainvest-cutout.png'
	)
	const beltCutout = cv.imread(
		'D:\\A2B\\src\\itemCutouts\\giants-belt-cutout.png'
	)
	const rodCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\rod-cutout.png')
	const cloakCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\cloak-cutout.png')
	const bowCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\bow-cutout.png')
	const glovesCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\gloves-cutout.png')
	const tearCutout = cv.imread('D:\\A2B\\src\\itemCutouts\\tear-cutout.png')
	const itemTemplates = [
		{ name: 'bfSword', image: bfCutout },
		{ name: 'chainVest', image: chainvestCutout },
		{ name: 'giantsBelt', image: beltCutout },
		{ name: 'rod', image: rodCutout },
		{ name: 'cloak', image: cloakCutout },
		{ name: 'bow', image: bowCutout },
		{ name: 'gloves', image: glovesCutout },
		{ name: 'tear', image: tearCutout },
	] // add spat later

	// get and draw item Region of Interest
	let localX = 250 // top-left x of box
	let localY = 550 // top-left y of box
	let localXOffset = 250 // width of box
	let localYOffset = 250 // height of box
	let itemROIRect = new cv.Rect(localX, localY, localXOffset, localYOffset)
	results.drawRects.push(itemROIRect)
	//image.drawRectangle(itemROIRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)
	let itemROI = image.getRegion(itemROIRect)

	let threshold = 0.9
	itemTemplates.forEach((template, index) => {
		const matched = itemROI.matchTemplate(template.image, 3, template.image)
		const dataList = matched.getDataAsArray()

		for (let y = 0; y < dataList.length; y++) {
			for (let x = 0; x < dataList[y].length; x++) {
				if (dataList[y][x] > threshold) {
					console.log('found an item')
					let itemRect = new cv.Rect(
						x + localX,
						y + localY,
						template.image.cols,
						template.image.rows
					)
					results.drawRects.push(itemRect) // push rectangle to results
					results.data.push({
						item: template.name,
						location: {
							x: x + localX,
							y: localY,
						},
						confidence: dataList[y][x],
					})
					//image.drawRectangle(itemRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)
				}
			}
		}
	})

	// Open result in new window
	// cv.imshow('test', image)
	// cv.waitKey()

	// Or return to main process
	return results
}

const detectStage = async (image, currentStage) => {
	let results = {
		drawRects: [],
		data: '',
	}

	// await worker3.load()
	// await worker3.loadLanguage('eng')
	// await worker3.initialize('eng')
	// await worker3.setParameters({
	// 	tessedit_char_whitelist: '0123456789',
	// })

	// set coordinates of stage number locations for OCR (for 1920x1080 screen)
	const locations = [761, 817]

	let y = 5
	let width = 58
	let height = 31

	let crops = []
	locations.forEach((x) => {
		let regionRect = new cv.Rect(x, y, width, height)
		results.drawRects.push(regionRect) // push to returned object
		let ROI = image.getRegion(regionRect).cvtColor(6).threshold(127, 255, 1)
		let ROIPng = cv.imencode('.png', ROI)

		crops.push(ROIPng)
	})

	await worker2.load()
	await worker3.load()
	await worker2.loadLanguage('eng')
	await worker3.loadLanguage('eng')
	await worker2.initialize('eng')
	await worker3.initialize('eng')
	scheduler.addWorker(worker2)
	scheduler.addWorker(worker3)

	let ocrData = await Promise.all(
		crops.map((crop) => scheduler.addJob('recognize', crop, { crop }))
	)

	let stageROIs = ocrData.map((r) => r.data.text)
	console.log(stageROIs)
}

const findStars = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// declare star templates for detecting champions
	/* for some reason these need to be declared in the function space and not globally
		otherwise you get many false positives
	*/
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

	// get and draw board regions of interest (top side -> their team | bot side -> my team)
	const localX = 300
	const localY = 0
	const localXOffset = 1200
	const localYOffset = 1000
	let boardROIRect = new cv.Rect(localX, localY, localXOffset, localYOffset)
	results.drawRects.push(boardROIRect)
	// image.drawRectangle(boardROIRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)

	let boardROI = image.getRegion(boardROIRect)

	// Threshold can be high here because star banners are always the same
	const threshold = 0.9
	starTemplates.forEach((template, index) => {
		let matched = boardROI.matchTemplate(template.image, 3, template.image)
		let dataList = matched.getDataAsArray()
		for (let y = 0; y < dataList.length; y++) {
			for (let x = 0; x < dataList[y].length; x++) {
				if (dataList[y][x] > threshold) {
					// Found a result above threshold, push to results
					let needle = {
						location: {
							x: x + localX,
							y: y + localY,
						},
						confidence: dataList[y][x],
					}
					results.data.push(needle)
					let starRect = new cv.Rect(
						x + localX,
						y + localY,
						template.cols,
						template.rows
					)
					results.drawRects.push(starRect) // push rectangle to return object
					// image.drawRectangle(starRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)
				}
			}
		}
	})

	// Show on screen
	// cv.imshow('multiple matches', image)
	// cv.waitKey()

	// Or return to main process
	return results
}

const readShop = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// shop rectangles are 187x137 with y of 931

	// set coordinates of shop champ name locations for OCR (for 1920x1080 screen)
	const locations = [483, 684, 885, 1087, 1288]
	const y = 1041
	const xOffset = 138
	const yOffset = 27

	let crops = []
	locations.forEach((x) => {
		let regionRect = new cv.Rect(x, y, xOffset, yOffset)
		results.drawRects.push(regionRect) // push to returned object
		let shopROI = image.getRegion(regionRect).cvtColor(6).threshold(127, 255, 1)
		let shopROIPng = cv.imencode('.png', shopROI)

		crops.push(shopROIPng)
	})

	await worker2.load()
	await worker3.load()
	await worker2.loadLanguage('eng')
	await worker3.loadLanguage('eng')
	await worker2.initialize('eng')
	await worker3.initialize('eng')
	scheduler.addWorker(worker2)
	scheduler.addWorker(worker3)

	let ocrData = await Promise.all(
		crops.map((crop) => scheduler.addJob('recognize', crop, { crop }))
	)

	let shopNames = ocrData.map((r) => r.data.text.replace('\n', ''))
	results.data = shopNames
	// await worker2.terminate()
	// await worker3.terminate()
	return results
}

const readGold = async (image) => {
	// Get amount of gold in the bank!
	let results = {
		drawRects: [],
		data: '',
	}

	await worker6.load()
	await worker6.loadLanguage('eng')
	await worker6.initialize('eng')

	// set coordinates of stage number locations for OCR (for 1920x1080 screen)
	let x = 868
	let y = 885
	let width = 36
	let height = 22

	let regionRect = new cv.Rect(x, y, width, height)
	results.drawRects.push(regionRect) // push to returned object
	//
	let ROIpre = image.getRegion(regionRect)
	// perform image pre-processing
	let ROI = ROIpre.cvtColor(6).threshold(127, 255, 1)
	// otherwise, read the new stage mat to detect the current stage
	let ROIPng = cv.imencode('.png', ROI)

	const {
		data: { text },
	} = await worker6.recognize(ROIPng)

	// Return stage string (ex. 3-6 is stage 3 round 6)
	results.data = text

	return results
}

const isAugmentPicker = async (image) => {
	// determine if an augment needs to be picked
	// set locations
	const x = 767
	const y = 230
	const width = 370
	const height = 46

	await worker3.load()
	await worker3.loadLanguage('eng')
	await worker3.initialize('eng')

	let regionRect = new cv.Rect(x, y, width, height)
	let ROIpre = image.getRegion(regionRect)
	// perform image pre-processing
	let ROI = ROIpre.cvtColor(6).threshold(127, 255, 1)
	// compare last stageROI to current to see if stage is the same or different
	// if stageMats are the same, return early

	// otherwise, read the new stage mat to detect the current stage
	let ROIPng = cv.imencode('.png', ROI)

	const {
		data: { text },
	} = await worker3.recognize(ROIPng)

	if (text.includes('Select An Augment')) {
		return true
	}
}

const readAugments = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// set coordinates of shop champ name locations for OCR (for 1920x1080 screen)
	const locations = [487, 847, 1208]
	const y = 559
	const xOffset = 207
	const yOffset = 20

	let crops = []
	locations.forEach((x) => {
		let regionRect = new cv.Rect(x, y, xOffset, yOffset)
		results.drawRects.push(regionRect) // push to returned object
		let augmentsROI = image.getRegion(regionRect).cvtColor(6).threshold(127, 255, 1)
		let augmentsROIPng = cv.imencode('.png', augmentsROI)

		crops.push(augmentsROIPng)
	})

	await worker4.load()
	await worker5.load()
	await worker4.loadLanguage('eng')
	await worker5.loadLanguage('eng')
	await worker4.initialize('eng')
	await worker5.initialize('eng')
	scheduler.addWorker(worker4)
	scheduler.addWorker(worker5)

	let ocrData = await Promise.all(
		crops.map((crop) => scheduler.addJob('recognize', crop, { crop }))
	)

	let augmentNames = ocrData.map((r) => r.data.text.replace('\n', ''))
	results.data = augmentNames
	console.log(results.data)
	// await worker4.terminate()
	// await worker5.terminate()
	return results
}

const detectOrbs = async (image) => {
	let results = {
		drawRects: [],
		data: [],
	}

	// declare templates inside function because app breaks if you dont
	const blueOrb = await cv.imreadAsync('D:\\A2B\\src\\orbCutouts\\blueOrb.png')
	const grayOrb = await cv.imreadAsync('D:\\A2B\\src\\orbCutouts\\grayOrb.png')
	const goldOrb = await cv.imreadAsync('D:\\A2B\\src\\orbCutouts\\goldOrb.png')
	const orbTemplates = [
		{ name: 'blueOrb', image: blueOrb },
		{ name: 'grayOrb', image: grayOrb },
		{ name: 'goldOrb', image: goldOrb },
	]

	// get and draw board regions of interest (top side -> their team | bot side -> my team)
	const localX = 300
	const localY = 0
	const localXOffset = 1200
	const localYOffset = 1000
	let boardROIRect = new cv.Rect(localX, localY, localXOffset, localYOffset)
	// image.drawRectangle(boardROIRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)

	let boardROI = image.getRegion(boardROIRect)

	let threshold = 0.95
	orbTemplates.forEach((template, index) => {
		const matched = boardROI.matchTemplate(template.image, 3, template.image)
		const dataList = matched.getDataAsArray()

		for (let y = 0; y < dataList.length; y++) {
			for (let x = 0; x < dataList[y].length; x++) {
				if (dataList[y][x] > threshold) {
					console.log(`Found ${template.name} at ${x + localX}, ${y + localY} with confidence ${dataList[y][x]}`)
					let orbRect = new cv.Rect(
						x + localX,
						y + localY,
						template.image.cols,
						template.image.rows
					)
					image.drawRectangle(orbRect, new cv.Vec3(0, 255, 0), 1, cv.LINE_8)
				}
			}
		}
	})

	// Open result in new window
	cv.imshow('test', image)
	cv.waitKey()

	// Or return to main process
	return results
}

export {
	findStars,
	readShop,
	detectStage,
	isAugmentPicker,
	readGold,
	readAugments
}
