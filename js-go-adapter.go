//go:build js && wasm

package main

import (
	"syscall/js"
)

func JSToGoBytes(jsImageBytes js.Value) []byte {
	goImageBytes := make([]byte, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(goImageBytes, jsImageBytes)

	return goImageBytes
}

func GoToJsBytes(goImageBytes []byte) js.Value {
	uint8Array := js.Global().Get("Uint8Array").New(len(goImageBytes))
	js.CopyBytesToJS(uint8Array, goImageBytes)

	return uint8Array
}
