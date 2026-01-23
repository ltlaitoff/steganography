/**
 * @type {Record<UIVariants, string>}
 */
const UIVariants = Object.freeze({
	LSB_ENCODE: 'LSB_ENCODE',
	LSB_DECODE: 'LSB_DECODE',
	BPCS_ENCODE: 'BPCS_ENCODE',
	BPCS_DECODE: 'BPCS_DECODE'
})

/**
 * @type LSBKeyParams[]
 */
const LSB_KEY_PARAMS = [
	'startX',
	'startY',
	'endX',
	'endY',
	'gapX',
	'gapY',
	'channelsPerPixel',
	'channels'
]
/**
 * @type Record<LSBKeyParams, string>
 */
const LSB_KEY_PARSING_SCHEMA = {
	startX: 'S',
	startY: 'T',
	endX: 'E',
	endY: 'N',
	gapX: 'H',
	gapY: 'V',
	channelsPerPixel: 'P',
	channels: 'C'
}

/**
 * @type {Config}
 */
const config = {
	wasmUrl: './main.wasm',

	globalIds: {
		originalImageInput: { id: 'original-input', type: HTMLInputElement },
		originalImagePreview: { id: 'original-preview', type: HTMLImageElement },
		resultImagePreview: { id: 'result-preview', type: HTMLImageElement },
		submitButton: { id: 'submit-button', type: HTMLButtonElement }
	},

	menu: {
		name: {
			methods: 'menu-method',
			operation: 'menu-operation'
		},
		value: {
			methods: ['lsb', 'bpcs'],
			operation: ['encode', 'decode']
		}
	},

	// prettier-ignore
	UIids: {
		menu: {
			base: { id: "menu", type: HTMLDivElement },
			methods: { id: "menu-methods", type: HTMLDivElement },
		},
		LSB: {
			baseBlock: { id: "lsb", type: HTMLDivElement },
			encodeBlock: { id: "lsb-encode", type: HTMLDivElement },
			decodeBlock: { id: "lsb-decode", type: HTMLDivElement },
		},
		swapButton: { id: "swap", type: HTMLButtonElement }
	},

	// prettier-ignore
	ids: {
		DEBUG: { id: 'debug', type: HTMLInputElement },

		SHARED: {
			secretAsFileCheckbox: { id: 'lsb-secret-as-file', type: HTMLInputElement }
		},
		LSB: {
			keyInputBlock: { id: "lsb-secter-key-block", type: HTMLDivElement },
			keyOutput: { id: 'lsb-secret-key-output', type: HTMLInputElement },
		},
		ENCODE: {
			secretMessageInput: { id: 'lsb-encode-secret-message-input', type: HTMLInputElement },
			secretFileInput: { id: 'lsb-encode-secret-file-input', type: HTMLInputElement }
		},
		DECODE: {
			secretMessageOutput: { id: 'lsb-decode-secret-message-output', type: HTMLInputElement },
			secretFileOutputButton: { id: 'lsb-decode-secret-file-output-button', type: HTMLButtonElement }
		}
	}

	// ids: Object.freeze({
	// 	preview: "preview",
	// 	containerImage: 'container-image',
	// 	message: "message",
	// 	submitButton: 'submit-button',
	// 	result: 'result',
	// })
}

// prettier-ignore
const GLOBAL = {
	originalImagePreview: loadElement(config.globalIds.originalImagePreview),
	resultImagePreview: loadElement(config.globalIds.resultImagePreview),
	submitButton: loadElement(config.globalIds.submitButton),
	originalImageInput: loadElement(config.globalIds.originalImageInput),
}

const UI = {
	menu: {
		base: loadElement(config.UIids.menu.base),
		methods: loadElement(config.UIids.menu.methods)
	},
	LSB: {
		baseBlock: loadElement(config.UIids.LSB.baseBlock),
		encodeBlock: loadElement(config.UIids.LSB.encodeBlock),
		decodeBlock: loadElement(config.UIids.LSB.decodeBlock)
	},
	swapButton: loadElement(config.UIids.swapButton)
}

