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
		}
	},

	// prettier-ignore
	ids: {
		LSB: {
			keyInput: { id: 'lsb-secret-key-input', type: HTMLInputElement },
			secretAsFileCheckbox: { id: 'lsb-secret-as-file', type: HTMLInputElement }
		},
		LSB_ENCODE: {
			secretMessageInput: { id: 'lsb-encode-secret-message-input', type: HTMLInputElement },
			secretFileInput: { id: 'lsb-encode-secret-file-input', type: HTMLInputElement }
		},
		LSB_DECODE: {
			secretMessageOutput: { id: 'lsb-decode-secret-message-output', type: HTMLInputElement }
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
	}
}

// prettier-ignore
const LSB = {
	base: {
		keyInput: loadElement(config.ids.LSB.keyInput),
		secretAsFileCheckbox: loadElement(config.ids.LSB.secretAsFileCheckbox),
	},
	encode: {
		secretMessageInput: loadElement(config.ids.LSB_ENCODE.secretMessageInput),
		secretFileInput: loadElement(config.ids.LSB_ENCODE.secretFileInput)
	},
	decode: {
		secretMessageOutput: loadElement(config.ids.LSB_DECODE.secretMessageOutput)
	}
}

/**
 * @type {State}
 */
const state = {
	activeMethod: 'LSB',
	activeOperation: 'ENCODE',

	image: undefined,
	imageFile: undefined,
	message: ''
}

GLOBAL.originalImageInput.addEventListener('change', e => {
	const file = e.target.files[0]

	if (!file) {
		throw new Error('No file selected. Please choose a file.')
	}

	GLOBAL.originalImagePreview.src = URL.createObjectURL(file)

	const reader = new FileReader()

	state.imageFile = file

	reader.onload = function () {
		state.image = new Uint8Array(this.result)
	}

	reader.onerror = () => {
		showMessage('Error reading the file. Please try again.', 'error')
	}

	reader.readAsArrayBuffer(file)
})

LSB.encode.secretMessageInput.addEventListener('change', e => {
	assert(
		e.target !== null,
		'Secret message input on change event target is null!'
	)
	assert(
		e.target instanceof config.ids.LSB_ENCODE.secretMessageInput.type,
		'Secret message input on change event target should have the same type from config!'
	)

	state.message = e.target.value
})

GLOBAL.submitButton.addEventListener('click', () => {
	const content = goLSB(state.image, state.imageFile.type, state.message)

	console.log('JS', content)

	GLOBAL.resultImagePreview.src = URL.createObjectURL(
		new Blob([content.buffer], { type: 'image/bmp' })
	)

	let decodeImageType = state.imageFile.type

	if (state.imageFile.type === 'image/jpeg') {
		decodeImageType = 'image/png'
	}

	const decodedMessage = goDecodeLSB(
		content,
		decodeImageType,
		state.message.length
	)
	console.log('Decoded message js:', decodedMessage)
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
