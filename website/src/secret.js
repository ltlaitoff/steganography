import { assert, userAssert } from "./shared/errors.js"
import { fileToByteArray, loadElement, typedEventListener } from "./shared/shared.js"

const asFileCheckbox = loadElement({ id: 'secret-as-file', type: HTMLInputElement })

const messageInput = loadElement({ id: 'encode-secret-message-input', type: HTMLInputElement })
const fileInput = loadElement({ id: 'encode-secret-file-input', type: HTMLInputElement })
const messageOutput = loadElement({ id: 'decode-secret-message-output', type: HTMLInputElement, })
const fileOutputButton = loadElement({ id: 'decode-secret-file-output-button', type: HTMLButtonElement, })

const messageInputBlock = loadElement({ id: 'encode-secret-message-input-block', type: HTMLLabelElement, })
const fileInputBlock = loadElement({ id: 'encode-secret-file-input-block', type: HTMLLabelElement, })
const messageOutputBlock = loadElement({ id: 'decode-secret-message-output-block', type: HTMLLabelElement, })
const fileOutputButtonBlock = loadElement({ id: 'decode-secret-file-output-button-block', type: HTMLDivElement, })

/**
	* @type {{
	* secretAsFile: boolean
	* secretMessage: string
	* encodeSecretFile: File | undefined
	* decodedSecretFile: File | undefined
	* }}
	*/
const state = {
	secretAsFile: false,
	secretMessage: "",
	encodeSecretFile: undefined,
	decodedSecretFile: undefined,
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
 * @param {HTMLInputElement} target
 */
function secretFileInputHandler(target) {
	assert(target.files !== null, 'LSB secret file input should have files')

	const file = target.files[0]
	userAssert(file !== undefined, 'No file selected. Please choose a file.')

	state.encodeSecretFile = file
}

/**
 * TODO: Description
 * @param {HTMLInputElement} target
 */
function secretMessageAsFileHandler(target) {
	state.secretAsFile = target.checked
	render()
}

/**
 * TODO: Description
 * @param {HTMLInputElement} target
 */
function secretMessageInputHandler(target) {
	state.secretMessage = target.value
}

typedEventListener(asFileCheckbox, "change", HTMLInputElement, secretMessageAsFileHandler)
typedEventListener(fileInput, "change", HTMLInputElement, secretFileInputHandler)
typedEventListener(messageInput, 'change', HTMLInputElement, secretMessageInputHandler)
typedEventListener(fileOutputButton, "click", HTMLButtonElement, secretFileOutputHandler)

function render() {
	asFileCheckbox.checked = state.secretAsFile

	if (state.secretAsFile) {
		messageInputBlock.classList.add('hidden')
		messageOutputBlock.classList.add('hidden')
		fileInputBlock.classList.remove('hidden')
		fileOutputButtonBlock.classList.remove('hidden')
	} else {
		messageInputBlock.classList.remove('hidden')
		messageOutputBlock.classList.remove('hidden')
		fileInputBlock.classList.add('hidden')
		fileOutputButtonBlock.classList.add('hidden')
	}

	if (state.decodedSecretFile) {
		fileOutputButton.disabled = false
	} else {
		fileOutputButton.disabled = true
	}
}

// TODO: Description
// DEV: Does this function make sense?
async function getSecret() {
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
	* @param {Uint8Array<ArrayBuffer>} content
	*/
function setSecret(content) {
	if (state.secretAsFile) {
		state.decodedSecretFile = new File([content], `result`)
	} else {
		messageOutput.value = new TextDecoder().decode(content)
	}
}

render()

export {
	getSecret,
	setSecret
}
