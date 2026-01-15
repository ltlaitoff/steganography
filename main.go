//go:build js && wasm

package main

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"syscall/js"

	"golang.org/x/image/bmp"
)

func ParseImage(imageBytes []byte, contentType string) (image.Image, error) {
	switch contentType {
	case "image/png":
		img, err := png.Decode(bytes.NewReader(imageBytes))

		if err != nil {
			return nil, fmt.Errorf("Unable to decode png")
		}

		return img, nil

	case "image/jpeg":
		img, err := jpeg.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, fmt.Errorf("Unable to decode jpeg")
		}

		return img, nil

	case "image/bmp":
		img, err := bmp.Decode(bytes.NewReader(imageBytes))

		if err != nil {
			return nil, fmt.Errorf("Unable to decode bmp")
		}

		return img, nil
	}

	return nil, fmt.Errorf("Invalid image format")
}

func EncodeImage(image image.Image, contentType string) ([]byte, error) {
	buf := new(bytes.Buffer)

	if contentType == "image/jpeg" {
		contentType = "image/png"
	}

	switch contentType {
	case "image/png":
		if err := png.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("unable to encode png")
		}
	case "image/jpeg":
		if err := jpeg.Encode(buf, image, nil); err != nil {
			return nil, fmt.Errorf("Unable to encode jpeg")
		}
	case "image/bmp":
		if err := bmp.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("Unable to encode bmp")
		}
	}

	return buf.Bytes(), nil
}

func lsb(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run LSB")

	jsImageBytes := args[0]
	imageType := args[1].String()
	message := args[2].String()

	imageBuffer := make([]byte, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(imageBuffer, jsImageBytes)

	fmt.Printf("Go secret message: \"%s\"\n", message)

	containerImage, err := ParseImage(imageBuffer, imageType)
	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	fmt.Println("Container image:", containerImage)
	stegoImageRaw := encodeMessage(message, containerImage)
	fmt.Println("Stego image raw:", stegoImageRaw.Pix)

	stegoImage, err := EncodeImage(&stegoImageRaw, imageType)
	if err != nil {
		panic(fmt.Errorf("Something went wrong with encode image: %s", err))
	}
	fmt.Println("Stego image:", stegoImage)

	uint8Array := js.Global().Get("Uint8Array").New(len(stegoImage))
	js.CopyBytesToJS(uint8Array, stegoImage)

	return uint8Array
}

func decodeLsb(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run Decode LSB")

	jsImageBytes := args[0]
	imageType := args[1].String()
	messageLength := args[2].Int()

	imageBuffer := make([]byte, jsImageBytes.Get("byteLength").Int())
	js.CopyBytesToGo(imageBuffer, jsImageBytes)

	stegoImage, err := ParseImage(imageBuffer, imageType)
	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	fmt.Println("Stego image:", stegoImage)

	result := decodeMessage(stegoImage, messageLength)
	fmt.Println("Decoded message:", result)

	return result 
}

func main() {
	c := make(chan bool)

	js.Global().Set("goLSB", js.FuncOf(lsb))
	js.Global().Set("goDecodeLSB", js.FuncOf(decodeLsb))

	<-c
}
