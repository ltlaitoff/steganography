//go:build js && wasm

package main

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
)

const DEBUG = true

func encodeMessage(message string, inputImage image.Image) image.RGBA {
	fmt.Println("Start encoding")

	bounds := inputImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), inputImage, bounds.Min, draw.Src)

	res := ""
	for _, r := range []byte(message) {
		res += fmt.Sprintf("%08b", r)
	}

	if len(res) > bounds.Size().X*bounds.Size().Y {
		panic("Image is small for this message")
	}

	fmt.Println("Checks passed, res is splited into chars")

	x, y := bounds.Min.X, bounds.Min.Y
	for _, char := range res {
		fmt.Println("Iteration for", char, "with", x, y)
		one := uint8(0)
		if char == '1' {
			one = 1
		}

		cr, cg, cb, ca := rgba.At(x, y).RGBA()

		r := uint8(cr >> 8)
		g := uint8(cg >> 8)
		b := uint8(cb >> 8)
		a := uint8(ca >> 8)

		// if r&1 != one {
		// 	r ^= 1
		// }

		// if DEBUG {
		if one == 1 {
			r = 255
			g = 0
			b = 0
		} else {
			r = 0
			g = 0
			b = 0
		}
		// }

		rgba.Set(x, y, color.RGBA{r, g, b, a})

		x += 5

		if x >= bounds.Max.X {
			y += 10
			x = bounds.Min.X
		}
	}

	return *rgba
}

func decodeMessage(encodedImage image.Image, length int) string {
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

				if len(data) >= length {
					return string(data)
				}
			}
		}
	}

	return string(data)
}

