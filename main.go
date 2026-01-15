//go:build js && wasm

package main

import (
	"fmt"
	"syscall/js"
)

func lsb(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run LSB")

	imageType := args[1].String()
	message := args[2].String()
	containerImage := ParseImageFromJS(args[0], imageType)

	stegoImageRaw := encodeMessage(message, containerImage)

	return ImageToJSBytes(&stegoImageRaw, imageType)
}

func decodeLsb(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run Decode LSB")

	imageType := args[1].String()
	messageLength := args[2].Int()
	image := ParseImageFromJS(args[0], imageType)

	return decodeMessage(image, messageLength)
}

func main() {
	c := make(chan bool)

	js.Global().Set("goLSB", js.FuncOf(lsb))
	js.Global().Set("goDecodeLSB", js.FuncOf(decodeLsb))

	<-c
}
