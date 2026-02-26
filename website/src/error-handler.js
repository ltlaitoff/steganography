import { AssertionError, UserError } from './shared/errors.js'
import { loadElement } from './shared/shared.js'

/**
 * Error handler has root element `#error` which can be used in future
 *
 * Right not it's not used because we automatically hide this element via
 * CSS if message is empty
 */

/**
 * Message which will be showed to user
 */
const message = loadElement({ id: 'error-message', type: HTMLDivElement })

/**
 * Allows user to close the block
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
 * Remove the error
 */
function resetError() {
	showError('')
}

/**
 * Show the error to the user
 *
 * If message is empty then error will be hidden from user via CSS
 *
 * @param {string} errorMessage
 */
function showError(errorMessage) {
	message.textContent = errorMessage
}

button.addEventListener('click', resetError)
window.addEventListener('error', e => errorHandler(e.error))
window.addEventListener('unhandledrejection', e => errorHandler(e.reason))

export { resetError }
