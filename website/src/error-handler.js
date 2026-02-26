import { AssertionError, UserError } from './shared/errors.js'
import { loadElement } from './shared/shared.js'

/**
 *
 */
const block = loadElement({ id: 'error', type: HTMLDivElement })

/**
 *
 */
const message = loadElement({ id: 'error-message', type: HTMLDivElement })

/**
 *
 */
const button = loadElement({ id: 'error-close', type: HTMLButtonElement })

/**
 * Project scope error handler
 *
 * Side-effects: Change state and call render
 *
 * @param {unknown} err
 */
function errorHandler(err) {
	if (err instanceof AssertionError) {
		showError(
			'Inner application error which should never happen! Check console for more details!',
		)
		return
	}

	if (err instanceof UserError) {
		showError(err.message)
		return
	}

	if (err instanceof WebAssembly.RuntimeError) {
		showError('Something went wrong! Please check console or try again!')
		return
	}

	console.log('Error', err)
	showError('Catch unknown error! Check console for more details!')
}

/**
 * Reset error in state
 *
 * Side-effect: Change in DOM
 */
function resetError() {
	showError('')
}

/**
 * @param {string} errorMessage
 */
function showError(errorMessage) {
	message.textContent = errorMessage
	block.dataset['active'] = errorMessage !== '' ? 'true' : 'false'
}

button.addEventListener('click', resetError)
window.addEventListener('error', e => errorHandler(e.error))
window.addEventListener('unhandledrejection', e => errorHandler(e.reason))

export { resetError }
