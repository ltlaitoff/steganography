//go:build js && wasm

package main

import (
	// "bytes"
	"fmt"
	"image"
	// "image/jpeg"
	// "image/png"
	// "net/http"
	"syscall/js"
)

// type State struct {
// 	image *image.RGBA
// }
//
// var state State = State{}

// func ToPng(imageBytes []byte) ([]byte, error) {
// 	contentType := http.DetectContentType(imageBytes)
//
// 	switch contentType {
// 	case "image/png":
// 	case "image/jpeg":
// 		img, err := jpeg.Decode(bytes.NewReader(imageBytes))
// 		if err != nil {
// 			return nil, fmt.Errorf("unable to decode jpeg")
// 		}
//
// 		buf := new(bytes.Buffer)
// 		if err := png.Encode(buf, img); err != nil {
// 			return nil, fmt.Errorf("unable to encode png")
// 		}
//
// 		return buf.Bytes(), nil
// 	}
//
// 	return nil, fmt.Errorf("unable to convert %#v to png", contentType)
// }

type Options struct {
	message string `json:"message"`
}

func lsb(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run LSB")

	jsImageBytes := args[0]
	message := args[1].String()

	imageBuffer := make([]uint8, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(imageBuffer, jsImageBytes)

	// options := Options{}
	// err := json.Unmarshal([]byte(jsOptions), &options)
	// if err != nil {
	//   options = convert.DefaultOptions
	// }

	// messageBuffer := make([]uint8, jsImageBytes.Get("byteLength").Int())
	// js.CopyBytesToGo(imageBuffer, jsImageBytes)

	// pngImage, err := ToPng(imageBuffer)
	// if err != nil {
	// 	panic(err)
	// }

	fmt.Printf("Go: \"%s\"\n", message)

	containerImage := image.NewRGBA(image.Rect(0, 0, 640, 426))
	containerImage.Pix = imageBuffer 

	fmt.Println("A:", containerImage.Pix)
	stegoImage := encodeMessage(message, *containerImage)
	// stegoImage := *containerImage

	// if (err != nil) {
	// 	panic("Err in to png stego")
	// }

	fmt.Println("E:", stegoImage.Pix)

	fmt.Printf("Decoded text: \"%s\"\n", decodeMessage(stegoImage, len(message)))

	uint8Array := js.Global().Get("Uint8Array").New(len(stegoImage.Pix))
	js.CopyBytesToJS(uint8Array, stegoImage.Pix)

	return uint8Array
}

func main() {
	c := make(chan bool)

	// js.Global().Set("goSetImage", js.FuncOf(setImage))
	js.Global().Set("goLSB", js.FuncOf(lsb))

	<-c
}
