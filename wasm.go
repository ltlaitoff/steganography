//go:build js && wasm

package main

import (
	"fmt"
	"syscall/js"

	"github.com/ltlaitoff/steganography/stego"
)

func encodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	imageType := args[1].String()
	message := JSToGoBytes(args[2])
	containerImage := JSToGoBytes(args[0])
	key := args[3].String()

	encodedImage, err := stego.EncodeLSB(containerImage, imageType, message, key)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(encodedImage),
	})
}

func decodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run Decode LSB")

	image := JSToGoBytes(args[0])
	imageType := args[1].String()
	key := args[2].String()

	result, err := stego.DecodeLSB(image, imageType, key)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": result,
	})
}

func encodeBpcsWrapper(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run BPCS Encode")

	imageType := args[1].String()
	message := JSToGoBytes(args[2])
	containerImage := JSToGoBytes(args[0])

	encodedImage, err := stego.EncodeBPCS(containerImage, imageType, message)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(encodedImage),
	})
}

func decodeBpcsWrapper(this js.Value, args []js.Value) interface{} {
	fmt.Println("[GO]: Run Decode LSB")

	image := JSToGoBytes(args[0])
	imageType := args[1].String()

	result, err := stego.DecodeBPCS(image, imageType)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": result,
	})
}

func debug(this js.Value, args []js.Value) interface{} {
	debugMode := args[0].Bool()
	stego.SetDebugMode(debugMode)

	return nil
}

func parseLSBKey(this js.Value, args []js.Value) interface{} {
	key := args[0].String()

	result, err := stego.ParseLsbKey(key)

	fmt.Println("Parsed!", result)

	if err != nil {
		return JsError(err.Error())
	}

	// Cast for js.ValueOf
	channels := make([]any, len(result.Channels))
	for i := range channels {
		channels[i] = result.Channels[i]
	}

	return js.ValueOf(map[string]any{
		"ok": true,
		"data": map[string]any{
			"StartX":           result.StartX,
			"StartY":           result.StartY,
			"EndX":             result.EndX,
			"EndY":             result.EndY,
			"GapX":             result.GapX,
			"GapY":             result.GapY,
			"ChannelsPerPixel": result.ChannelsPerPixel,
			"Channels":         js.ValueOf(channels),
		},
	})
}

func main() {
	c := make(chan bool)

	js.Global().Set("goEncodeLSB", js.FuncOf(encodeLsbWrapper))
	js.Global().Set("goDecodeLSB", js.FuncOf(decodeLsbWrapper))
	js.Global().Set("goParseLSBKey", js.FuncOf(parseLSBKey))

	js.Global().Set("goEncodeBPCS", js.FuncOf(encodeBpcsWrapper))
	js.Global().Set("goDecodeBPCS", js.FuncOf(decodeBpcsWrapper))

	js.Global().Set("goDebug", js.FuncOf(debug))

	<-c
}
