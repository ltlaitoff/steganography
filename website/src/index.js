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
import { CreateMenu } from './menu.js'
import { getSecret, setSecret } from './secret.js'

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

	// prettier-ignore
	UIids: {
		encodeBlock: { id: "encode", type: HTMLDivElement },
		decodeBlock: { id: "decode", type: HTMLDivElement },
		swapButton: { id: "swap", type: HTMLButtonElement },
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
	encodeBlock: loadElement(config.UIids.encodeBlock),
	decodeBlock: loadElement(config.UIids.decodeBlock),
	swapButton: loadElement(config.UIids.swapButton),
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
 * Create all event handlers
 */
// prettier-ignore
function initEventHandlers() {
	typedEventListener(DEBUG, 'change', config.ids.DEBUG.type, debugChangeHandler)
	typedEventListener(GLOBAL.originalImageInput, 'change', config.globalIds.originalImageInput.type, originalImageChangeHandler)
	typedEventListener(UI.swapButton, 'click', config.UIids.swapButton.type, swapImagesHandler)
	typedEventListener(GLOBAL.submitButton, 'click', HTMLButtonElement, submitHandler)
}

// TODO: Description
async function submitHandler() {
	ErrorHandler.resetError()

	userAssert(state.originalImageFile !== undefined, 'Image is not loaded!')
	const originalImage = await fileToByteArray(state.originalImageFile)

	if (state.activeOperation === 'ENCODE') {
		const message = await getSecret()
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

		setSecret(content)
	}

	render()
}

/**
	* @type {import('./menu.js').Blocks}
	*/
const MENU = [
	{
		name: "Methods",
		operations: ["LSB", "BPCS"],
		callback: (method) => {
			assert(method === "LSB" || method == "BPCS", "Menu method should be one from passed!")
			state.activeMethod = method
			render()
		}
	},
	{
		name: "Operations",
		operations: ["ENCODE", "DECODE"],
		callback: (operation) => {
			assert(operation === "ENCODE" || operation == "DECODE", "Menu operation should be one from passed!")
			state.activeOperation = operation
			render()
		}
	},
]

// DEV: Move this to top?
async function main() {
	initEventHandlers()
	CreateMenu(MENU)

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
}
