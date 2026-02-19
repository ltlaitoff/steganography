type Methods = 'LSB' | 'BPCS'
type Operation = 'ENCODE' | 'DECODE'

interface ElementInfo<T extends HTMLElement = HTMLElement> {
	id: string
	type: new () => T
}

interface Config {
	wasmUrl: string

	globalIds: {
		originalImageInput: ElementInfo<HTMLInputElement>
		originalImageInputDropZone: ElementInfo<HTMLLabelElement>
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
			secretMessageInputBlock: ElementInfo<HTMLLabelElement>
			secretFileInputBlock: ElementInfo<HTMLLabelElement>
			secretMessageInput: ElementInfo<HTMLInputElement>
			secretFileInput: ElementInfo<HTMLInputElement>
		}
		DECODE: {
			secretMessageOutput: ElementInfo<HTMLInputElement>
			secretFileOutputButton: ElementInfo<HTMLButtonElement>
			secretMessageOutputBlock: ElementInfo<HTMLLabelElement>
			secretFileOutputButtonBlock: ElementInfo<HTMLDivElement>
		}
	}
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

type TypedEventTarget<
	T extends HTMLElement,
	K extends keyof HTMLElementEventMap = '',
	E extends Event = K extends '' ? Event : HTMLElementEventMap<K>
> = Omit<E, 'target'> & { target: T }

type TypedEventListener = <
	K extends keyof HTMLElementEventMap,
	T extends HTMLElement
>(
	// Div for grouped events
	// TODO: Describe better
	element: T | HTMLDivElement,
	type: K,
	elementType: new () => T,
	listener: (target: T, e: TypedEventTarget<T, HTMLElementEventMap<K>>) => any
) => void

type CheckGoOutput = <T>(content: GolangOk<T> | GolangError) => T

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

declare function goEncodeLSB(
	image: Uint8Array,
	secretMessage: Uint8Array,
	key: string
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goDecodeLSB(
	image: Uint8Array,
	key: string
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goEncodeBPCS(
	image: Uint8Array,
	secretMessage: Uint8Array
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goDecodeBPCS(
	image: Uint8Array,
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goDebug(debugMode: boolean): void

declare function goParseLSBKey(key: string): GolangError | GolangOk<LSBKey>

/* Global */

interface Array<T> {
	includes(searchElement: any, fromIndex?: number): searchElement is T
}

interface JSON {
	parse(
		text: string,
		reviver?: (this: any, key: string, value: any) => any
	): unknown
}