const SHARED = {
	secretAsFileCheckbox: loadElement(config.ids.SHARED.secretAsFileCheckbox),
}

// prettier-ignore
const LSB = {
	base: {
		keyInputBlock: loadElement(config.ids.LSB.keyInputBlock),
		keyOutput: loadElement(config.ids.LSB.keyOutput),
	},
	encode: {
		secretMessageInput: loadElement(config.ids.ENCODE.secretMessageInput),
		secretFileInput: loadElement(config.ids.ENCODE.secretFileInput)
	},
	decode: {
		secretMessageOutput: loadElement(config.ids.DECODE.secretMessageOutput),
		secretFileOutputButton: loadElement(config.ids.DECODE.secretFileOutputButton)
	}
}

const DEBUG = loadElement(config.ids.DEBUG)

/**
 * @type {State}
 */
const state = {
	activeMethod: 'LSB',
	activeOperation: 'ENCODE',
	debugMode: false,

	originalImageFile: undefined,
	resultImageFile: undefined,
	secretAsFile: false,
	secretMessage: '',
		encodeSecretFile: undefined,
		decodedSecretFile: undefined,

	LSB: {
		key: {
			startX: 0,
			startY: 0,
			endX: 0,
			endY: 0,
			gapX: 0,
			gapY: 0,
			channelsPerPixel: 3,
			channels: ['R', 'G', 'B']
		}
	}
}

// --

LSB.base.keyInputBlock.addEventListener("change", e => {
	assert(e.target instanceof HTMLInputElement, "Key input block change should be called only on input element!")
	assert(LSB_KEY_PARAMS.includes(e.target.name), "Key input block input name should be one of LSB key params")
	if (
		e.target.name === 'channels'
	) {
		const value = e.target.value.split("")
		state.LSB.key[e.target.name] = value
		return
	}

	const value = Number(e.target.value)
	assert(Number.isNaN(value) === false, "Input number value should not be NaN!")

	state.LSB.key[e.target.name] = value
})

LSB.decode.secretFileOutputButton.addEventListener('click', e => {
	assert(
		e.target instanceof config.ids.DECODE.secretFileOutputButton.type,
		'Event target of lsb decode file output button should be equalt to config value'
	)

	assert(
		state.decodedSecretFile !== undefined,
		'Decoded secret file lsb should be defined on click on button'
	)

	const url = URL.createObjectURL(state.decodedSecretFile)

	const a = document.createElement('a')
	a.href = url
	a.download = state.decodedSecretFile.name
	document.body.appendChild(a)
	a.click()

	a.remove()
	URL.revokeObjectURL(url)
})

LSB.encode.secretFileInput.addEventListener('change', e => {
	assert(
		e.target instanceof config.ids.ENCODE.secretFileInput.type,
		'Event target of lsb secret file input should be equal to config file'
	)
	assert(e.target.files !== null, 'LSB secret file input should have files')

	const file = e.target.files[0]
	if (!file) {
		throw new Error('No file selected. Please choose a file.')
	}

	state.encodeSecretFile = file
})

SHARED.secretAsFileCheckbox.addEventListener('change', e => {
	assert(
		e.target instanceof config.ids.SHARED.secretAsFileCheckbox.type,
		'Event target on click lsb secret as file should be same type as config'
	)

	state.secretAsFile = e.target.checked

	render()
})

UI.swapButton.addEventListener('click', e => {
	assert(
		e.target instanceof config.UIids.swapButton.type,
		'Event target on click swap should be same type as config swap button'
	)

	if (state.originalImageFile === undefined) return
	if (state.resultImageFile === undefined) return

	const temp = state.originalImageFile
	state.originalImageFile = state.resultImageFile
	state.resultImageFile = temp

	render()
})

DEBUG.addEventListener('change', e => {
	assert(
		e.target instanceof config.ids.DEBUG.type,
		'Event target on change debug should be same type as debug'
	)

	state.debugMode = e.target.checked
	goDebug(state.debugMode)
})

