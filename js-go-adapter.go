//go:build js && wasm

package main

import (
	"syscall/js"
)

// JSToGoBytes transforms javascript Uint8Array to golang []byte
func JSToGoBytes(jsImageBytes js.Value) []byte {
	goImageBytes := make([]byte, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(goImageBytes, jsImageBytes)

	return goImageBytes
}

// JSToGoBytes transforms golang []byte to javascript Uint8Array
func GoToJsBytes(goImageBytes []byte) js.Value {
	uint8Array := js.Global().Get("Uint8Array").New(len(goImageBytes))
	js.CopyBytesToJS(uint8Array, goImageBytes)

	return uint8Array
}

// JsError used to get formatted error for javascript
func JsError(message string) any {
	return js.ValueOf(map[string]any{
		"ok":      false,
		"message": message,
	})
}

// JsSuccess used to get formatted data for javascript
func JsSuccess(data any) any {
	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": data,
	})
}
