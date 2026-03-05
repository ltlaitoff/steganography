//go:build js && wasm

package main

import (
	"log/slog"
	"syscall/js"

	"github.com/ltlaitoff/steganography/stego"
)

// DEV: It will be cool if debug mode actually enable all debug comments
// in console as well

func encodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	slog.Debug("Run encode LSB", "Args", args)
	containerImage := JSToGoBytes(args[0])
	message := JSToGoBytes(args[1])
	key := args[2].String()

	encodedImage, err := stego.EncodeLSB(containerImage, message, key)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(encodedImage),
	})
}

func decodeLsbWrapper(this js.Value, args []js.Value) interface{} {
	slog.Debug("Run Decode LSB", "Args", args)

	image := JSToGoBytes(args[0])
	key := args[1].String()

	result, err := stego.DecodeLSB(image, key)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(result),
	})
}

func encodeBpcsWrapper(this js.Value, args []js.Value) interface{} {
	slog.Debug("Run BPCS Encode", "Args", args)

	containerImage := JSToGoBytes(args[0])
	message := JSToGoBytes(args[1])

	encodedImage, err := stego.EncodeBPCS(containerImage, message)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(encodedImage),
	})
}

func decodeBpcsWrapper(this js.Value, args []js.Value) interface{} {
	slog.Debug("Run Decode LSB", "Args", args)

	image := JSToGoBytes(args[0])

	result, err := stego.DecodeBPCS(image)

	if err != nil {
		return JsError(err.Error())
	}

	return js.ValueOf(map[string]any{
		"ok":   true,
		"data": GoToJsBytes(result),
	})
}

func debug(this js.Value, args []js.Value) interface{} {
	slog.Debug("Call debug", "Args", args)

	debugMode := args[0].Bool()
	stego.SetDebugMode(debugMode)

	return nil
}

func parseLSBKey(this js.Value, args []js.Value) interface{} {
	key := args[0].String()

	result, err := stego.ParseLsbKey(key)

	slog.Debug("Called parse lsb key", "Key", result)

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
