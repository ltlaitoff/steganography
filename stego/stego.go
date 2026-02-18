package stego

import (
	"encoding/binary"
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

// TODO: Description
type State struct {
	// TODO: Description
	debugMode bool
}

// TODO: Description
var state State = State{
	debugMode: false,
}

// TODO: Description
func SetDebugMode(debugMode bool) {
	state.debugMode = debugMode
}

// imageToRGBA is helper for convertation image.Image to image.RGBA
func imageToRGBA(src image.Image) *image.RGBA {
	if dst, ok := src.(*image.RGBA); ok {
		return dst
	}

	bounds := src.Bounds()
	dst := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(dst, dst.Bounds(), src, bounds.Min, draw.Src)

	return dst
}

// TODO: Description
func ParseLsbKey(key string) (*lsb.Key, error) {
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

	saveCurrent := func() error {
		assert.Assert(current != "", "TODO 4")
		field := val.FieldByName(current)

		// DEV: Fix
		assert.Assert(field.IsValid(), fmt.Errorf("Field is not valid", field, "current:", current).Error())

		// DEV: It's just shit
		if current == "Channels" {
			assert.Assert(field.Kind() == reflect.Slice, "Channels key field should be slice!")

			field.Set(reflect.Append(field, reflect.ValueOf(buffer)))
		} else {
			assert.Assert(field.Kind() == reflect.Int, "Other fields without Channels should be int!")
			num, err := strconv.Atoi(buffer)

			if err != nil {
				return err
			}

			field.SetInt(int64(num))
		}

		return nil
	}

	// DEV: Was?
	for _, char := range key {
		if unicode.IsLetter(char) {
			if property, ok := parsingSchema[char]; ok {
				newField := val.FieldByName(property)

				if newField.IsValid() {
					if current != "" {
						err := saveCurrent()

						if err != nil {
							return nil, err
						}
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

	return result, nil
}

// DEV: Add description WHY it works like that
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

// TODO: Description and rename?
func appendSecretLengthToSecret(message []byte) []byte {
	secretLength := make([]byte, 4)
	binary.LittleEndian.PutUint32(secretLength, uint32(len(message)))

	return append(secretLength, message...)
}

// TODO: Description
func EncodeLSB(imageBytes []byte, imageType string, message []byte, key string) ([]byte, error) {
	assert.Assert(imageType != "", "Image type should have value")

	inputImage, err := imageio.ParseImage(imageBytes, imageType)
	if err != nil {
		return nil, err
	}

	img := imageToRGBA(inputImage)

	lsbKey, err := ParseLsbKey(key)
	if err != nil {
		return nil, err
	}

	options := lsb.Options{
		VisualDebug: state.debugMode,
		Key:         *lsbKey,
	}

	encodedImage, err := lsb.Encode(img, appendSecretLengthToSecret(message), options)
	if err != nil {
		return nil, err
	}

	encodedBytes, err := imageio.EncodeImage(encodedImage, getResultImageType(imageType))
	if err != nil {
		return nil, err
	}

	return encodedBytes, nil
}

// TODO: Description
func DecodeLSB(imageBytes []byte, imageType string, key string) (string, error) {
	assert.Assert(imageType != "", "Image type should have value")
	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		return "", err
	}

	img := imageToRGBA(inputImage)

	lsbKey, err := ParseLsbKey(key)

	if err != nil {
		return "", err
	}

	options := lsb.Options{
		VisualDebug: state.debugMode,
		Key:         *lsbKey,
	}

	secretLengthString, err := lsb.Decode(img, options, 4)

	if err != nil {
		return "", err
	}

	secretLength := binary.LittleEndian.Uint32(secretLengthString)

	result, err := lsb.Decode(img, options, int(4+secretLength))

	if err != nil {
		return "", err
	}

	return string(result[4:]), nil
}

// TODO: Description
func EncodeBPCS(imageBytes []byte, imageType string, message []byte) ([]byte, error) {
	assert.Assert(imageType != "", "Image type should have value")

	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		return nil, err
	}

	img := imageToRGBA(inputImage)

	err = bpcs.EncodeBPCS(img, appendSecretLengthToSecret(message))

	if err != nil {
		return nil, err
	}

	encodedBytes, err := imageio.EncodeImage(img, getResultImageType(imageType))

	if err != nil {
		return nil, err
	}

	return encodedBytes, nil
}

// TODO: Description
func DecodeBPCS(imageBytes []byte, imageType string) (string, error) {
	assert.Assert(imageType != "", "Image type should have value")
	inputImage, err := imageio.ParseImage(imageBytes, imageType)

	if err != nil {
		return "", err
	}

	img := imageToRGBA(inputImage)

	secretLengthString := bpcs.DecodeBPCS(img, 4)
	secretLength := binary.LittleEndian.Uint32(secretLengthString)

	result := bpcs.DecodeBPCS(img, int(4+secretLength))

	return string(result[4:]), nil
}
