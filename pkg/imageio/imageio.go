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

// TODO: Description
func ParseImage(imageBytes []byte) (image.Image, string, error) {
	img, imageType, err := image.Decode(bytes.NewReader(imageBytes))

	if err != nil {
		return nil, "", fmt.Errorf("Invalid image format")
	}

	return img, imageType, nil
}

// TODO: Description
func EncodeImage(image image.Image, imageType string) ([]byte, error) {
	fmt.Println("Encode image was called with type", imageType)
	assert.Assert(imageType != "", "Image type should have value on image encoding")

	buf := new(bytes.Buffer)

	switch imageType {
	case "png":
		if err := png.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("unable to encode png")
		}
	case "jpeg":
		if err := jpeg.Encode(buf, image, nil); err != nil {
			return nil, fmt.Errorf("Unable to encode jpeg")
		}
	case "bmp":
		if err := bmp.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("Unable to encode bmp")
		}
	}

	return buf.Bytes(), nil
}
