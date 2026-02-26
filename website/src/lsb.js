import { assert } from './shared/errors.js'
import {
	checkGoOutput,
	loadElement,
	typedEventListener,
} from './shared/shared.js'

// prettier-ignore
/**
 * Set of LSB key fields
 *
 * @type LSBKeyParams[]
 */
const KEY_PARAMS = [
	'StartX', 'StartY', 'EndX', 'EndY', 'GapX', 'GapY',
	'ChannelsPerPixel', 'Channels', "IgnoreCapacity"
]

// prettier-ignore
/**
 * @type Record<LSBKeyParams, string>
 *
 * DEV: What if we merge KEY_PARAMS and this parsing schema into one?
 */
const KEY_SCHEMA = {
	StartX: 'S', StartY: 'T', EndX: 'E', EndY: 'N', GapX: 'H', GapY: 'V',
	ChannelsPerPixel: 'P', Channels: 'C', IgnoreCapacity: "I",
}

const keyInputBlock = loadElement({
	id: 'lsb-secret-key-block',
	type: HTMLDivElement,
})
const keyInputOutput = loadElement({
	id: 'lsb-secret-key',
	type: HTMLInputElement,
})
const root = loadElement({ id: 'lsb', type: HTMLDivElement })

/**
 * @type {LSBKey}
 */
let key = {
	StartX: 0,
	StartY: 0,
	EndX: 0,
	EndY: 0,
	GapX: 0,
	GapY: 0,
	ChannelsPerPixel: 3,

	// DEV: All values are numbers and only this are array
	// It will be better to change it from input to checkboxes in UI and
	// to int in logic
	// Like: 101 = RGB, R and B is enabled
	Channels: ['R', 'G', 'B'],
	IgnoreCapacity: false,
}

/**
 * TODO: Description
 * @param {HTMLInputElement} target
 */
function lsbKeyInputHandler(target) {
	// DEV: Magic string
	if (target.name === 'key') {
		if (target.value === '') return

		const parsedKey = checkGoOutput(goParseLSBKey(target.value))
		key = parsedKey

		render()
		return
	}

	assert(
		KEY_PARAMS.includes(target.name),
		'Key input block input name should be one of LSB key params',
	)

	// DEV: Magic string
	if (target.name === 'Channels') {
		const value = target.value.split('')
		key[target.name] = value

		render()
		return
	}

	if (target.name === 'IgnoreCapacity') {
		key[target.name] = target.checked

		console.log('[DEBUG JS] IgnoreCapacity handles', key[target.name])
		render()
		return
	}

	const value = Number(target.value)
	assert(Number.isNaN(value) === false, 'Input number value should not be NaN!')

	key[target.name] = value
	render()
}

typedEventListener(
	keyInputBlock,
	'change',
	HTMLInputElement,
	lsbKeyInputHandler,
)

function render() {
	keyInputOutput.value = generateLsbKey(key)
	setLSBKeyFields()
}

// DEV: This function should not work like that
// It will be better to parse all inputs first, and after use them to set values
function setLSBKeyFields() {
	for (const keySelector of KEY_PARAMS) {
		const input = keyInputBlock.querySelector(`[name=${keySelector}]`)
		assert(
			input instanceof HTMLInputElement,
			`LSB key field with name ${keySelector} should be HTMLInputElement`,
		)

		// DEV: Magic string
		if (keySelector === 'Channels') {
			input.value = key[keySelector].join('')
			continue
		}

		if (keySelector === 'IgnoreCapacity') {
			input.checked = key[keySelector]
			continue
		}

		input.value = String(key[keySelector])
	}
}

/**
 * Transform whole lsb key from inner/parsed represenation to encoded/string
 *
 * @param {LSBKey} lsbKey
 *
 * DEV: I'm not sure about this function...
 */
function generateLsbKey(lsbKey) {
	let result = ''

	for (const param of KEY_PARAMS) {
		if (lsbKey[param] !== undefined) {
			// DEV: Magic string

			if (param === 'Channels') {
				result += lsbKey[param].map(el => KEY_SCHEMA[param] + el).join('')
				continue
			}

			if (param === 'IgnoreCapacity') {
				const value = lsbKey[param] === true ? '1' : '0'
				result += KEY_SCHEMA[param] + value
				continue
			}

			result += KEY_SCHEMA[param] + lsbKey[param]
		}
	}

	return result
}

/**
 * @param {Uint8Array<ArrayBufferLike>} originalImage
 * @param {Uint8Array<ArrayBufferLike>} message
 */
function encode(originalImage, message) {
	return checkGoOutput(goEncodeLSB(originalImage, message, generateLsbKey(key)))
}

/**
 * @param {Uint8Array<ArrayBufferLike>} originalImage
 */
function decode(originalImage) {
	return checkGoOutput(goDecodeLSB(originalImage, generateLsbKey(key)))
}

export { root, encode, decode }
