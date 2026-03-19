import { checkGoOutput } from "./shared/shared.js"

/**
 * @param {Uint8Array<ArrayBufferLike>} originalImage
 * @param {Uint8Array<ArrayBufferLike>} message
 */
function encode(originalImage, message) {
	return checkGoOutput(goEncodeBPCS(originalImage, message))
}

/**
 * @param {Uint8Array<ArrayBufferLike>} originalImage
 */
function decode(originalImage) {
	return checkGoOutput(goDecodeBPCS(originalImage))
}

export { encode, decode }
