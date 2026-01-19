package imageio 

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"

	"github.com/ltlaitoff/steganography/pkg/assert"
	"golang.org/x/image/bmp"
)

func ParseImage(imageBytes []byte, imageTyp string) (image.Image, error) {
	assert.Assert(imageTyp != "", "Image type should have value")

	switch imageTyp {
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

func EncodeImage(image image.Image, imageType string) ([]byte, error) {
	assert.Assert(imageType != "", "Image type should have value")
	
	buf := new(bytes.Buffer)

	switch imageType {
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
