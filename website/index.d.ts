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

	ids: {
		LSB: {
			keyInput: ElementInfo<HTMLInputElement>
			secretAsFileCheckbox: ElementInfo<HTMLInputElement>
		}
		LSB_ENCODE: {
			secretMessageInput: ElementInfo<HTMLInputElement>
			secretFileInput: ElementInfo<HTMLInputElement>
		}
		LSB_DECODE: {
			secretAsFileCheckbox: ElementInfo<HTMLInputElement>
			secretMessageInput: ElementInfo<HTMLInputElement>
		}
	}
	// 	// 	message: "message",
	// }
	// ids: Object.freeze({
	// })
}

type Assert = (condition: boolean, message: string) => asserts condition


type ConstuctorReturnType<T extends new (...args: any) => any> = T extends new (...args: any) => infer R ? R : any;

type LoadElement = <T extends HTMLElement>(elementInfo: ElementInfo<T>) => T

