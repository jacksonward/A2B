import path from 'path'
import url from 'url'
import {
	app,
	Menu,
	ipcMain,
	shell,
	BrowserWindow,
	globalShortcut,
} from 'electron'
const cv = require('opencv4nodejs')
const {
	mouse,
	screen,
	Region,
	randomPointIn,
	centerOf,
	Button,
	keyboard,
	Key
} = require('@nut-tree/nut-js')

import { hover, leftClick, rightClick, leftClickDelayed, leftClickDrag, sleep, waitClick } from './helpers/windmouse'

const screenshot = require('screenshot-desktop')
import read from './helpers/read'
import findStars from './helpers/findStars'
import matchItem from './helpers/matchItem'

// import set champion data
const champions = require('D:\\A2B\\src\\helpers\\champions.json')
// import trait level data
const traits = require('D:\\A2B\\src\\helpers\\traits.json')

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env'

// We can communicate with our window (the renderer process) via messages.
const initIpc = () => {
	ipcMain.on('need-app-path', (event, arg) => {
		event.reply('app-path', app.getAppPath())
	})
	ipcMain.on('open-external-link', (event, href) => {
		shell.openExternal(href)
	})
}


// Instantiate game model
let model = {
	state: '',
	// initialize at stage 1 round 1
	stage: '',
	gold: '0',
	xp: [0, 0],
	level: 1,
	// 4 rows 7 slots each
	board: [
		[
			{ location: new Region(580, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(690, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(800, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(920, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1035, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1145, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1265, 420, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		],
		[
			{ location: new Region(622, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(740, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(860, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(976, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1095, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1215, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1332, 490, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		],
		[
			{ location: new Region(555, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(675, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(795, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(915, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1040, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1160, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1280, 560, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		],
		[
			{ location: new Region(600, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(725, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(850, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(980, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1105, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1230, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
			{ location: new Region(1360, 640, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		],
	],
	// 9 slots on bench
	bench: [
		{ location: new Region(410, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(525, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(640, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(760, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(880, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(995, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(1115, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(1235, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
		{ location: new Region(1350, 740, 50, 50), champion: {
			name: '',
			star: 0,
			items: [],
			p: 0
		} },
	],
	// 10 item slots
	items: [
		{ location: new Region(286, 745, 16, 8), name: '' },
		{ location: new Region(331, 715, 16, 16), name: '' },
		{ location: new Region(310, 683, 16, 16), name: '' },
		{ location: new Region(347, 654, 16, 16), name: '' },
		{ location: new Region(325, 624, 16, 16), name: '' },
		{ location: new Region(335, 585, 16, 16), name: '' },
		{ location: new Region(402, 674, 16, 16), name: '' },
		{ location: new Region(382, 644, 16, 16), name: '' },
		{ location: new Region(390, 607, 16, 16), name: '' },
		{ location: new Region(448, 644, 16, 16), name: '' },
	],
	// 5 slots in shop
	shop: [
		{
			region: new Region(483, 931, 187, 137),
			name: '',
		},
		{
			region: new Region(684, 931, 187, 137),
			name: '',
		},
		{
			region: new Region(885, 931, 187, 137),
			name: '',
		},
		{
			region: new Region(1087, 931, 187, 137),
			name: '',
		},
		{
			region: new Region(1288, 931, 187, 137),
			name: '',
		},
	],
	buyList: ['academy', 'assassin', 'protector'],
	// Define augment card locations for selection
	augmentPicker: {
		locations: [
			new Region(487, 559, 207, 20),
			new Region(847, 559, 207, 20),
			new Region(1208, 559, 207, 20),
		],
	},
	// 3 augment slots
	augments: [],
	traits: {},
	champsOnBoard: 0
}

const modelBlank = model

let mainWindow
app.on('ready', () => {
	console.log('Starting App...')
	initIpc()

	mainWindow = new BrowserWindow({
		width: 1920,
		height: 1080,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			// Spectron needs access to remote module
			enableRemoteModule: env.name === 'test',
		},
		frame: false,
		alwaysOnTop: true,
		transparent: true,
		focusable: false,
	})
	mainWindow.setIgnoreMouseEvents(true)

	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, 'app.html'),
			protocol: 'file:',
			slashes: true,
		})
	)

	// register shortcuts
	globalShortcut.register('CommandOrControl+;', async () => {
		express('Executing custom function..')
		await sleep(2000)
		let emptySeat = model.bench.find(slot => slot.champion.name == '')
		for (let index = model.bench.indexOf(emptySeat); index < model.bench.length; index++) {	
			// at first empty slot
			await detectChampion(model.bench[index])
			if (model.bench[index].champion.name == '') break
		}
	})
	globalShortcut.register('CommandOrControl+j', async () => {
		express('Executing custom function..')
		await sleep(2000)
		screenshot({ filename: 'shot.png' })
	})
	globalShortcut.register('CommandOrControl+k', async () => {
		app.quit()
	})
	globalShortcut.register('CommandOrControl+i', async () => {
		model = modelBlank
	})
	globalShortcut.register('CommandOrControl+o', async () => {
		model.state = 'started'
	})

	// update rendered every 1000ms
	let intervalID = setInterval(pushGameModel, 1000)






	/* Game Loop */

	// poll for stage every 'x' ms
	let delay = 4000
	;(function loop() {
		setTimeout(async function () {
			// polling logic here
			await screenshot().then(async (img) => {
				let image = cv.imdecode(img)
				// expect augment picker under some circumstances
				if (model.stage == '1-3' || model.stage == '3-2' || model.stage == '4-5') {
					let options = await read(image, 'augments')
					if (options[0] != '') {
						pickAugment(options)
					}
				}

				await getStage(image)
				if (model.stage == '1-1') {
					model.state = 'started'
					express('found carousel!')
				}

				if (model.state != 'started') return

				if (model.stage == '1-3') {
					// last row middle slot
					await sell(model.board[3][3])
				}

				getGold(image)
				getLevel(image)
				getXp(image)
				await getShop(image)
				await buyFromShop()
				await detectChampions()
				await placeChampions()
				await detectItems()
				await placeItems()
				if (model.stage[0] == '1' || model.stage[1] == '1') {
					await collectLoot()
				}
				await clearUnknowns()
				await confirmKnowns()
			})
			.catch((err) => {
				console.log(err)
			})
			loop()
		}, delay)
	})()
})

const detectChampions = async () => {
	let emptySeat = model.bench.find((slot) => slot.champion.name == '')
	if (emptySeat == undefined) return
	for (let index = model.bench.indexOf(emptySeat); index < model.bench.length; index++) {	
		// at first empty slot
		await detectChampion(model.bench[index])
		if (model.bench[index].champion.name == '') break
	}
	return
}

const detectItems = async () => {
	let emptyItem = model.items.find((slot) => slot.name == '')
	if (emptyItem == undefined) return
	for (let index = model.items.indexOf(emptyItem); index < model.items.length; index++) {	
		// at first empty slot
		await detectItem(model.items[index])
		if (model.items[index].name == '') break
	}
	return
}

const resetMouse = async () => {
	let target = {x:500, y:430}
	await leftClick(target)
	await rightClick(target)
	return
}

const sell = async (slot) => {
	let target = await randomPointIn(slot.location)
	await hover(target)
	// press E to sell
	await keyboard.pressKey(Key.E)
	return
}

/*
	swaps two slots
*/
const swap = async (slot1, slot2) => {
	let target1 = slot1.location
	let target2 = slot2.location
	await leftClickDrag(target1, target2)
	let tmp = slot1
	slot1 = slot2
	slot2 = tmp
	return
}

const confirmKnowns = async () => {
	for (let slot of model.bench) {
		let known = slot.champion.name
		let name = await detectChampion(slot)
		if (known != name) {
			express('model is incorrect, adjusting...') 
			slot.champion.name = name
		}
	}
	return
}

const clearUnknowns = async () => {
	for (let row of model.board) {
		for (let slot of row) {
			if (slot.champion.name == '') {
				await sell(slot)
			}
		}
	}
	for (let slot of model.bench) {
		if (slot.champion.name == '') {
			await sell(slot)
		}
	}
	return
}

const clearBoard = async () => {
	for (let row of model.board) {
		for (let slot of row) {
			await sell(slot)
		}
	}
	return
}

const clearBench = async () => {
	for (let slot of model.bench) {
		await sell(slot)
	}
	return
}

const placeChampions = async () => {
	express('placing champions')
	let champsOnBoard = 0
	let freeSlots = []
	model.board.forEach(row => {
		row.forEach(slot => {
			if (slot.champion.name != '') { 
				champsOnBoard++ 
				if (champions[slot.champion.name].trait.includes('colossus')) {
					champsOnBoard++
				}
			} else freeSlots.push(slot)
		})
	})
	model.champsOnBoard = champsOnBoard

	let numToPlace = model.level - champsOnBoard
	console.log('num to place: ' + numToPlace)
	for (let i = 0; i < numToPlace; i++) {
		// place another champ
		let champ = model.bench.find(seat => seat.champion.name != '')
		if (!champ) return
		let i = Math.floor(Math.random()*freeSlots.length)
		await swap(champ, freeSlots[i])
	}
	return
}

const placeItems = async () => {
	express('placing items')
	let takenSlots = []
	let item = model.items.find((slot) => slot.name != '')
	if (!item) return
	model.board.forEach((row) => {
		row.forEach((slot) => {
			if (slot.champion.name != '') {
				takenSlots.push(slot)
			}
		})
	})
	if (takenSlots.length == 0) return
	// place item
	let i = Math.floor(Math.random() * takenSlots.length)
	console.log(item)
	console.log(takenSlots[i])
	let target1 = await randomPointIn(item.location)
	let target2 = await randomPointIn(takenSlots[i].location)
	item.name = ''
	await leftClickDrag(target1, target2)
	return
}

const calTraits = async (model) => {
	let traitsCol = []

	// loop through board
	model.board.forEach(row => {
		row.forEach(slot => {
			if (slot.champion.name != '') {
				// add board's traits and origins to traits array so we can calc what traits team has
				champions[slot.champion.name].origin.forEach(origin => traitsCol.push(origin))
				champions[slot.champion.name].trait.forEach(trait => traitsCol.push(trait))
			}
		})
	})

	// Calculate trait bonuses
	// this reducer returns an obj like { academy: 1, twinshot: 1 }
	let occurrences = traitsCol.reduce((obj, item) => {
		obj[item] = (obj[item] || 0) + 1
		return obj
	}, {})

	for (const trait in occurrences) {
		let levelsArr = traits[cap(trait)].levels
		
		let arr = levelsArr.slice(0, occurrences[trait] + 1)
		arr.forEach(el => {
			if (el != "") {
				console.log(el)
			}
		})
	}
	model.traits = occurrences
}

const getStage = async (image) => {
	express('getting stage..')
	let stage = await read(image, 'stage')
	if (stage[0] && model.stage != stage[0]) {
		// new stage
		model.stage = stage[0]
		return 'new'
	}
}

const getGold = async (image) => {
	let gold = await read(image, 'gold')
	if (!isNaN(gold)) {
		model.gold = parseInt(gold)
	}
}

const getShop = async (image) => {
	let shop = await read(image, 'shop')
	shop.forEach((slot, index) => {
		model.shop[index].name = slot
	})
	return
}

const getLevel = async (image) => {
	let level = await read(image, 'level')
	// xp is an array of two elements, 1: current xp, 2:next level
	model.level = level[0]
}

const getXp = async (image) => {
	let xp = await read(image, 'xp')
	// xp is an array of two elements, 1: current xp, 2:next level
	model.xp = xp
}

/*
	# slot is a Region for mouse to hover over / right click
*/
const detectChampion = async (slot) => {
	// mouse over region
	let target = await centerOf(slot.location)
	// right click for champ info
	await rightClick(target)
	// take screenshot
	await screenshot().then(async (img) => {
		let image = cv.imdecode(img)
		let pos = await mouse.getPosition()
		// get defined region containing item name
		let ROI = image.getRegion(new cv.Rect(pos.x, pos.y - 100, 350, 80))
		// send to read function
		let result = await read(ROI, 'champion')
		// cv.imshow(result, ROI)
		slot.champion.name = result
		await resetMouse()
		return
	})
}

const detectItem = async (slot) => {
	// mouse over slot for tooltip
	let target = await centerOf(slot.location)
	let result
	await hover(target)
	// take screenshot
	await screenshot().then(async (img) => {
		let image = cv.imdecode(img)
		// get defined region containing item name
		let ROI = image.getRegion(new cv.Rect(target.x, target.y, 250, 80))
		// send to read function
		result = await read(ROI, 'item')
		// cv.imshow(result, ROI)
		slot.name = result
		await resetMouse()
		return
	})
}

// Drawing function
// Takes an array of opencv rectangles from screader and sends them to renderer to draw
const draw = async (regions) => {
	console.log(regions)
	mainWindow.webContents.send('draw', JSON.stringify(regions))
}

// "express" is a function that expresses what the bot is doing by simply logging it to the overlay
const express = (message) => {
	mainWindow.webContents.send('express', message)
}

const pushGameModel = () => {
	// send game model info to renderer
	mainWindow.webContents.send('model', JSON.stringify(model))
}

// takes a champion from the model and calculates their power value using tier, stars, items, and synergies
const calChampPower = async (champion) => {
	let power = 0
	power += champions[champion.name].tier
}

// shop slot + bench seat
const buy = async (slot) => {
	let target1 = await centerOf(slot.region)
	let emptySeat = model.bench.find((seat) => seat.champion.name == '')
	if (emptySeat) {
		let target2 = await centerOf(emptySeat.location)
		await leftClickDrag(target1, target2)
		emptySeat.champion.name = slot.name
		slot.name = ''
		return
	}
}

const buyFromShop = async () => {
	express('buying from shop..')
	// decide who to buy
	for (let slot of model.shop) {
		if (champions[slot.name]) {
			let traits = champions[slot.name].trait.concat(champions[slot.name].origin)

			for (let trait of model.buyList) {
				if (traits.some(trait1 => trait1 == trait)) {
					await buy(slot)
				}
			}
		}
	}
	return
}

/*
	*options | array containing names of augment options to select from
*/
const pickAugment = async (options) => {
	express('picking augment...')

	// pick first augment for now
	let target = await randomPointIn(
		model.augmentPicker.locations[Math.floor(Math.random() * model.augmentPicker.locations.length)]
	)
	await leftClickDelayed(target, 100)
}

const collectLoot = async () => {
	express('collecting loot')
	// this loop takes ~ 10 seconds to collect loot
	// declare wait time in ms
	let waitTime = 1000
	await waitClick({ x: 650, y: 175 }, waitTime)
	await waitClick({ x: 920, y: 175 }, waitTime)
	await waitClick({ x: 1200, y: 175 }, waitTime)
	await waitClick({ x: 1340, y: 300 }, waitTime)
	await waitClick({ x: 1360, y: 450 }, waitTime)
	await waitClick({ x: 1400, y: 700 }, waitTime)
	await waitClick({ x: 940, y: 740 }, waitTime)
	await waitClick({ x: 500, y: 450 }, waitTime)
	await waitClick({ x: 1050, y: 350 }, waitTime)
	await waitClick({ x: 500, y: 600 }, waitTime)
	// return when finished
	return
}

// stupid function because I didnt think ahead
function cap(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

app.on('window-all-closed', () => {
	app.quit()
})