GLOBAL.originalImageInput.addEventListener('change', e => {
	assert(
		e.target instanceof config.globalIds.originalImageInput.type,
		'Event target on change image input should be same type as type from config'
	)
	assert(e.target.files !== null, 'Original image input should have files')

	const file = e.target.files[0]
	if (!file) {
		throw new Error('No file selected. Please choose a file.')
	}

	state.originalImageFile = file
	render()

	// const reader = new FileReader()
	//
	// reader.onload = function() {
	// 	assert(this.result !== null, "")
	// }
	//
	// reader.onerror = () => {
	// 	throw new Error('Error reading the file. Please try again.')
	// }
	//
	// reader.readAsArrayBuffer(file)
})

LSB.encode.secretMessageInput.addEventListener('change', e => {
	assert(
		e.target !== null,
		'Secret message input on change event target is null!'
	)
	assert(
		e.target instanceof config.ids.ENCODE.secretMessageInput.type,
		'Secret message input on change event target should have the same type from config!'
	)

	state.secretMessage = e.target.value
})


async function prepareLSBSecretMessage() {
	if (state.secretAsFile === true) {
		if (state.encodeSecretFile === undefined) {
			throw new Error('LSB Secret file should exists to run LSB encoding')
		}

		return await fileToByteArray(state.encodeSecretFile)
	}

	if (state.secretMessage === '') {
		throw new Error('Secret message is empty!')
	}

	// *3 for support all letters
	// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto
	const message = new Uint8Array(state.secretMessage.length * 3)
	new TextEncoder().encodeInto(state.secretMessage, message)

	return message
}

async function submitLSBEncode() {
	if (state.originalImageFile === undefined) {
		throw new Error('Image is not loaded!')
	}


	const message = await prepareLSBSecretMessage()
	const originalImage = await fileToByteArray(state.originalImageFile)

	const content = goEncodeLSB(
		originalImage,
		state.originalImageFile.type,
		message,
		generateLsbKey()
	)

	console.log('JS result:', content, typeof content)

	let resultImageType = state.originalImageFile.type

	if (state.originalImageFile.type === 'image/jpeg') {
		resultImageType = 'image/png'
	}

	const blob = new Blob([content], { type: resultImageType })
	state.resultImageFile = new File([blob], `result.${blob.type}`, {
		type: blob.type
	})

	render()
}

async function submitLSBDecode() {
	if (state.originalImageFile === undefined) {
		throw new Error('Image is not loaded!')
	}

	const originalImage = await fileToByteArray(state.originalImageFile)

	let decodeImageType = state.originalImageFile.type

	if (state.originalImageFile.type === 'image/jpeg') {
		decodeImageType = 'image/png'
	}

	const decoded = goDecodeLSB(originalImage, decodeImageType, generateLsbKey())

	if (state.secretAsFile) {
		state.decodedSecretFile = new File([decoded], `result`)
	} else {
		LSB.decode.secretMessageOutput.value = decoded.toString()
	}

	console.log('Decoded message js:', decoded)

	render()
}

async function submitBPCSEncode() {

}

async function submitBPCSDecode() {

}

GLOBAL.submitButton.addEventListener('click', () => {
	if (state.activeMethod == 'LSB') {
		if (state.activeOperation == 'ENCODE') {
			submitLSBEncode()
		}

		if (state.activeOperation == 'DECODE') {
			submitLSBDecode()
		}
	}

	if (state.activeMethod == 'BPCS') {
		if (state.activeOperation == 'ENCODE') {
			submitBPCSEncode()
		}

		if (state.activeOperation == 'DECODE') {
			submitBPCSDecode()
		}
	}
})

