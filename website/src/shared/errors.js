/**
 * Represents error when some logic error happens which should never happen
 *
 * Example: HTML element by config should have one type, but we have other
 */
class AssertionError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message)
		this.name = 'AssertionError'
	}
}

/**
 * Invariant for {@link AssertionError}
 *
 * @type {Assert}
 */
function assert(condition, message) {
	if (!condition) {
		throw new AssertionError(message)
	}
}

/**
 * Represents error for operator mistakes
 *
 * Example: Function to encode data was called, but image by user was not
 * loaded yet
 */
class UserError extends Error {
	/**
	 * @param {string} message
	 */
	constructor(message) {
		super(message)
		this.name = 'UserError'
	}
}

/**
 * Invariant for {@link UserError}
 *
 * @type {Assert}
 */
function userAssert(condition, message) {
	if (!condition) {
		throw new UserError(message)
	}
}

export { UserError, AssertionError, userAssert, assert }
