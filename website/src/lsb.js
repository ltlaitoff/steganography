import { assert } from './shared/errors.js'
import {
	checkGoOutput,
	loadElement,
	loadInputElement,
	typedEventListener,
} from './shared/shared.js'

/**
 * Inner LSB key structure
 *
 * @typedef {Object} Key
 * @property {number} StartX
 * @property {number} StartY - Some description
 * @property {number} EndX
 * @property {number} EndY
 * @property {number} GapX
 * @property {number} GapY
 * @property {number} ChannelsPerPixel
 * @property {Object} Channels
 * @property {boolean} Channels.R
 * @property {boolean} Channels.G
 * @property {boolean} Channels.B
 * @property {boolean} IgnoreCapacity
 *
 * @typedef {keyof Key} KeyParams
 */

/**
 * Storage for parsed key information
 * Should be the main source of truth
 *
 * @type Key
 */
let key = {
	StartX: 0,
	StartY: 0,
	EndX: 0,
	EndY: 0,
	GapX: 0,
	GapY: 0,
	ChannelsPerPixel: 3,
	Channels: { R: true, G: true, B: true },
	IgnoreCapacity: false,
}

/**
 * Scheme how to encode key information from inner structure to
 * string represenation
 *
 * @type Record<KeyParams, string>
 */
const KEY_PARAMS_ENCODING = {
	StartX: 'S',
	StartY: 'T',
	EndX: 'E',
	EndY: 'N',
	GapX: 'H',
	GapY: 'V',
	ChannelsPerPixel: 'P',
	Channels: 'C',
	IgnoreCapacity: 'I',
}

/**
 * Names for all inputs which will be used to set different key params
 *
 * @typedef {(FIELDS)[keyof FIELDS]} KeyFields
 */
const FIELDS = /** @type {const} */ ({
	StartX: 'StartX',
	StartY: 'StartY',
	EndX: 'EndX',
	EndY: 'EndY',
	GapX: 'GapX',
	GapY: 'GapY',
	ChannelsPerPixel: 'ChannelsPerPixel',
	IgnoreCapacity: 'IgnoreCapacity',
	ChannelsR: 'R',
	ChannelsG: 'G',
	ChannelsB: 'B',
	Raw: 'RawKey',
})
const FIELDS_LIST = Object.values(FIELDS)

/**
 * All HTML inputs which are used to set key parameters
 *
 * @type Record<KeyFields, HTMLInputElement>
 */
// prettier-ignore
const keyInputs = {
	[FIELDS.StartX]: loadInputElement('lsb-key-start-x', FIELDS.StartX, 'number'),
	[FIELDS.StartY]: loadInputElement('lsb-key-start-y', FIELDS.StartY, 'number'),
	[FIELDS.EndX]: loadInputElement('lsb-key-end-x', FIELDS.EndX, 'number'),
	[FIELDS.EndY]: loadInputElement('lsb-key-end-y', FIELDS.EndY, 'number'),
	[FIELDS.GapX]: loadInputElement('lsb-key-gap-x', FIELDS.GapX, 'number'),
	[FIELDS.GapY]: loadInputElement('lsb-key-gap-y', FIELDS.GapY, 'number'),
	[FIELDS.ChannelsPerPixel]: loadInputElement('lsb-key-channels-per-pixel', FIELDS.ChannelsPerPixel, 'number'),
	[FIELDS.ChannelsR]: loadInputElement('lsb-key-channels-r', FIELDS.ChannelsR, 'checkbox'),
	[FIELDS.ChannelsG]: loadInputElement('lsb-key-channels-g', FIELDS.ChannelsG, 'checkbox'),
	[FIELDS.ChannelsB]: loadInputElement('lsb-key-channels-b', FIELDS.ChannelsB, 'checkbox'),
	[FIELDS.IgnoreCapacity]: loadInputElement('lsb-key-ignore-capacity', FIELDS.IgnoreCapacity, 'checkbox'),
	[FIELDS.Raw]: loadInputElement('lsb-key-raw', FIELDS.Raw, 'text'),
}

/**
 * Called when value of some of fields are changed
 *
 * AKA adapter from fields values to the inner key state
 *
 * @param {HTMLInputElement} target
 */
function lsbKeyInputHandler(target) {
	const field = target.name
	assert(
		FIELDS_LIST.includes(field),
		'Key input block input name should be one of LSB key params or raw key param',
	)

	if (field === FIELDS.Raw) {
		key = checkGoOutput(goParseLSBKey(target.value))

		render()
		return
	}

	if (
		field === FIELDS.ChannelsR ||
		field === FIELDS.ChannelsG ||
		field === FIELDS.ChannelsB
	) {
		const value = target.checked
		key.Channels[field] = value

		render()
		return
	}

	if (field === FIELDS.IgnoreCapacity) {
		key.IgnoreCapacity = target.checked

		render()
		return
	}

	const value = Number(target.value)
	assert(Number.isNaN(value) === false, 'Input number value should not be NaN!')

	key[field] = value
	render()
}

/**
 * Sync values of HTML inputs with inner key storage by overwriting inputs
 */
function render() {
	for (const field of FIELDS_LIST) {
		const input = keyInputs[field]
		if (
			field === FIELDS.ChannelsR ||
			field === FIELDS.ChannelsG ||
			field === FIELDS.ChannelsB
		) {
			input.checked = key.Channels[field]
			continue
		}

		if (field === FIELDS.IgnoreCapacity) {
			input.checked = key[field]
			continue
		}

		if (field === FIELDS.Raw) {
			keyInputs.RawKey.value = generateLsbKey(key)
			continue
		}

		input.value = String(key[field])
	}
}

/**
 * Transform whole lsb key from inner/parsed represenation to encoded/string
 *
 * @param {Key} lsbKey
 */
function generateLsbKey(lsbKey) {
	let result = ''

	for (const field of FIELDS_LIST) {
		if (field == FIELDS.Raw) continue

		if (
			field === FIELDS.ChannelsR ||
			field === FIELDS.ChannelsG ||
			field === FIELDS.ChannelsB
		) {
			if (lsbKey.Channels[field] === true) {
				result += KEY_PARAMS_ENCODING.Channels + field
			}

			continue
		}

		if (field === FIELDS.IgnoreCapacity) {
			const value = lsbKey[field] === true ? '1' : '0'
			result += KEY_PARAMS_ENCODING[field] + value
			continue
		}

		result += KEY_PARAMS_ENCODING[field] + lsbKey[field]
	}

	return result
}

const root = loadElement({ id: 'lsb', type: HTMLDivElement })
const keyBlock = loadElement({ id: 'lsb-key-block', type: HTMLDivElement })
typedEventListener(keyBlock, 'change', HTMLInputElement, lsbKeyInputHandler)
render()

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
