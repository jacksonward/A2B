import * as fs from 'fs'
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
import appMenuTemplate from './menu/app_menu_template'
import editMenuTemplate from './menu/edit_menu_template'
import devMenuTemplate from './menu/dev_menu_template'
// import createWindow from "./helpers/window";

import {
	findStars,
	detectChampion,
	readShop,
	detectStage,
	readTooltip,
	isAugmentPicker,
	readGold,
	readAugments,
} from './helpers/screader'
import { wmove, wclick } from './helpers/windmouse'
const cv = require('opencv4nodejs')
const {
	mouse,
	screen,
	Region,
	randomPointIn,
	centerOf,
	Button,
} = require('@nut-tree/nut-js')
const screenshot = require('screenshot-desktop')
const stringSimilarity = require('string-similarity')

// import set champion data
const champions = require('D:\\A2B\\src\\helpers\\champions.json')

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env'

// init window var
let mainWindow
// edit some mouse settings from nutjs
mouse.config.autoDelayMs = 50
// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
	const userDataPath = app.getPath('userData')
	app.setPath('userData', `${userDataPath} (${env.name})`)
}

const setApplicationMenu = () => {
	const menus = [appMenuTemplate, editMenuTemplate]
	if (env.name !== 'production') {
		menus.push(devMenuTemplate)
	}
	Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
}

// We can communicate with our window (the renderer process) via messages.
const initIpc = () => {
	ipcMain.on('need-app-path', (event, arg) => {
		event.reply('app-path', app.getAppPath())
	})
	ipcMain.on('open-external-link', (event, href) => {
		shell.openExternal(href)
	})
}

