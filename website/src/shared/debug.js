/**
 * Wrapper on console which allowes print information only if debug mode
 * is enabled
 */
export const log = {
	/**
	 * If enabled other methods will print information in the console
	 */
	debugMode: false,

	/**
	 * Print information in console in debug channel
	 */
	get debug() {
		/**
		 * NOTE: Reason why we cannot just create function and by condition call
		 * console.log consists in the problem that Dev Tools **shows the place
		 * where console.log was called, that is inside the wrapper, instead
		 * of showing where wrapper itself was called**
		 *
		 * This wrapper correctly shows in Dev Tools place where wrapper itself
		 * was called. It works because `debug` returns whe log function itself,
		 * which after will be called inside of code
		 *
		 * This function is a getter because on every call of this method
		 * we want to re-check condition and return new instance of log if mode was changed
		 *
		 * Bind is used only to add tag in log message
		 * We also bind console as this of .debug to support old browsers
		 */
		return this.debugMode ? console.debug.bind(console, '[JS]:') : () => {}
	},
}
