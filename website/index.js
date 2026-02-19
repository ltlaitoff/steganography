// prettier-ignore
/**
 * Set of LSB key fields
 *
 * @type LSBKeyParams[]
 */
const LSB_KEY_PARAMS = [
	'StartX', 'StartY', 'EndX',
	'EndY', 'GapX', 'GapY',
	'ChannelsPerPixel', 'Channels'
]

// prettier-ignore
/**
 * @type Record<LSBKeyParams, string>
 *
 * DEV: What if we merge LSB_KEY_PARAMS and this parsing schema into one?
 */
const LSB_KEY_PARSING_SCHEMA = {
	StartX: 'S', StartY: 'T', EndX: 'E',
	EndY: 'N', GapX: 'H', GapY: 'V',
	ChannelsPerPixel: 'P', Channels: 'C'
}

/**
 * @type {Config}
 */
const config = {
	wasmUrl: './main.wasm',

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
		lsbBlock: { id: "lsb", type: HTMLDivElement },
		encodeBlock: { id: "encode", type: HTMLDivElement },
		decodeBlock: { id: "decode", type: HTMLDivElement },
		swapButton: { id: "swap", type: HTMLButtonElement },

		ERROR: {
			block: { id: "error", type: HTMLDivElement },
			message: { id: "error-message", type: HTMLDivElement },
			button: { id: "error-close", type: HTMLButtonElement },
		}
	},

	// prettier-ignore
	// DEV: If we remove LSB and DEBUG it's all about secret
	ids: {
		DEBUG: { id: 'debug', type: HTMLInputElement },

		SHARED: {
			secretAsFileCheckbox: { id: 'secret-as-file', type: HTMLInputElement }
		},
		ENCODE: {
			secretMessageInput: { id: 'encode-secret-message-input', type: HTMLInputElement },
			secretFileInput: { id: 'encode-secret-file-input', type: HTMLInputElement },
			secretMessageInputBlock: { id: 'encode-secret-message-input-block', type: HTMLLabelElement },
			secretFileInputBlock: { id: 'encode-secret-file-input-block', type: HTMLLabelElement },
		},
		DECODE: {
			secretMessageOutputBlock: { id: 'decode-secret-message-output-block', type: HTMLLabelElement },
			secretFileOutputButtonBlock: { id: 'decode-secret-file-output-button-block', type: HTMLDivElement },
			secretMessageOutput: { id: 'decode-secret-message-output', type: HTMLInputElement },
			secretFileOutputButton: { id: 'decode-secret-file-output-button', type: HTMLButtonElement }
		},
		LSB: {
			keyInputBlock: { id: "lsb-secret-key-block", type: HTMLDivElement },
			keyInputOutput: { id: 'lsb-secret-key', type: HTMLInputElement },
		},
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
	lsbBlock: loadElement(config.UIids.lsbBlock),
	encodeBlock: loadElement(config.UIids.encodeBlock),
	decodeBlock: loadElement(config.UIids.decodeBlock),
	swapButton: loadElement(config.UIids.swapButton),
	ERROR: {
		block: loadElement(config.UIids.ERROR.block),
		message: loadElement(config.UIids.ERROR.message),
		button: loadElement(config.UIids.ERROR.button),
	},
}

// prettier-ignore
// DEV: Rename to SECRET and remove all this secret prefixes?
const SHARED = {
	secretAsFileCheckbox: loadElement(config.ids.SHARED.secretAsFileCheckbox),
	encode: {
		secretMessageInput: loadElement(config.ids.ENCODE.secretMessageInput),
		secretFileInput: loadElement(config.ids.ENCODE.secretFileInput),
		secretMessageInputBlock: loadElement(config.ids.ENCODE.secretMessageInputBlock),
		secretFileInputBlock: loadElement(config.ids.ENCODE.secretFileInputBlock)
	},
	decode: {
		secretMessageOutput: loadElement(config.ids.DECODE.secretMessageOutput),
		secretFileOutputButton: loadElement(config.ids.DECODE.secretFileOutputButton),
		secretMessageOutputBlock: loadElement(config.ids.DECODE.secretMessageOutputBlock),
		secretFileOutputButtonBlock: loadElement(config.ids.DECODE.secretFileOutputButtonBlock)
	}
}

