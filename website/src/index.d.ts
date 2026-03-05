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
		encodeBlock: ElementInfo<HTMLDivElement>
		decodeBlock: ElementInfo<HTMLDivElement>
		swapButton: ElementInfo<HTMLButtonElement>
	}

	SECRET: {
		asFileCheckbox: ElementInfo<HTMLInputElement>
		messageInputBlock: ElementInfo<HTMLLabelElement>
		fileInputBlock: ElementInfo<HTMLLabelElement>
		messageInput: ElementInfo<HTMLInputElement>
		fileInput: ElementInfo<HTMLInputElement>
		messageOutput: ElementInfo<HTMLInputElement>
		fileOutputButton: ElementInfo<HTMLButtonElement>
		messageOutputBlock: ElementInfo<HTMLLabelElement>
		fileOutputButtonBlock: ElementInfo<HTMLDivElement>
	}

	ids: {
		DEBUG: ElementInfo<HTMLInputElement>
	}
}

interface State {
	activeMethod: Methods
	activeOperation: Operation

	originalImageFile: File | undefined
	resultImageFile: File | undefined

	secretAsFile: boolean
	secretMessage: string

	encodeSecretFile: File | undefined
	decodedSecretFile: File | undefined
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
	E extends Event = K extends '' ? Event : HTMLElementEventMap<K>,
> = Omit<E, 'target'> & { target: T }

type TypedEventListener = <
	K extends keyof HTMLElementEventMap,
	T extends HTMLElement,
>(
	// Div for grouped events
	// TODO: Describe better
	element: T | HTMLDivElement,
	type: K,
	elementType: new () => T,
	listener: (target: T, e: TypedEventTarget<T, HTMLElementEventMap<K>>) => any,
) => void

type ObjectValuesToType<T extends object, V> = {
	[P in keyof T]: T[P] extends object ? ObjectValuesToType<T[P], V> : V
}

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
	key: string,
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goDecodeLSB(
	image: Uint8Array,
	key: string,
): GolangError | GolangOk<Uint8Array<ArrayBuffer>>

declare function goEncodeBPCS(
	image: Uint8Array,
	secretMessage: Uint8Array,
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
		reviver?: (this: any, key: string, value: any) => any,
	): unknown
}
