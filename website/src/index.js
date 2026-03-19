import { assert, userAssert } from './shared/errors.js'
import {
	loadElement,
	typedEventListener,
	fileToByteArray,
} from './shared/shared.js'
import * as ErrorHandler from './error-handler.js'
import * as LSB from './methods/lsb.js'
import * as BPCS from './methods/bpcs.js'
import { log } from './shared/debug.js'

const WASM_URL = "./main.wasm"

/**
 * @type {Config}
 */
const config = {
	// DEV: globalIds, menu ids, UIids and just ids?
	// Does it make sense?

	globalIds: {
		originalImageInput: { id: 'original-input', type: HTMLInputElement },
		originalImageInputDropZone: {
			id: 'original-input-drop-zone',
			type: HTMLLabelElement,
		},
		originalImagePreview: { id: 'original-preview', type: HTMLImageElement },
		resultImagePreview: { id: 'result-preview', type: HTMLImageElement },
		submitButton: { id: 'submit-button', type: HTMLButtonElement },
	},

	menu: {
		name: {
			methods: 'menu-method',
			operation: 'menu-operation',
		},
		value: {
			methods: ['lsb', 'bpcs'],
			operation: ['encode', 'decode'],
		},
	},

	// prettier-ignore
	UIids: {
		menu: {
			base: { id: "menu", type: HTMLDivElement },
			methods: { id: "menu-methods", type: HTMLDivElement },
		},
		encodeBlock: { id: "encode", type: HTMLDivElement },
		decodeBlock: { id: "decode", type: HTMLDivElement },
		swapButton: { id: "swap", type: HTMLButtonElement },
	},

	SECRET: {
		asFileCheckbox: { id: 'secret-as-file', type: HTMLInputElement },
		messageInput: { id: 'encode-secret-message-input', type: HTMLInputElement },
		fileInput: { id: 'encode-secret-file-input', type: HTMLInputElement },
		messageInputBlock: {
			id: 'encode-secret-message-input-block',
			type: HTMLLabelElement,
		},
		fileInputBlock: {
			id: 'encode-secret-file-input-block',
			type: HTMLLabelElement,
		},
		messageOutputBlock: {
			id: 'decode-secret-message-output-block',
			type: HTMLLabelElement,
		},
		fileOutputButtonBlock: {
			id: 'decode-secret-file-output-button-block',
			type: HTMLDivElement,
		},
		messageOutput: {
			id: 'decode-secret-message-output',
			type: HTMLInputElement,
		},
		fileOutputButton: {
			id: 'decode-secret-file-output-button',
			type: HTMLButtonElement,
		},
	},
	// prettier-ignore
	// DEV: If we remove LSB and DEBUG it's all about secret
	ids: {
		DEBUG: { id: 'debug', type: HTMLInputElement },
	},
}

// prettier-ignore
// DEV: Rename to BASE?
const GLOBAL = {
	originalImagePreview: loadElement(config.globalIds.originalImagePreview),
	originalImageInputDropZone: loadElement(config.globalIds.originalImageInputDropZone),
	resultImagePreview: loadElement(config.globalIds.resultImagePreview),
	submitButton: loadElement(config.globalIds.submitButton),
	originalImageInput: loadElement(config.globalIds.originalImageInput),
}

const UI = {
	menu: {
		base: loadElement(config.UIids.menu.base),
		methods: loadElement(config.UIids.menu.methods),
	},
	encodeBlock: loadElement(config.UIids.encodeBlock),
	decodeBlock: loadElement(config.UIids.decodeBlock),
	swapButton: loadElement(config.UIids.swapButton),
}

// prettier-ignore
// DEV: Rename to SECRET and remove all this secret prefixes?
const SECRET = {
	secretAsFileCheckbox: loadElement(config.SECRET.asFileCheckbox),
	encode: {
		secretMessageInput: loadElement(config.SECRET.messageInput),
		secretFileInput: loadElement(config.SECRET.fileInput),
		secretMessageInputBlock: loadElement(config.SECRET.messageInputBlock),
		secretFileInputBlock: loadElement(config.SECRET.fileInputBlock)
	},
	decode: {
		secretMessageOutput: loadElement(config.SECRET.messageOutput),
		secretFileOutputButton: loadElement(config.SECRET.fileOutputButton),
		secretMessageOutputBlock: loadElement(config.SECRET.messageOutputBlock),
		secretFileOutputButtonBlock: loadElement(config.SECRET.fileOutputButtonBlock)
	}
}

const DEBUG = loadElement(config.ids.DEBUG)

/**
 * @type {State}
 */
const state = {
	activeMethod: 'LSB',
	activeOperation: 'ENCODE',

	originalImageFile: undefined,
	resultImageFile: undefined,

	// DEV: Merge secrets?
	secretAsFile: false,
	secretMessage: '',
	encodeSecretFile: undefined,
	decodedSecretFile: undefined,
}