// prettier-ignore
const LSB = {
	keyInputBlock: loadElement(config.ids.LSB.keyInputBlock),
	keyInputOutput: loadElement(config.ids.LSB.keyInputOutput),
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

	// DEV: Merge secrets?
	secretAsFile: false,
	secretMessage: '',
	encodeSecretFile: undefined,
	decodedSecretFile: undefined,

	LSB: {
		key: {
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
		},
	},

	errorMessage: '',
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
 * Reset error in state
 *
 * Side-effect: Change in DOM
 */
function resetError() {
	state.errorMessage = ''
	render()
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
		state.LSB.key = parsedKey

		render()
		return
	}

	assert(
		LSB_KEY_PARAMS.includes(target.name),
		'Key input block input name should be one of LSB key params',
	)

	// DEV: Magic string
	if (target.name === 'Channels') {
		const value = target.value.split('')
		state.LSB.key[target.name] = value

		render()
		return
	}

	const value = Number(target.value)
	assert(Number.isNaN(value) === false, 'Input number value should not be NaN!')

	state.LSB.key[target.name] = value
	render()
}

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
 * @param {ConstuctorReturnType<typeof config.ids.ENCODE.secretFileInput.type>} target
 */
function secretFileInputHandler(target) {
	assert(target.files !== null, 'LSB secret file input should have files')

	const file = target.files[0]
	userAssert(file !== undefined, 'No file selected. Please choose a file.')

	state.encodeSecretFile = file
}

/**
 * TODO: Description
 * @param {ConstuctorReturnType<typeof config.ids.SHARED.secretAsFileCheckbox.type>} target
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
	state.debugMode = target.checked
	goDebug(state.debugMode)
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
 * @param {ConstuctorReturnType<typeof config.ids.ENCODE.secretMessageInput.type>} target
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
	typedEventListener(SHARED.secretAsFileCheckbox, "change", config.ids.SHARED.secretAsFileCheckbox.type, secretMessageAsFileHandler)
	typedEventListener(SHARED.encode.secretFileInput, "change", config.ids.ENCODE.secretFileInput.type, secretFileInputHandler)
	typedEventListener(SHARED.decode.secretFileOutputButton, "click", config.ids.DECODE.secretFileOutputButton.type, secretFileOutputHandler)
	typedEventListener(LSB.keyInputBlock, 'change', HTMLInputElement, lsbKeyInputHandler)
	typedEventListener(GLOBAL.submitButton, 'click', HTMLButtonElement, submitHandler)
	typedEventListener(UI.ERROR.button, 'click', config.UIids.ERROR.button.type, resetError)
	typedEventListener(SHARED.encode.secretMessageInput, 'change', config.ids.ENCODE.secretMessageInput.type, secretMessageInputHandler)
	typedEventListener(UI.menu.base, 'change', HTMLInputElement, menuChangeHandler)

	window.addEventListener('error', e => globalErrorHandler(e.error))
	window.addEventListener('unhandledrejection', e => globalErrorHandler(e.reason))
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

/**
 * TODO: Description
 * @type {CheckGoOutput}
 */
function checkGoOutput(result) {
	assert(
		result !== undefined,
		'Golang function result should be always defined',
	)

	if (result.ok === false) {
		throw new UserError(`Error! ${result.message}`)
	}

	return result.data
}

