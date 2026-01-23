package stego

import (
	"fmt"
	"image"
	"image/draw"
	"reflect"
	"strconv"
	"unicode"

	"github.com/ltlaitoff/steganography/pkg/assert"
	"github.com/ltlaitoff/steganography/pkg/imageio"
	"github.com/ltlaitoff/steganography/stego/bpcs"
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

func parseLsbKey(key string) lsb.Key {
	parsingSchema := map[rune]string{
		'S': "StartX",
		'T': "StartY",
		'E': "EndX",
		'N': "EndY",
		'H': "GapX",
		'V': "GapY",
		'P': "ChannelsPerPixel",
		'C': "Channels",
	}

	result := &lsb.Key{}
	val := reflect.ValueOf(result).Elem()

	current := ""
	buffer := ""

	saveCurrent := func() {
		assert.Assert(current != "", "TODO 4")
		field := val.FieldByName(current)

		if !field.IsValid() {
			fmt.Println("Field is not valid", field, "current:", current)
			panic("TODO 0")
		}

		if current == "Channels" {
			assert.Assert(field.Kind() == reflect.Slice, "TODO 1")

			field.Set(reflect.Append(field, reflect.ValueOf(buffer)))
		} else {
			assert.Assert(field.Kind() == reflect.Int, "TODO 2")
			num, err := strconv.Atoi(buffer)

			if err != nil {
				panic("Error")
			}

			field.SetInt(int64(num))
		}

	}

	for _, char := range key {
		if unicode.IsLetter(char) {
			if property, ok := parsingSchema[char]; ok {
				newField := val.FieldByName(property)

				if newField.IsValid() {
					if current != "" {
						saveCurrent()
					}

					current = property
					buffer = ""
					continue
				} else {
					buffer += string(char)
				}
			} else {
				buffer += string(char)
			}
		} else {
			buffer += string(char)
		}
	}

	if current != "" {
		saveCurrent()
	}

	return *result
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

func EncodeLSB(imageBytes []byte, imageType string, message []byte, key string) []byte {
	fmt.Println("Debug mode:", state.debugMode)

	assert.Assert(imageType != "", "Image type should have value")

	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	lsbKey := parseLsbKey(key)
	fmt.Println("Key:", lsbKey)

	options := lsb.Options{
		VisualDebug: state.debugMode,
		Key:         lsbKey,
	}
	encodedImage := lsb.Encode(inputImage, message, options)

	encodedBytes, err := imageio.EncodeImage(&encodedImage, getResultImageType(imageType))

	if err != nil {
		panic(fmt.Errorf("Something went wrong with encode image: %s", err))
	}

	return encodedBytes
}

func DecodeLSB(imageBytes []byte, imageType string, key string) string {
	assert.Assert(imageType != "", "Image type should have value")
	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	lsbKey := parseLsbKey(key)
	fmt.Println("Key:", lsbKey)

	options := lsb.Options{
		VisualDebug: state.debugMode,
		Key:         lsbKey,
	}
	result := lsb.Decode(inputImage, options)

	return result
}

func EncodeBPCS(imageBytes []byte, imageType string, message []byte) []byte {
	assert.Assert(imageType != "", "Image type should have value")

	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	bounds := inputImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), inputImage, bounds.Min, draw.Src)
	bpcs.EncodeBPCS(rgba, message)

	encodedBytes, err := imageio.EncodeImage(rgba, getResultImageType(imageType))

	if err != nil {
		panic(fmt.Errorf("Something went wrong with encode image: %s", err))
	}

	return encodedBytes
}

func DecodeBPCS(imageBytes []byte, imageType string) string {
	assert.Assert(imageType != "", "Image type should have value")
	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		panic(fmt.Errorf("Something went wrong with parse image: %s", err))
	}

	bounds := inputImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), inputImage, bounds.Min, draw.Src)
	result := bpcs.DecodeBPCS(rgba, 100)

	return string(result)
}