const methodsLogicMap = /** @type const */ {
	Encode: {
		LSB: LSB.encode,
		BPCS: BPCS.encode,
	},
	Decode: {
		LSB: LSB.decode,
		BPCS: BPCS.decode,
	},
}

// DEV: Re-check all assert messages!

// --

// DEV: Add type checks?
window.addEventListener('drop', e => {
	if (
		e.dataTransfer &&
		Array.from(e.dataTransfer.items).some(item => item.kind === 'file')
	) {
		e.preventDefault()
	}
})

// DEV: Add type checks?
window.addEventListener('dragover', e => {
	if (!e.target) return

	const fileItems =
		e.dataTransfer &&
		Array.from(e.dataTransfer.items).filter(item => item.kind === 'file')

	if (fileItems && fileItems.length > 0) {
		e.preventDefault()

		assert(e.target instanceof Node, 'e.target should be Node')

		if (!GLOBAL.originalImageInputDropZone.contains(e.target)) {
			e.dataTransfer.dropEffect = 'none'
		}
	}
})

// DEV: Add type checks?
GLOBAL.originalImageInputDropZone.addEventListener('dragover', e => {
	const fileItems =
		e.dataTransfer &&
		Array.from(e.dataTransfer.items).filter(item => item.kind === 'file')

	if (fileItems && fileItems.length > 0) {
		e.preventDefault()

		if (fileItems.some(item => item.type.startsWith('image/'))) {
			e.dataTransfer.dropEffect = 'copy'
		} else {
			e.dataTransfer.dropEffect = 'none'
		}
	}
})

// DEV: Add type checks?
GLOBAL.originalImageInputDropZone.addEventListener('drop', e => {
	e.preventDefault()

	const files =
		e.dataTransfer &&
		Array.from(e.dataTransfer.items)
			.map(item => item.getAsFile())
			.filter(file => file)

	const firstFile = files?.[0]

	userAssert(
		firstFile !== undefined && firstFile !== null,
		'No file selected. Please choose a file.',
	)

	state.originalImageFile = firstFile
	render()
})

/**
 * TODO: Description
 */
function secretFileOutputHandler() {
	assert(
		state.decodedSecretFile !== undefined,
		'Decoded secret file lsb should be defined on click on button',
	)

	const url = URL.createObjectURL(state.decodedSecretFile)

	// DEV: It's a bad logic
	// BUG: It will not work with big files
	const a = document.createElement('a')
	a.href = url
	a.download = state.decodedSecretFile.name
	document.body.appendChild(a)
	a.click()

	a.remove()
	URL.revokeObjectURL(url)
}

// DEV: What if we group secret handlers
// DEV: What if we group image handlers

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.SECRET.fileInput.type>} target
 */
function secretFileInputHandler(target) {
	assert(target.files !== null, 'LSB secret file input should have files')

	const file = target.files[0]
	userAssert(file !== undefined, 'No file selected. Please choose a file.')

	state.encodeSecretFile = file
}

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.SECRET.asFileCheckbox.type>} target
 */
function secretMessageAsFileHandler(target) {
	state.secretAsFile = target.checked
	render()
}

/**
 * TODO: Description
 *
 */
function swapImagesHandler() {
	if (state.originalImageFile === undefined) return
	if (state.resultImageFile === undefined) return

	const temp = state.originalImageFile
	state.originalImageFile = state.resultImageFile
	state.resultImageFile = temp

	render()
}

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.ids.DEBUG.type>} target
 */
function debugChangeHandler(target) {
	log.debugMode = target.checked
	goDebug(target.checked)
}

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.globalIds.originalImageInput.type>} target
 */
function originalImageChangeHandler(target) {
	const files = target.files
	assert(files !== null, 'Original image input should have files')

	const file = files[0]
	userAssert(file !== undefined, 'No file selected. Please choose a file.')

	state.originalImageFile = file
	render()
}

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.SECRET.messageInput.type>} target
 */
function secretMessageInputHandler(target) {
	state.secretMessage = target.value
}

/**
 * Create all event handlers
 */
// prettier-ignore
function initEventHandlers() {
	typedEventListener(DEBUG, 'change', config.ids.DEBUG.type, debugChangeHandler)
	typedEventListener(GLOBAL.originalImageInput, 'change', config.globalIds.originalImageInput.type, originalImageChangeHandler)
	typedEventListener(UI.swapButton, 'click', config.UIids.swapButton.type, swapImagesHandler)
	typedEventListener(SECRET.secretAsFileCheckbox, "change", config.SECRET.asFileCheckbox.type, secretMessageAsFileHandler)
	typedEventListener(SECRET.encode.secretFileInput, "change", config.SECRET.fileInput.type, secretFileInputHandler)
	typedEventListener(SECRET.decode.secretFileOutputButton, "click", config.SECRET.fileOutputButton.type, secretFileOutputHandler)
	typedEventListener(GLOBAL.submitButton, 'click', HTMLButtonElement, submitHandler)
	typedEventListener(SECRET.encode.secretMessageInput, 'change', config.SECRET.messageInput.type, secretMessageInputHandler)
	typedEventListener(UI.menu.base, 'change', HTMLInputElement, menuChangeHandler)
}

