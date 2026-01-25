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
		ERROR: {
			block: ElementInfo<HTMLDivElement>
			message: ElementInfo<HTMLDivElement>
			button: ElementInfo<HTMLButtonElement>
		}
	}

	ids: {
		DEBUG: ElementInfo<HTMLInputElement>
		SHARED: {
			secretAsFileCheckbox: ElementInfo<HTMLInputElement>
		}
		LSB: {
			keyInputBlock: ElementInfo<HTMLDivElement>
			keyInputOutput: ElementInfo<HTMLInputElement>
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
	StartX: number
	StartY: number
	EndX: number
	EndY: number
	GapX: number
	GapY: number
	ChannelsPerPixel: number
	Channels: string[]
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

	errorMessage: string
}

type Assert = (condition: boolean, message: string) => asserts condition

type ConstuctorReturnType<T extends new (...args: any) => any> = T extends new (
	...args: any
) => infer R
	? R
	: any

type LoadElement = <T extends HTMLElement>(elementInfo: ElementInfo<T>) => T
type FileToByteArray = (file: File) => Promise<Uint8Array>

type ErrorHandler = (err: unknown) => void
type ShowError = (message: string) => void

type IsRecord = (value: unknown) => value is Record<string, unknown>

/**
 * Functions from WASM Golang
 */

interface GolangError {
	ok: false
	message: string
}

interface GolangOk<T> {
	ok: true
	data: T
}

//prettier-ignore
declare function goEncodeLSB(image: Uint8Array, imageType: string, secretMessage: Uint8Array, key: string): GolangError | GolangOk<Uint8Array>
//prettier-ignore
declare function goDecodeLSB(image: Uint8Array, imageType: string, key: string): GolangError | GolangOk<Uint8Array>
//prettier-ignore
declare function goEncodeBPCS(image: Uint8Array, imageType: string, secretMessage: Uint8Array): GolangError | GolangOk<Uint8Array>
//prettier-ignore
declare function goDecodeBPCS(image: Uint8Array, imageType: string): GolangError | GolangOk<Uint8Array>
//prettier-ignore
declare function goDebug(debugMode: boolean): void
//prettier-ignore
declare function goParseLSBKey(key: string): GolangError | GolangOk<LSBKey>

interface Array<T> {
	includes(searchElement: any, fromIndex?: number): searchElement is T
}

interface ObjectConstructor {
	typedKeys<T>(obj: T): Array<keyof T>
}

interface JSON {
	parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown;
}
