//go:build js && wasm

package main

import (
	"fmt"
	"image"
	"syscall/js"
)

func ParseImageFromJS(imgBytes js.Value, imageType string) image.Image {
	imageBuffer := make([]byte, imgBytes.Get("byteLength").Int())
	js.CopyBytesToGo(imageBuffer, imgBytes)

	image, err := ParseImage(imageBuffer, imageType)
	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	return image
}

func ImageToJSBytes(image image.Image, imageType string) js.Value {
	imageBytes, err := EncodeImage(image, imageType)
	if err != nil {
		panic(fmt.Errorf("Something went wrong with encode image: %s", err))
	}

	uint8Array := js.Global().Get("Uint8Array").New(len(imageBytes))
	js.CopyBytesToJS(uint8Array, imageBytes)

	return uint8Array
}
