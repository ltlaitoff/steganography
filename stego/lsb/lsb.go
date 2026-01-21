package lsb

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
)

type Key struct {
	StartX           int
	StartY           int
	EndX             int
	EndY             int
	GapX             int
	GapY             int
	ChannelsPerPixel int
	Channels         []string
}

type Options struct {
	// If enabled encoding will produce visible to eye result
	// Use to check what pixels are affected in result of algorithm
	VisualDebug bool

	// Key with LSB settings
	Key Key
}

func visualDebug(active bool) (uint8, uint8, uint8) {
	if active == false {
		return 0, 0, 0
	}

	return 255, 0, 0
}

func Encode(containerImage image.Image, message []byte, options Options) image.RGBA {
	bounds := containerImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), containerImage, bounds.Min, draw.Src)

	key := options.Key

	res := ""
	for _, r := range message {
		res += fmt.Sprintf("%08b", r)
	}

	if len(res) > bounds.Size().X*bounds.Size().Y {
		panic("Image is small for this message")
	}

	x, y := key.StartX, key.StartY

	if key.StartX < bounds.Min.X {
		x = bounds.Min.X
	}

	if key.StartY < bounds.Min.Y {
		y = bounds.Min.Y
	}

	endX, endY := key.EndX, key.EndY

	if key.EndX == 0 || key.EndX > bounds.Max.X {
		endX = bounds.Max.X
	}

	if key.EndY == 0 || key.EndY > bounds.Max.Y {
		endY = bounds.Max.Y
	}

	counter := 0
	channelCounter := 0

	channelsMap := map[string]bool{}

	for _, value := range key.Channels {
		channelsMap[value] = true
	}

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

		currentChannel := key.Channels[channelCounter]

		if currentChannel == "R" && r&1 != one {
			r ^= 1
		}

		if currentChannel == "G" && g&1 != one {
			g ^= 1
		}

		if currentChannel == "B" && b&1 != one {
			b ^= 1
		}

		if options.VisualDebug {
			if key.ChannelsPerPixel == 1 {
				r, g, b = 0, 0, 0
			} else {
				if _, ok := channelsMap["R"]; !ok {
					r = 0
				}

				if _, ok := channelsMap["G"]; !ok {
					g = 0
				}

				if _, ok := channelsMap["B"]; !ok {
					b = 0
				}
			}

			if one == 1 {
				if currentChannel == "R" {
					r = 255
				}
				if currentChannel == "G" {
					g = 255
				}
				if currentChannel == "B" {
					b = 255
				}
			}

			if one == 0 {
				if currentChannel == "R" {
					r = 0
				}
				if currentChannel == "G" {
					g = 0
				}
				if currentChannel == "B" {
					b = 0
				}
			}
		}

		rgba.Set(x, y, color.RGBA{r, g, b, a})

		counter++
		channelCounter++

		if channelCounter >= len(key.Channels) {
			channelCounter = 0
		}

		if counter == key.ChannelsPerPixel {
			counter = 0
			x += 1 + key.GapX

			isXEnd := x >= bounds.Max.X

			if y+key.GapY >= endY {
				isXEnd = x >= endX
			}

			if isXEnd {
				y += 1 + key.GapY

				if y >= endY {
					break
				}

				x = bounds.Min.X
			}
		}
	}

	return *rgba
}

func Decode(encodedImage image.Image, options Options) string {
	bounds := encodedImage.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), encodedImage, bounds.Min, draw.Src)

	data := make([]byte, 0)
	var newByte byte = 0

	key := options.Key
	i := 7

	addByteToData := func() {
		fmt.Println("debug add byte to data", i)
		i--
		if i < 0 {
			fmt.Println("Add byte to data: ", newByte)
			data = append(data, newByte)
			i = 7
			newByte = 0
		}
	}

	startX, startY := key.StartX, key.StartY

	if key.StartX < bounds.Min.X {
		startX = bounds.Min.X
	}

	if key.StartY < bounds.Min.Y {
		startY = bounds.Min.Y
	}

	endX, endY := key.EndX, key.EndY

	if key.EndX == 0 || key.EndX > bounds.Max.X {
		endX = bounds.Max.X
	}

	if key.EndY == 0 || key.EndY > bounds.Max.Y {
		endY = bounds.Max.Y
	}

	channelCounter := 0

	for y := startY; y < endY; y += 1 + key.GapY {
		x := startX

		if y != startY {
			x = bounds.Min.X
		}

		for ; x < bounds.Max.X; x += 1 + key.GapX {
			cr, cg, cb, _ := rgba.At(x, y).RGBA()
			r := uint8(cr >> 8)
			g := uint8(cg >> 8)
			b := uint8(cb >> 8)

			fmt.Println("Check pixel (", x, ", ", y, ")!")
			for range key.ChannelsPerPixel {

				currentChannel := key.Channels[channelCounter]

				if currentChannel == "R" {
					if r&1 == 1 {
						newByte = newByte | (1 << i)
					}

					addByteToData()
				}

				if currentChannel == "G" {
					if g&1 == 1 {
						newByte = newByte | (1 << i)
					}

					addByteToData()
				}

				if currentChannel == "B" {
					if b&1 == 1 {
						newByte = newByte | (1 << i)
					}

					addByteToData()
				}

				channelCounter++
				if channelCounter >= len(key.Channels) {
					channelCounter = 0
				}
			}

			if y+key.GapY >= endY && x >= endX {
				break
			}
		}
	}

	fmt.Println(data)

	return string(data)
}
