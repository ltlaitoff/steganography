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
		lsbBlock: ElementInfo<HTMLDivElement>
		encodeBlock: ElementInfo<HTMLDivElement>
		decodeBlock: ElementInfo<HTMLDivElement>
		swapButton: ElementInfo<HTMLButtonElement>
	}

	ids: {
		DEBUG: ElementInfo<HTMLInputElement>
		SHARED: {
			secretAsFileCheckbox: ElementInfo<HTMLInputElement>
		},
		LSB: {
			keyInputBlock: ElementInfo<HTMLDivElement>
			keyOutput: ElementInfo<HTMLInputElement>
		}
		ENCODE: {
			secretMessageInput: ElementInfo<HTMLInputElement>
			secretFileInput: ElementInfo<HTMLInputElement>
		}
		DECODE: {
			secretMessageOutput: ElementInfo<HTMLInputElement>
			secretFileOutputButton: ElementInfo<HTMLButtonElement>
		}
	}
	// 	// 	message: "message",
	// }
	// ids: Object.freeze({
	// })
}

interface LSBKey {
	startX?: number
	startY?: number
	endX?: number
	endY?: number
	gapX?: number
	gapY?: number
	channelsPerPixel?: number
	channels?: string[]
}

type LSBKeyParams = keyof LSBKey

interface State {
	activeMethod: Methods
	activeOperation: Operation

	debugMode: boolean

	originalImageFile: File | undefined
	resultImageFile: File | undefined

	secretAsFile: boolean
	secretMessage: string

	encodeSecretFile: File | undefined
	decodedSecretFile: File | undefined

	LSB: {
		key: LSBKey
	}
}

type Assert = (condition: boolean, message: string) => asserts condition

type ConstuctorReturnType<T extends new (...args: any) => any> = T extends new (
	...args: any
) => infer R
	? R
	: any

type LoadElement = <T extends HTMLElement>(elementInfo: ElementInfo<T>) => T
type FileToByteArray = (file: File) => Promise<Uint8Array>

/**
 * Functions from WASM Golang
 */
//prettier-ignore
declare function goEncodeLSB(image: Uint8Array, imageType: string, secretMessage: Uint8Array, key: string): Uint8Array
//prettier-ignore
declare function goDecodeLSB(image: Uint8Array, imageType: string, key: string): Uint8Array
//prettier-ignore
declare function goEncodeBPCS(image: Uint8Array, imageType: string, secretMessage: Uint8Array): Uint8Array
//prettier-ignore
declare function goDecodeBPCS(image: Uint8Array, imageType: string): Uint8Array
//prettier-ignore
declare function goDebug(debugMode: boolean): void

interface Array<T> {
	includes(searchElement: any, fromIndex?: number): searchElement is T
}
