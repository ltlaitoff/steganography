package imageio

import (
	"bytes"
	"fmt"
	"image"
	"image/draw"
	_ "image/jpeg"
	"image/png"

	"github.com/ltlaitoff/steganography/pkg/assert"
	"golang.org/x/image/bmp"
)

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

// Parse decodes image information from bytes array to RGBA image format
func Parse(imageBytes []byte) (*image.RGBA, string, error) {
	img, imageType, err := image.Decode(bytes.NewReader(imageBytes))

	if err != nil {
		return nil, "", fmt.Errorf("Invalid image format")
	}

	return imageToRGBA(img), imageType, nil
}

// getLosslessType checks if we can write information in given image type
// without losing any information
// If not then returns default format PNG
func getLosslessType(imageType string) string {
	if imageType == "png" {
		return "png"
	}

	if imageType == "bmp" {
		return "bmp"
	}

	return "png"
}

// EncodeLossless encodes Image to []byte by using the lossless image type
// If originalImageType is not lossless, then PNG will be used 
func EncodeLossless(image image.Image, originalImageType string) ([]byte, error) {
	imageType := getLosslessType(originalImageType)
	assert.Assert(imageType != "", "Image type should have value on image encoding")

	buf := new(bytes.Buffer)

	switch imageType {
	case "png":
		if err := png.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("unable to encode png")
		}
	case "bmp":
		if err := bmp.Encode(buf, image); err != nil {
			return nil, fmt.Errorf("Unable to encode bmp")
		}
	}

	return buf.Bytes(), nil
}
