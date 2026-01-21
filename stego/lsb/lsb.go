package lsb

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
)

type Options struct {
	// If enabled encoding will produce visible to eye result
	// Use to check what pixels are affected in result of algorithm
	VisualDebug bool
}

func Encode(containerImage image.Image, message string, options Options) image.RGBA {
	bounds := containerImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), containerImage, bounds.Min, draw.Src)

	res := ""
	for _, r := range []byte(message) {
		res += fmt.Sprintf("%08b", r)
	}

	if len(res) > bounds.Size().X*bounds.Size().Y {
		panic("Image is small for this message")
	}

	x, y := bounds.Min.X, bounds.Min.Y
	for _, char := range res {
		one := uint8(0)
		if char == '1' {
			one = 1
		}

		cr, cg, cb, ca := rgba.At(x, y).RGBA()

		r := uint8(cr >> 8)
		g := uint8(cg >> 8)
		b := uint8(cb >> 8)
		a := uint8(ca >> 8)

		if r&1 != one {
			r ^= 1
		}

		if options.VisualDebug {
			if one == 1 {
				r = 255
				g = 0
				b = 0
			} else {
				r = 0
				g = 0
				b = 0
			}
		}

		rgba.Set(x, y, color.RGBA{r, g, b, a})

		x += 5

		if x >= bounds.Max.X {
			y += 10
			x = bounds.Min.X
		}
	}

	return *rgba
}

func Decode(encodedImage image.Image) string {
	bounds := encodedImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), encodedImage, bounds.Min, draw.Src)

	data := make([]byte, 0)
	var newByte byte = 0

	i := 7

	for y := bounds.Min.Y; y < bounds.Max.Y; y += 10 {
		for x := bounds.Min.X; x < bounds.Max.X; x += 5 {
			cr, _, _, _ := rgba.At(x, y).RGBA()
			r := uint8(cr >> 8)

			if r&1 == 1 {
				newByte = newByte | (1 << i)
			}

			i--
			if i < 0 {
				data = append(data, newByte)
				i = 7
				newByte = 0
			}
		}
	}

	return string(data)
}