UI.menu.base.addEventListener('change', e => {
	assert(
		e.target instanceof HTMLInputElement,
		'Change event in menu should be only on HTMLInputElement'
	)

	assert(
		e.target.name == config.menu.name.methods ||
		e.target.name == config.menu.name.operation,
		'Menu input name should be one of menu names'
	)

	assert(
		config.menu.value.methods.includes(e.target.value) ||
		config.menu.value.operation.includes(e.target.value),
		'Menu input value should be one from menu config'
	)

	if (e.target.name == config.menu.name.methods) {
		if (e.target.checked) {
			if (e.target.value == 'lsb') {
				state.activeMethod = 'LSB'
			}

			if (e.target.value == 'bpcs') {
				state.activeMethod = 'BPCS'
			}
		}
	}

	if (e.target.name == config.menu.name.operation) {
		if (e.target.checked) {
			if (e.target.value == 'encode') {
				state.activeOperation = 'ENCODE'
			}

			if (e.target.value == 'decode') {
				state.activeOperation = 'DECODE'
			}
		}
	}

	render()
})

async function main() {
	render()

	const go = new Go()

	const wasmModule = await WebAssembly.instantiateStreaming(
		fetch(config.wasmUrl),
		go.importObject
	)
	go.run(wasmModule.instance)
}

main()

function render() {
	if (state.activeMethod == 'LSB') {
		UI.LSB.baseBlock.classList.remove('hidden')

		if (state.activeOperation === 'ENCODE') {
			UI.LSB.encodeBlock.classList.remove('hidden')
			UI.LSB.decodeBlock.classList.add('hidden')
		} else {
			UI.LSB.encodeBlock.classList.add('hidden')
			UI.LSB.decodeBlock.classList.remove('hidden')
		}
	} else if (state.activeMethod == 'BPCS') {
		UI.LSB.baseBlock.classList.add('hidden')
	}

	if (state.originalImageFile) {
		GLOBAL.originalImagePreview.src = URL.createObjectURL(
			state.originalImageFile
		)
	}

	if (state.resultImageFile) {
		GLOBAL.resultImagePreview.src = URL.createObjectURL(state.resultImageFile)
	}

	SHARED.secretAsFileCheckbox.checked = state.secretAsFile

	if (state.secretAsFile) {
		LSB.encode.secretMessageInput.classList.add('hidden')
		LSB.decode.secretMessageOutput.classList.add('hidden')
		LSB.encode.secretFileInput.classList.remove('hidden')
		LSB.decode.secretFileOutputButton.classList.remove('hidden')
	} else {
		LSB.encode.secretMessageInput.classList.remove('hidden')
		LSB.decode.secretMessageOutput.classList.remove('hidden')
		LSB.encode.secretFileInput.classList.add('hidden')
		LSB.decode.secretFileOutputButton.classList.add('hidden')
	}

	if (state.decodedSecretFile) {
		LSB.decode.secretFileOutputButton.disabled = false
	} else {
		LSB.decode.secretFileOutputButton.disabled = true
	}
}

function generateLsbKey() {
	let result = ''

	for (const key of LSB_KEY_PARAMS) {
		if (state.LSB.key[key] !== undefined) {

			if (key !== 'channels') {
				result += LSB_KEY_PARSING_SCHEMA[key] + state.LSB.key[key]
			} else {
				result += state.LSB.key[key].map(el => LSB_KEY_PARSING_SCHEMA[key] + el).join("")
			}
		}
	}

	return result
}

/**
 * @type {FileToByteArray}
 */
async function fileToByteArray(file) {
	return file.arrayBuffer().then(value => new Uint8Array(value))
}

/**
 * @type {LoadElement}
 */
function loadElement(elementInfo) {
	const element = document.querySelector('#' + elementInfo.id)
	assert(
		element !== null,
		`Element with id \"#${elementInfo.id}\" should not be null!`
	)
	assert(
		element instanceof elementInfo.type,
		`Element with id \"#${elementInfo.id}\" should be instance of ${elementInfo.type.name}!`
	)

	return element
}

/**
 * @type {Assert}
 */
function assert(condition, message) {
	if (!condition) {
		throw new Error(message)
	}
}