// TODO: Description
// DEV: Does this function make sense?
async function prepareSecretMessage() {
	if (state.secretAsFile === true) {
		userAssert(
			state.encodeSecretFile !== undefined,
			'Secret file should exists to run LSB encoding',
		)

		return await fileToByteArray(state.encodeSecretFile)
	}

	userAssert(state.secretMessage !== '', 'Secret message is empty!')

	return new TextEncoder().encode(state.secretMessage)
}

// TODO: Description
async function submitHandler() {
	ErrorHandler.resetError()

	userAssert(state.originalImageFile !== undefined, 'Image is not loaded!')
	const originalImage = await fileToByteArray(state.originalImageFile)

	if (state.activeOperation === 'ENCODE') {
		const message = await prepareSecretMessage()
		assert(message !== undefined, 'Prepared secret message should be defined!')

		const method = methodsLogicMap.Encode[state.activeMethod]
		assert(method !== undefined, 'Active method not found!')
		const content = method(originalImage, message)

		const blob = new Blob([content])
		state.resultImageFile = new File([blob], `result.${blob.type}`, {
			type: blob.type,
		})
	}

	if (state.activeOperation === 'DECODE') {
		const method = methodsLogicMap.Decode[state.activeMethod]
		assert(method !== undefined, 'Active method not found!')
		const content = method(originalImage)

		if (state.secretAsFile) {
			state.decodedSecretFile = new File([content], `result`)
		} else {
			SECRET.decode.secretMessageOutput.value = new TextDecoder().decode(content)
		}
	}

	render()
}

/**
 * TODO: Description
 * @param {HTMLInputElement} target
 */
function menuChangeHandler(target) {
	assert(
		target.name === config.menu.name.methods ||
			target.name === config.menu.name.operation,
		'Menu input name should be one of menu names',
	)

	assert(
		config.menu.value.methods.includes(target.value) ||
			config.menu.value.operation.includes(target.value),
		'Menu input value should be one from menu config',
	)

	if (target.name === config.menu.name.methods) {
		if (target.checked) {
			if (target.value === 'lsb') {
				state.activeMethod = 'LSB'
			}

			if (target.value === 'bpcs') {
				state.activeMethod = 'BPCS'
			}
		}
	}

	if (target.name === config.menu.name.operation) {
		if (target.checked) {
			if (target.value === 'encode') {
				state.activeOperation = 'ENCODE'
			}

			if (target.value === 'decode') {
				state.activeOperation = 'DECODE'
			}
		}
	}

	render()
}

// DEV: Move this to top?
async function main() {
	initEventHandlers()

	// DEV: Render before load go?
	render()

	const go = new Go()

	const wasmModule = await WebAssembly.instantiateStreaming(
		fetch(WASM_URL),
		go.importObject,
	)

	go.run(wasmModule.instance)
}

main()

function render() {
	// DEV: Add helper to swap hidden's
	if (state.activeOperation === 'ENCODE') {
		UI.encodeBlock.classList.remove('hidden')
		UI.decodeBlock.classList.add('hidden')
	} else {
		UI.encodeBlock.classList.add('hidden')
		UI.decodeBlock.classList.remove('hidden')
	}

	if (state.activeMethod === 'LSB') {
		LSB.root.classList.remove('hidden')
	} else if (state.activeMethod === 'BPCS') {
		LSB.root.classList.add('hidden')
	}

	if (state.originalImageFile) {
		GLOBAL.originalImagePreview.src = URL.createObjectURL(
			state.originalImageFile,
		)
		GLOBAL.originalImagePreview.classList.remove('hidden')
		GLOBAL.originalImageInputDropZone.classList.add('hidden')
	} else {
		GLOBAL.originalImagePreview.classList.add('hidden')
		GLOBAL.originalImageInputDropZone.classList.remove('hidden')
	}

	if (state.resultImageFile) {
		GLOBAL.resultImagePreview.src = URL.createObjectURL(state.resultImageFile)
	}

	SECRET.secretAsFileCheckbox.checked = state.secretAsFile

	if (state.secretAsFile) {
		SECRET.encode.secretMessageInputBlock.classList.add('hidden')
		SECRET.decode.secretMessageOutputBlock.classList.add('hidden')
		SECRET.encode.secretFileInputBlock.classList.remove('hidden')
		SECRET.decode.secretFileOutputButtonBlock.classList.remove('hidden')
	} else {
		SECRET.encode.secretMessageInputBlock.classList.remove('hidden')
		SECRET.decode.secretMessageOutputBlock.classList.remove('hidden')
		SECRET.encode.secretFileInputBlock.classList.add('hidden')
		SECRET.decode.secretFileOutputButtonBlock.classList.add('hidden')
	}

	if (state.decodedSecretFile) {
		SECRET.decode.secretFileOutputButton.disabled = false
	} else {
		SECRET.decode.secretFileOutputButton.disabled = true
	}
}
