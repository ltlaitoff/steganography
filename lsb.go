//go:build js && wasm

package main

import (
	"fmt"
	"image"
	"image/color"
	// "image/draw"
)

const DEBUG = true

func encodeMessage(message string, inputImage image.RGBA) image.RGBA {
	bounds := inputImage.Bounds()
	rgba := inputImage
	// draw.Draw(rgba, rgba.Bounds(), inputImage, bounds.Min, draw.Src)

	res := ""
	for _, r := range []byte(message) {
		res += fmt.Sprintf("%08b", r)
	}

	if len(res) > bounds.Size().X*bounds.Size().Y {
		panic("Image is small for this message")
	}

	x, y := bounds.Min.X, bounds.Min.Y + 20
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

		// if r&1 != one {
		// 	r ^= 1
		// }

		// if DEBUG {
		if one == 1 {
			r = 255
			g = 255
			b = 255
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

	return rgba
}

func decodeMessage(encodedImage image.RGBA, length int) string {
	bounds := encodedImage.Bounds()
	rgba := encodedImage
	// rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	// draw.Draw(rgba, rgba.Bounds(), encodedImage, bounds.Min, draw.Src)

	data := make([]byte, 0)
	var newByte byte = 0

	i := 7

	for y := bounds.Min.Y + 20; y < bounds.Max.Y; y += 10 {
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

// func Run() {
// 	fmt.Println("Lb 3")
//
// 	// originalMessage := "Modern cryptography is heavily based on mathematical theory and computer science practice; cryptographic algorithms are designed around computational hardness assumptions, making such algorithms hard to break in actual practice by any adversary. While it is theoretically possible to break into a well-designed system, it is infeasible in actual practice to do so. Such schemes, if well designed, are therefore termed \"computationally secure\". Theoretical advances (e.g., improvements in integer factorization algorithms) and faster computing technology require these designs to be continually reevaluated and, if necessary, adapted. Information-theoretically secure schemes that provably cannot be broken even with unlimited computing power, such as the one-time pad, are much more difficult to use in practice than the best theoretically breakable but computationally secure schemes."
// 	originalMessage := "Щедровський Іван Андрійович"
//
// 	fmt.Println("Message:", originalMessage)
// 	fmt.Println()
//
// 	fmt.Println("Read original image")
// 	originalImage := readImage("./lb3/input-cat.bmp")
//
// 	fmt.Println("Create encoced image")
// 	encodedImage := encodeMessage(originalMessage, originalImage)
//
// 	fmt.Println("Save encoded image")
// 	writeImage("./lb3/output-cat.bmp", encodedImage)
//
// 	fmt.Println("Read text from encoded image")
// 	decodedMessage := decodeMessage(encodedImage, len(originalMessage))
//
// 	fmt.Println()
// 	fmt.Println("Decoded:", decodedMessage)
//
// 	fmt.Println()
// 	fmt.Println("Is original == decoded?", originalMessage == decodedMessage)
// }
