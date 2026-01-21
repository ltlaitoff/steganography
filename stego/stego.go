package stego

import (
	"fmt"

	"github.com/ltlaitoff/steganography/pkg/assert"
	"github.com/ltlaitoff/steganography/pkg/imageio"
	"github.com/ltlaitoff/steganography/stego/lsb"
)

type State struct {
	debugMode bool
}

var state State = State{
	debugMode: false,
}

func SetDebugMode(debugMode bool) {
	state.debugMode = debugMode
}

// Default is png, for jpeg png too
func getResultImageType(imageType string) string {
	if imageType == "image/png" {
		return "image/png"
	}

	if imageType == "image/bmp" {
		return "image/bmp"
	}

	return "image/png"
}

// TODO:: Remove imageType?

func EncodeLSB(imageBytes []byte, imageType string, message string) []byte {
	fmt.Println("Debug mode:", state.debugMode)

	assert.Assert(imageType != "", "Image type should have value")

	image, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	options := lsb.Options{
		VisualDebug: state.debugMode,
	}
	encodedImage := lsb.Encode(image, message, options)

	encodedBytes, err := imageio.EncodeImage(&encodedImage, getResultImageType(imageType))

	if err != nil {
		panic(fmt.Errorf("Something went wrong with encode image: %s", err))
	}

	return encodedBytes
}

func DecodeLSB(imageBytes []byte, imageType string, messageLength int) string {
	assert.Assert(imageType != "", "Image type should have value")
	image, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	result := lsb.Decode(image, messageLength)

	return result
}
