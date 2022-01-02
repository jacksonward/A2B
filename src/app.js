import './stylesheets/main.css'
const { screen, Region } = require('@nut-tree/nut-js')
import * as PIXI from 'pixi.js'
const ipc = require('electron').ipcRenderer

// Log to node console from renderer
const nodeConsole = require('console')
const myConsole = new nodeConsole.Console(process.stdout, process.stderr)

// receive messages from the main process
ipc.on('model', (event, data) => {
	let model = JSON.parse(data)
	infoText.text = `
	Stage: ${model.stage}
	Shop: ${model.shop[0].name}, ${model.shop[1].name}, ${model.shop[2].name}, ${
		model.shop[3].name
	}, ${model.shop[4].name}
	Items: ${model.items.map((slot) => slot.name)}
	Gold: ${model.gold}
	Lvl: ${model.level}
	XP: ${model.xp}
	Bench: ${model.bench[0].champion.name},${model.bench[1].champion.name},${model.bench[2].champion.name},${model.bench[3].champion.name},
	${model.bench[3].champion.name},${model.bench[4].champion.name},${model.bench[5].champion.name}
	Traits: ${JSON.stringify(model.traits)}
	BuyList: ${model.buyList}
	# of Champs on Board: ${model.champsOnBoard}, # of Champs on Bench: 
	`
})

const app = new PIXI.Application({
	antialias: true,
	width: 1920,
	height: 1080,
	backgroundAlpha: 0,
})
// style text
const style = new PIXI.TextStyle({
	fill: 'white',
	fontFamily: '"Lucida Console", Monaco, monospace',
	fontSize: 16,
	wordWrap: true,
	wordWrapWidth: 2000,
})

// init text to be displayed
let textObj = new PIXI.Text('Overlay Running', style)
textObj.x = 10
textObj.y = 10
let infoText = new PIXI.Text(``, style)
infoText.x = 10
infoText.y = 80

let debugRects = [
	new Region(286, 745, 16, 8),
	new Region(331, 735, 16, 16),
	new Region(310, 703, 16, 16),
	new Region(347, 674, 16, 16),
	new Region(325, 644, 16, 16),
	new Region(335, 605, 16, 16),
	new Region(402, 674, 16, 16),
	new Region(382, 644, 16, 16),
	new Region(390, 607, 16, 16),
	new Region(448, 644, 16, 16),
]

let debug = new PIXI.Graphics()
debug.lineStyle(1, 0xFF0000)
debugRects.forEach(r => {
	debug.drawRect(r.left, r.top, r.width, r.height)
})

// draw debug boxes
ipc.on('draw', (event, data) => {
	let regions = JSON.parse(data)
	myConsole.log(regions)
	regions.forEach(region=> {
		debug.drawRect(region.left, region.top, region.width, region.height)
	})
})

// define text background
let textBG = new PIXI.Graphics()
textBG.beginFill(0, 0.69)
textBG.drawRect(0, 0, 650, 350)

document.body.appendChild(app.view)

// Add it to the stage to render
app.stage.addChild(textBG)
app.stage.addChild(textObj)
app.stage.addChild(infoText)
app.stage.addChild(debug)

let logArr = ['start', 'your', 'engines!']

ipc.on('express', (event, data) => {
	logArr.unshift(data)
	logArr.pop()
	textObj.text = `
${logArr[0]}
${logArr[1]}
${logArr[2]}
`
})