// TODO: Description
async function submitHandler() {
	state.errorMessage = ''
	render()

	userAssert(state.originalImageFile !== undefined, 'Image is not loaded!')

	const originalImage = await fileToByteArray(state.originalImageFile)
	if (state.activeOperation === 'ENCODE') {
		const message = await prepareSecretMessage()
		assert(message !== undefined, 'Prepared secret message should be defined!')

		/**
		 * @type {Uint8Array<ArrayBuffer>}
		 */
		let content

		// DEV: This if/else can refactored into something better
		if (state.activeMethod === 'LSB') {
			content = checkGoOutput(
				goEncodeLSB(
					originalImage,
					message,
					generateLsbKey(state.LSB.key),
				),
			)
		} else if (state.activeMethod === 'BPCS') {
			content = checkGoOutput(goEncodeBPCS(originalImage, message))
		} else {
			assert(false, 'Active method not found!')
		}

		const blob = new Blob([content])
		state.resultImageFile = new File([blob], `result.${blob.type}`, {
			type: blob.type,
		})
	}

	if (state.activeOperation === 'DECODE') {
		/**
		 * @type {Uint8Array<ArrayBuffer>}
		 */
		let content

		// DEV: This if/else can refactored into something better
		if (state.activeMethod === 'LSB') {
			content = checkGoOutput(
				goDecodeLSB(
					originalImage,
					generateLsbKey(state.LSB.key),
				),
			)
		} else if (state.activeMethod === 'BPCS') {
			content = checkGoOutput(goDecodeBPCS(originalImage))
		} else {
			assert(false, 'Active method not found!')
		}

		if (state.secretAsFile) {
			state.decodedSecretFile = new File([content], `result`)
		} else {
			SHARED.decode.secretMessageOutput.value = content.toString()
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
		fetch(config.wasmUrl),
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
		UI.lsbBlock.classList.remove('hidden')
	} else if (state.activeMethod === 'BPCS') {
		UI.lsbBlock.classList.add('hidden')
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

	SHARED.secretAsFileCheckbox.checked = state.secretAsFile

	if (state.secretAsFile) {
		SHARED.encode.secretMessageInputBlock.classList.add('hidden')
		SHARED.decode.secretMessageOutputBlock.classList.add('hidden')
		SHARED.encode.secretFileInputBlock.classList.remove('hidden')
		SHARED.decode.secretFileOutputButtonBlock.classList.remove('hidden')
	} else {
		SHARED.encode.secretMessageInputBlock.classList.remove('hidden')
		SHARED.decode.secretMessageOutputBlock.classList.remove('hidden')
		SHARED.encode.secretFileInputBlock.classList.add('hidden')
		SHARED.decode.secretFileOutputButtonBlock.classList.add('hidden')
	}

	if (state.decodedSecretFile) {
		SHARED.decode.secretFileOutputButton.disabled = false
	} else {
		SHARED.decode.secretFileOutputButton.disabled = true
	}

	if (state.errorMessage !== '') {
		UI.ERROR.block.dataset['active'] = 'true'
		UI.ERROR.message.textContent = state.errorMessage
	} else {
		UI.ERROR.block.dataset['active'] = 'false'
		UI.ERROR.message.textContent = state.errorMessage
	}

	LSB.keyInputOutput.value = generateLsbKey(state.LSB.key)
	setLSBKeyFields()
}

// DEV: This function should not work like that
// It will be better to parse all inputs first, and after use them to set values
function setLSBKeyFields() {
	for (const key of LSB_KEY_PARAMS) {
		const input = LSB.keyInputBlock.querySelector(`[name=${key}]`)
		assert(
			input instanceof HTMLInputElement,
			`LSB key field with name ${key} should be HTMLInputElement`,
		)

		// DEV: Magic string
		if (key === 'Channels') {
			input.value = state.LSB.key[key].join('')
			continue
		}

		input.value = String(state.LSB.key[key])
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

	for (const param of LSB_KEY_PARAMS) {
		if (lsbKey[param] !== undefined) {
			// DEV: Magic string
			if (param !== 'Channels') {
				result += LSB_KEY_PARSING_SCHEMA[param] + lsbKey[param]
			} else {
				result += lsbKey[param]
					.map(el => LSB_KEY_PARSING_SCHEMA[param] + el)
					.join('')
			}
		}
	}

	return result
}

/**
 * Transform File to Uint8Array
 *
 * @type {(file: File) => Promise<Uint8Array>}
 */
async function fileToByteArray(file) {
	return file.arrayBuffer().then(value => new Uint8Array(value))
}

/**
 * Get element from DOM tree with type-checks
 *
 * @type {<T extends HTMLElement>(elementInfo: ElementInfo<T>) => T}
 */
function loadElement(elementInfo) {
	const element = document.querySelector('#' + elementInfo.id)
	assert(
		element !== null,
		`Element with id \"#${elementInfo.id}\" should not be null!`,
	)
	assert(
		element instanceof elementInfo.type,
		`Element with id \"#${elementInfo.id}\" should be instance of ${elementInfo.type.name}!`,
	)

	return element
}

/**
 * Wrapper on addEventListener with additional event target type check
 *
 * @type {TypedEventListener}
 */
function typedEventListener(element, type, elementType, callback) {
	element.addEventListener(type, e => {
		assert(
			e.target instanceof elementType,
			`Event on element ${element.tagName} #${element.id} should have target` +
			` with type ${elementType} on ${type}`,
		)

		callback(e.target, { ...e, target: e.target })
	})
}

/**
 * Represents error when some logic error happens which should never happen
 *
 * Example: HTML element by config should have one type, but we have other
 */
class AssertionError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message)
		this.name = 'AssertionError'
	}
}

/**
 * Invariant for {@link AssertionError}
 *
 * @type {Assert}
 */
function assert(condition, message) {
	if (!condition) {
		throw new AssertionError(message)
	}
}

/**
 * Represents error for operator mistakes
 *
 * Example: Function to encode data was called, but image by user was not
 * loaded yet
 */
class UserError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message)
		this.name = 'UserError'
	}
}

/**
 * Invariant for {@link UserError}
 *
 * @type {Assert}
 */
function userAssert(condition, message) {
	if (!condition) {
		throw new UserError(message)
	}
}

/**
 * Project scope error handler
 *
 * Side-effects: Change state and call render
 *
 * @param {unknown} err
 */
function globalErrorHandler(err) {
	/**
	 * @param {string} message
	 */
	function showError(message) {
		state.errorMessage = message
		render()
	}

	if (err instanceof AssertionError) {
		showError(
			'Inner application error which should never happen! Check console for more details!',
		)
		return
	}

	if (err instanceof UserError) {
		showError(err.message)
		return
	}

	if (err instanceof WebAssembly.RuntimeError) {
		showError('Something went wrong! Please check console or try again!')
		return
	}

	console.log('Error', err)
	showError('Catch unknown error! Check console for more details!')
}
