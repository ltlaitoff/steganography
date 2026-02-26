import { assert } from './errors.js'

/**
 * Transform File to Uint8Array
 *
 * @type {(file: File) => Promise<Uint8Array>}
 */
export async function fileToByteArray(file) {
	return file.arrayBuffer().then(value => new Uint8Array(value))
}

/**
 * Get element from DOM tree with type-checks
 *
 * @type {<T extends HTMLElement>(elementInfo: ElementInfo<T>) => T}
 */
export function loadElement(elementInfo) {
	const element = document.querySelector('#' + elementInfo.id)
	assert(
		element !== null,
		`Element with id \"#${elementInfo.id}\" should not be null!`,
	)
	assert(
		element instanceof elementInfo.type,
		`Element with id \"#${elementInfo.id}\" should be instance of ${elementInfo.type.name}!`,
	)

	return element
}

/**
 * Wrapper on addEventListener with additional event target type check
 *
 * @type {TypedEventListener}
 */
export function typedEventListener(element, type, elementType, callback) {
	element.addEventListener(type, e => {
		assert(
			e.target instanceof elementType,
			`Event on element ${element.tagName} #${element.id} should have target` +
				` with type ${elementType} on ${type}`,
		)

		callback(e.target, { ...e, target: e.target })
	})
}
