type Methods = 'LSB' | 'BPCS'
type Operation = 'ENCODE' | 'DECODE'

type UIVariants = `${Methods}_${Operation}`

/*
 * LSB Encode:
 * Checkox type
 * Message
 * Input secret file
 * Key
 *
 * LSB Decode:
 * Key
 * Checkbox type
 * Message
 */

interface ElementInfo<T extends HTMLElement = HTMLElement> {
	id: string
	type: new () => T
}

interface Config {
	wasmUrl: string

	globalIds: {
		originalImageInput: ElementInfo<HTMLInputElement>
		originalImagePreview: ElementInfo<HTMLImageElement>
		resultImagePreview: ElementInfo<HTMLImageElement>
		submitButton: ElementInfo<HTMLButtonElement>
	}

	menu: {
		name: {
			methods: string
			operation: string
		}
		value: {
			methods: string[]
			operation: string[]
		}
	}

	UIids: {
		menu: {
			base: ElementInfo<HTMLDivElement>
			methods: ElementInfo<HTMLDivElement>
		}
		LSB: {
			baseBlock: ElementInfo<HTMLDivElement>
			encodeBlock: ElementInfo<HTMLDivElement>
			decodeBlock: ElementInfo<HTMLDivElement>
		}
	}

	ids: {
		DEBUG: ElementInfo<HTMLInputElement>,
		LSB: {
			keyInput: ElementInfo<HTMLInputElement>
			secretAsFileCheckbox: ElementInfo<HTMLInputElement>
		}
		LSB_ENCODE: {
			secretMessageInput: ElementInfo<HTMLInputElement>
			secretFileInput: ElementInfo<HTMLInputElement>
		}
		LSB_DECODE: {
			secretMessageOutput: ElementInfo<HTMLInputElement>
		}
	}
	// 	// 	message: "message",
	// }
	// ids: Object.freeze({
	// })
}

interface State {
	activeMethod: Methods
	activeOperation: Operation

	debugMode: boolean
}

type Assert = (condition: boolean, message: string) => asserts condition

type ConstuctorReturnType<T extends new (...args: any) => any> = T extends new (
	...args: any
) => infer R
	? R
	: any

type LoadElement = <T extends HTMLElement>(elementInfo: ElementInfo<T>) => T

/**
	* Functions from WASM Golang
	*/
declare function goDebug(debugMode: boolean): void
