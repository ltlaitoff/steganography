//go:build js && wasm

package main

import (
	"fmt"
	"syscall/js"

	"github.com/ltlaitoff/steganography/stego"
)

func encodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run LSB")

	imageType := args[1].String()
	message := args[2].String()
	containerImage := JSToGoBytes(args[0])

	encodedImage := stego.EncodeLSB(containerImage, imageType, message)

	return GoToJsBytes(encodedImage)
}

func decodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run Decode LSB")

	imageType := args[1].String()
	messageLength := args[2].Int()
	image := JSToGoBytes(args[0])

	return stego.DecodeLSB(image, imageType, messageLength)
}

func main() {
	c := make(chan bool)

	js.Global().Set("goLSB", js.FuncOf(encodeLsbWrapper))
	js.Global().Set("goDecodeLSB", js.FuncOf(decodeLsbWrapper))

	<-c
}
