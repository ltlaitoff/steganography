function assert(condition, message) {
	if (!condition) {
		throw new Error(message)
	}
}

const config = Object.freeze({
	WASM_URL: './main.wasm',
	ids: Object.freeze({
		preview: "preview",
		containerImage: 'container-image',
		message: "message",
		submitButton: 'submit-button',
		result: 'result',
	})
})

const state = {
	image: undefined,
	message: ''
}

const previewImage = document.querySelector('#' + config.ids.preview)
const resultImage = document.querySelector('#' + config.ids.result)
const messageInput = document.querySelector('#' + config.ids.message)
const containerImageInput = document.querySelector('#' + config.ids.containerImage)
assert(
	containerImageInput !== null,
	'Container image HTMLElement should not be null!'
)
const submitButton = document.querySelector('#' + config.ids.submitButton)
assert(
	submitButton !== null,
	'Submit button HTMLElement should not be null!'
)

containerImageInput.addEventListener('change', e => {
	const file = e.target.files[0]

	if (!file) {
		throw new Error('No file selected. Please choose a file.')
	}
	previewImage.src = URL.createObjectURL(file);

	const reader = new FileReader()

	reader.onload = function() {
		state.image = new Uint8Array(this.result)
	}

	reader.onerror = () => {
		showMessage('Error reading the file. Please try again.', 'error')
	}

	reader.readAsArrayBuffer(file)
})

messageInput.addEventListener('change', (e) => {
	state.message = e.target.value
})

submitButton.addEventListener('click', () => {
	const content = goLSB(state.image, state.message)

	console.log("JS", content)

	resultImage.src = URL.createObjectURL(
		new Blob([content.buffer], { type: 'image/bmp' })
	);
})

async function main() {
	const go = new Go()

	const wasmModule = await WebAssembly.instantiateStreaming(
		fetch(config.WASM_URL),
		go.importObject
	)
	go.run(wasmModule.instance)
}

main()
