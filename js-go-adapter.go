//go:build js && wasm

package main

import (
	"syscall/js"
)

// TODO: Description
func JSToGoBytes(jsImageBytes js.Value) []byte {
	goImageBytes := make([]byte, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(goImageBytes, jsImageBytes)

	return goImageBytes
}

// TODO: Description
func GoToJsBytes(goImageBytes []byte) js.Value {
	uint8Array := js.Global().Get("Uint8Array").New(len(goImageBytes))
	js.CopyBytesToJS(uint8Array, goImageBytes)

	return uint8Array
}

// TODO: Description
func JsError(message string) any {
	return js.ValueOf(map[string]any{
		"ok":    false,
		"message": message,
	})
}

// DEV: Why there are not JSSuccess or JSOk? 
