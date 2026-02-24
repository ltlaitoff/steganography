package stego

import (
	"encoding/binary"
	"fmt"
	"reflect"
	"strconv"
	"unicode"

	"github.com/ltlaitoff/steganography/pkg/assert"
	"github.com/ltlaitoff/steganography/pkg/imageio"
	"github.com/ltlaitoff/steganography/stego/bpcs"
	"github.com/ltlaitoff/steganography/stego/lsb"
)

// Parameters contain global algorithm settings and developer flags
type Parameters struct {
	// DebugMode, if enabled, shows additional program log's and visually to eye
	// shows what was changed in the original image after algorithm was applied
	// PERF: Might use additional resources
	DebugMode bool
}

var parameters Parameters = Parameters{
	DebugMode: false,
}

// SetDebugMode allows enable or disable a developer troubleshoot tool
// Check Parameters.DebugMode for more information
func SetDebugMode(debugMode bool) {
	parameters.DebugMode = debugMode
}

// ParseLsbKey transform "encoded" string representation of LSB key into
// actual struct with fields to future use in algorithm
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
		'I': "IgnoreCapacity",
	}

	result := &lsb.Key{}

	property := ""
	buffer := ""

	saveCurrent := func(property string) error {
		if property == "" {
			return nil
		}

		resultValue := reflect.ValueOf(result).Elem()

		field := resultValue.FieldByName(property)
		assert.Assert(field.IsValid(), fmt.Errorf("Field is not valid! Property: %s", property).Error())

		// NOTE: Channels is a unique structure in lsb key because it's an olny slice
		// We cannot change channels to int because then it will lose it's
		// flexibility. As example we can set GRB instead of RGB right now and it
		// will work as it should
		if property == "Channels" {
			assert.Assert(field.Kind() == reflect.Slice, "Channels key field should be slice!")
			if buffer != string(lsb.ChannelR) &&
				buffer != string(lsb.ChannelG) &&
				buffer != string(lsb.ChannelB) {
				return fmt.Errorf(
					"Only color channels('R', 'B', 'G') are allowed "+
						"as part of Channels LSB key! Value %s is not valid!",
					buffer,
				)
			}

			field.Set(reflect.Append(field, reflect.ValueOf(buffer)))
			return nil
		}

		if property == "IgnoreCapacity" {
			fmt.Println("[DEBUG] IgnoreCapacity", property, buffer, key)
			assert.Assert(field.Kind() == reflect.Bool, "IgnoreCapacity key field should be bool!")

			field.SetBool(buffer == "1")
			return nil
		}

		assert.Assert(field.Kind() == reflect.Int, "Other fields without Channels should be int!")

		num, err := strconv.Atoi(buffer)
		if err != nil {
			return err
		}

		field.SetInt(int64(num))
		return nil
	}

	for _, char := range key {
		if !unicode.IsLetter(char) {
			buffer += string(char)
			continue
		}

		nextProperty, ok := parsingSchema[char]
		if !ok {
			buffer += string(char)
			continue
		}

		if err := saveCurrent(property); err != nil {
			return nil, err
		}

		property = nextProperty
		buffer = ""
	}

	if err := saveCurrent(property); err != nil {
		return nil, err
	}

	if err := lsb.CheckKeyValid(*result); err != nil {
		return nil, err
	}

	return result, nil
}

// addSecretLength adds a length of the secret message to start
// of secret itself by adding 4 bytes
// Secret length used on data decoding
func addSecretLength(message []byte) []byte {
	secretLength := make([]byte, 4)
	binary.LittleEndian.PutUint32(secretLength, uint32(len(message)))

	return append(secretLength, message...)
}

// EncodeLSB inject a secret message into image-container by LSB algorithm
// Returns stego-image in lossless image type format
func EncodeLSB(imageBytes []byte, message []byte, key string) ([]byte, error) {
	img, imageType, err := imageio.Parse(imageBytes)
	if err != nil {
		return nil, err
	}

	lsbKey, err := ParseLsbKey(key)
	if err != nil {
		return nil, err
	}

	options := lsb.Options{
		VisualDebug: parameters.DebugMode,
		Key:         *lsbKey,
	}

	encodedImage, err := lsb.Encode(img, addSecretLength(message), options)
	if err != nil {
		return nil, err
	}

	encodedBytes, err := imageio.EncodeLossless(encodedImage, imageType)
	if err != nil {
		return nil, err
	}

	return encodedBytes, nil
}

// DecodeLSB inject the secret data from stego-image by LSB algorithm
// Returns secret data in raw format
func DecodeLSB(imageBytes []byte, key string) ([]byte, error) {
	img, _, err := imageio.Parse(imageBytes)
	if err != nil {
		return nil, err
	}

	lsbKey, err := ParseLsbKey(key)

	if err != nil {
		return nil, err
	}

	options := lsb.Options{
		VisualDebug: parameters.DebugMode,
		Key:         *lsbKey,
	}

	secretLengthString, err := lsb.Decode(img, options, 4)
	if err != nil {
		return nil, err
	}

	secretLength := binary.LittleEndian.Uint32(secretLengthString)

	result, err := lsb.Decode(img, options, int(4+secretLength))
	if err != nil {
		return nil, err
	}

	return result[4:], nil
}

// EncodeBPCS encodes a secret message into image-container by BPCS algorithm
// Returns stego-image in lossless image type format
func EncodeBPCS(imageBytes []byte, message []byte) ([]byte, error) {
	img, imageType, err := imageio.Parse(imageBytes)
	if err != nil {
		return nil, err
	}

	err = bpcs.EncodeBPCS(img, addSecretLength(message))
	if err != nil {
		return nil, err
	}

	encodedBytes, err := imageio.EncodeLossless(img, imageType)
	if err != nil {
		return nil, err
	}

	return encodedBytes, nil
}

// DecodeBPCS parses the secret data from stego-image by BPCS algorithm
// Returns secret data in raw format
func DecodeBPCS(imageBytes []byte) ([]byte, error) {
	img, _, err := imageio.Parse(imageBytes)
	if err != nil {
		return nil, err
	}

	secretLengthString := bpcs.DecodeBPCS(img, 4)
	secretLength := binary.LittleEndian.Uint32(secretLengthString)

	result := bpcs.DecodeBPCS(img, int(4+secretLength))

	return result[4:], nil
}
