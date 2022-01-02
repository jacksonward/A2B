const WindMouse = require('windmouse')
const { mouse, Button } = require('@nut-tree/nut-js')

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

// Initialize WindMouse class
const windMouse = new WindMouse(Math.floor(Math.random() * 10))

// Move mouse to destination
const hover = async (target) => {
	let currentPos = await mouse.getPosition()
	// MouseSettings
	let settings = {
		startX: currentPos.x,
		startY: currentPos.y,
		endX: target.x,
		endY: target.y,
		gravity: 4,
		wind: 2,
		minWait: 1,
		maxWait: 2,
		maxStep: 4,
		targetArea: 5,
	}
	let points = await windMouse.GeneratePoints(settings)
	let path = points.map((x) => {
		return {
			x: x[0],
			y: x[1],
		}
	})
	let timeSteps = points.map((x) => x[2])
	await mouse.move(path, () => timeSteps)
}

// Move mouse and left click at destination
const leftClick = async (target) => {
	await hover(target)
	await mouse.leftClick()
	return
}

// Move mouse and right click at destination
const rightClick = async (target) => {
	await hover(target)
	await mouse.rightClick()
	return
}

const leftClickDelayed = async (target, delay) => {
	await hover(target)
	await mouse.pressButton(Button.LEFT)
	await sleep(delay)
	await mouse.releaseButton(Button.LEFT)
	return
}

const leftClickDrag = async (target1, target2) => {
	await hover(target1)
	await mouse.pressButton(Button.LEFT)
	await hover(target2)
	await mouse.releaseButton(Button.LEFT)
	return
}

const waitClick = async (target, delay) => {
	await hover(target)
	await mouse.rightClick()
	await sleep(delay)
	return
}

export { hover, leftClick, rightClick, leftClickDelayed, leftClickDrag, waitClick, sleep }