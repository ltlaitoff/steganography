// Load WASM
export async function wasmBrowserInstantiate(wasmModuleUrl, importObject) {
	if (WebAssembly.instantiateStreaming) {
		return await WebAssembly.instantiateStreaming(
			fetch(wasmModuleUrl),
			importObject
		)
	}

	const wasmArrayBuffer = await fetch(wasmModuleUrl).then(response =>
		response.arrayBuffer()
	)

	return await WebAssembly.instantiate(wasmArrayBuffer, importObject)
}

const config = Object.freeze({
	WASM_URL: './main.wasm'
})

const go = new Go()

async function main() {
	const importObject = go.importObject
	const wasmModule = await wasmBrowserInstantiate(config.WASM_URL, importObject)
	go.run(wasmModule.instance)

	wasmModule.instance.exports.Log(true)
}

main()