async function createWindow() {
	// Create the overlay
	const width = await screen.width()
	const height = await screen.height()
	// create the main window
	mainWindow = new BrowserWindow({
		width: width,
		height: height,
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
}

// Drawing function
// Takes an array of opencv rectangles from screader and sends them to renderer to draw
const draw = async (rectangles) => {
	mainWindow.webContents.send('draw', JSON.stringify(rectangles))
}

// "express" is a function that expresses what the bot is doing by simply logging it to the overlay
const express = async (message) => {
	mainWindow.webContents.send('express', message)
}

// Instantiate game model
let gameModel = {
	// initialize at stage 1 round 1
	stage: '11',
	gold: '0',
	// 4 rows on player side of board
	board: [[], [], [], []],
	// 9 slots on bench
	bench: [
		{ location: new Region(410, 740, 50, 50), name: 'empty' },
		{ location: new Region(525, 740, 50, 50), name: 'empty' },
		{ location: new Region(640, 740, 50, 50), name: 'empty' },
		{ location: new Region(760, 740, 50, 50), name: 'empty' },
		{ location: new Region(880, 740, 50, 50), name: 'empty' },
		{ location: new Region(995, 740, 50, 50), name: 'empty' },
		{ location: new Region(1115, 740, 50, 50), name: 'empty' },
		{ location: new Region(1235, 740, 50, 50), name: 'empty' },
		{ location: new Region(1350, 740, 50, 50), name: 'empty' },
	],
	// 10 item slots
	items: [
		{ location: new Region(286, 745, 16, 8), name: 'empty' },
		{ location: new Region(331, 735, 16, 16), name: 'empty' },
		{ location: new Region(310, 703, 16, 16), name: 'empty' },
		{ location: new Region(402, 674, 16, 16), name: 'empty' },
		{ location: new Region(347, 674, 16, 16), name: 'empty' },
		{ location: new Region(448, 644, 16, 16), name: 'empty' },
		{ location: new Region(382, 644, 16, 16), name: 'empty' },
		{ location: new Region(325, 644, 16, 16), name: 'empty' },
		{ location: new Region(390, 607, 16, 16), name: 'empty' },
		{ location: new Region(335, 605, 16, 16), name: 'empty' },
	],
	// 5 slots in shop
	shop: {
		slot1: {
			region: new Region(483, 931, 187, 137),
			name: '',
		},
		slot2: {
			region: new Region(684, 931, 187, 137),
			name: '',
		},
		slot3: {
			region: new Region(885, 931, 187, 137),
			name: '',
		},
		slot4: {
			region: new Region(1087, 931, 187, 137),
			name: '',
		},
		slot5: {
			region: new Region(1288, 931, 187, 137),
			name: '',
		},
	},
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
}

const pushGameModel = async () => {
	console.log('updating game model')
	// send game model info to renderer
	mainWindow.webContents.send('gameModel', JSON.stringify(gameModel))
}

const pickAugment = async () => {
	// pick the first one for now
	express('picking augment')
	let target = await randomPointIn(gameModel.augmentPicker.locations[0])
	await wmove(target)
	await mouse.leftClick()
}

const detectItems = async () => {
	express('detecting items')
	let itemTemplates = []
	fs.readdir('D:\\A2B\\src\\items', (err, data) => {
		if (err) throw err
		itemTemplates = data.map((suffix) => {
			let template = cv.imread('D:\\A2B\\src\\items\\' + suffix).resize(58, 58)
			return { name: suffix.replace('.png', ''), image: template }
		})
	})
	for (let slot of gameModel.items) {
		if (slot.name == 'empty') {
			// if slot is empty, check it
			let slotSolved = false
			// move mouse to random point over slot
			const target = await centerOf(slot.location)
			await wmove(target)
			// read tooltip that pops up
			screenshot().then((img) => {
				const image = cv.imdecode(img)
				const itemROIRect = new cv.Rect(target.x, target.y, 150, 150)
				const itemROI = image.getRegion(itemROIRect)
				const threshold = 0.95

				itemTemplates.forEach((template) => {
					if (!slotSolved) {
						const matched = itemROI.matchTemplate(template.image, 3)
						const dataList = matched.getDataAsArray()
						for (let y = 0; y < dataList.length; y++) {
							for (let x = 0; x < dataList[y].length; x++) {
								if (dataList[y][x] > threshold) {
									console.log(
										`Found ${template.name} with confidence of ${dataList[y][x]}`
									)

									slot.name = template.name
									slotSolved = true
									pushGameModel()
								}
							}
						}
					}
				})
			})
		}
	}
}

// init champ names
const champNames = Object.keys(champions)
const getShop = async (image) => {
	express('reading shop')
	readShop(image).then((results) => {
		let shopNames = results.data.map((name) => {
			if (name == '') {
				return ''
			}
			let matches = stringSimilarity.findBestMatch(name, champNames)
			// return name of best match
			return matches.bestMatch.target
		})

		// console.log(shopNames)
		gameModel.shop.slot1.name = shopNames[0]
		gameModel.shop.slot2.name = shopNames[1]
		gameModel.shop.slot3.name = shopNames[2]
		gameModel.shop.slot4.name = shopNames[3]
		gameModel.shop.slot5.name = shopNames[4]
	})
}

const getGold = async (image) => {
	express('reading gold')
	readGold(image).then((results) => {
		gameModel.gold = results.data
	})
}

const collectLoot = async () => {
	express('collecting loot')
	// this loop takes ~ 10 seconds to collect loot
	// declare wait time in ms
	let waitTime = 1000
	await wclick({ x: 650, y: 175 }, waitTime)
	await wclick({ x: 920, y: 175 }, waitTime)
	await wclick({ x: 1200, y: 175 }, waitTime)
	await wclick({ x: 1340, y: 300 }, waitTime)
	await wclick({ x: 1360, y: 450 }, waitTime)
	await wclick({ x: 1400, y: 700 }, waitTime)
	await wclick({ x: 940, y: 740 }, waitTime)
	await wclick({ x: 500, y: 450 }, waitTime)
	await wclick({ x: 1050, y: 350 }, waitTime)
	await wclick({ x: 500, y: 600 }, waitTime)
	// return when finished
	return
}

const buyChamps = async () => {
	express('buying from shop')

	// buy first champ in shop for now
	let target = await randomPointIn(gameModel.shop.slot1.region)
	let targetFinal = await randomPointIn(gameModel.bench[0].location)
	// drag champ from shop to position on board/bench
	await wmove(target)
	await mouse.pressButton(Button.LEFT)
	await wmove(targetFinal)
	await mouse.releaseButton(Button.LEFT)
	// return when finished
	return
}

app.on('ready', async () => {
	setApplicationMenu()
	initIpc()
	await createWindow()
	console.log('ready!')
	// register some global shortcuts
	// Take screenshot + process
	const ret = globalShortcut.register('CommandOrControl+;', async () => {
		express('running manual function')
		screenshot().then(async (img) => {
			let image = cv.imdecode(img)
		})
	})

	/* Game Loop */

	// poll for stage every 'x' ms
	let delay = 4000
	;(function loop() {
		setTimeout(function () {
			console.log('polling stage again')
			// polling logic here
			screenshot()
				.then(async (img) => {
					let image = cv.imdecode(img)
					if (
						gameModel.stage == '13' ||
						gameModel.stage == '32' ||
						gameModel.stage == '45'
					) {
						// expect augment picker soon
						let isAugmentRound = await isAugmentPicker(image)
						if (isAugmentRound) {
							// pick augment
							await pickAugment()
						}
					}

					// Determine if we're at a new stage
					express('detecting stage')
					detectStage(image, gameModel.stage).then(async (results) => {
						express(`got stage ${results.data}`)
						if (results.data != gameModel.stage && !isNaN(results.data)) {
							// console.log(results.data + gameModel.stage + !isNaN(results.data))
							/* New Stage Logic */
							// Update stage in model
							gameModel.stage = results.data
							// Update shop in model
							await getGold(image)
							await getShop(image)
							// If minion round, collect orbs and shit on board
							if (gameModel.stage[0] == '1' || gameModel.stage[1] == '1') {
								await collectLoot()
							}
							// Get ready for next stage
							// buy champs
							// await buyChamps()
						}
					})
					pushGameModel()
				})
				.catch((err) => {
					console.log(err)
				})
			loop()
		}, delay)
	})()
})

app.on('window-all-closed', () => {
	app.quit()
})
