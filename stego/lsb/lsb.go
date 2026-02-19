package lsb

import (
	"fmt"
	"image"
	"image/color"
)

// Channel represent one color of the image in RBG format
type Channel string

const (
	ChannelR Channel = "R"
	ChannelG Channel = "G"
	ChannelB Channel = "B"
)

// TODO: Description
type Key struct {
	// StartX set X in FROM which pixel (StartX, StartY) algorithm will work
	StartX int

	// StartY set Y in FROM which pixel (StartX, StartY) algorithm will work
	StartY int

	// EndX set X in to which pixel (EndX, EndY) algorithm will work
	EndX int

	// EndY set Y in to which pixel (EndX, EndY) algorithm will work
	EndY int

	// GapX set vertical(on X axis) distance beetween pixels
	GapX int

	// GapX set horizontal(on Y axis) distance beetween pixels
	GapY int

	// ChannelsPerPixel set how many Channels should be used to encode one pixel
	// This value should be smaller or equal to number of Channels
	ChannelsPerPixel int

	// Channels set which channels will be used to encode data
	Channels []Channel
}

// Options represent additional settings for LSB encoding and decoding
type Options struct {
	// VisualDebug, if enabled, then encoding will produce visible to eye result
	// Used to check what pixels are affected in result of algorithm
	VisualDebug bool

	// Key is a additional flexible settings of LSB algorithm
	Key Key
}

// TODO: Add some flag to disable if text will fit?
// Q: What if user will set EndX to 0?
// Should I dissallow that?
// It will be safer to set it to the -1 and check on -1.. But

// lsbBoundaries calculate field in which LSB will work
func lsbBoundaries(bounds image.Rectangle, key Key) (int, int, int, int) {
	startX, startY := max(key.StartX, bounds.Min.X), max(key.StartY, bounds.Min.Y)
	endX, endY := bounds.Max.X, bounds.Max.Y

	if key.EndX != 0 {
		endX = min(key.EndX, bounds.Max.X)
	}

	if key.EndY != 0 {
		endY = min(key.EndY, bounds.Max.Y)
	}

	return startX, startY, endX, endY
}

// calculateImageCapacity returns how many bits of information can be stored
// in image by LSB algorithm
// TEST: Add tests to this function
func calculateImageCapacity(startX, startY, endX, endY int, bounds image.Rectangle, key Key) int {
	pixelsCount := 0
	rowCount := (endY - startY + key.GapY) / (key.GapY + 1)

	if rowCount <= 1 {
		// Q: Should I add + key.GapX?
		pixelsCount = (endX - startX) / (key.GapX + 1)

		return pixelsCount * key.ChannelsPerPixel
	}

	firstRow := (bounds.Max.X - startX + key.GapX) / (key.GapX + 1)
	middleRows := (bounds.Max.X - bounds.Min.X + key.GapX) / (key.GapX + 1) * (rowCount - 2)
	endRow := (endX - bounds.Min.X + key.GapX) / (key.GapX + 1)

	return (firstRow + middleRows + endRow) * key.ChannelsPerPixel
}

// visualDebug calculate RGB values for specific pixel to allow visible to eye
// troubleshoot of internal algorithm
func visualDebug(r, g, b, one uint8, key Key, currentChannel Channel) (uint8, uint8, uint8) {
	if key.ChannelsPerPixel == 1 {
		return 0, 0, 0
	}

	channelsMap := map[Channel]bool{}
	for _, value := range key.Channels {
		channelsMap[value] = true
	}

	rgb := map[Channel]uint8{
		ChannelR: r,
		ChannelG: g,
		ChannelB: b,
	}

	for key := range channelsMap {
		if _, ok := channelsMap[key]; !ok {
			rgb[key] = 0
		}
	}

	if _, ok := rgb[currentChannel]; ok {
		rgb[currentChannel] = 0

		if one == 1 {
			rgb[currentChannel] = 255
		}
	}

	return rgb[ChannelR], rgb[ChannelG], rgb[ChannelB]
}

// CheckKeyValid inspect the key on any kind of errors
func CheckKeyValid(key Key) error {
	if len(key.Channels) < key.ChannelsPerPixel {
		return fmt.Errorf("LSB key should have more or equal Channels in"+
			" total than used per pixel! Right now Channels"+
			" number is %d and ChannelsPerPixel is %d",
			len(key.Channels), key.ChannelsPerPixel,
		)
	}

	return nil
}

// TODO: Description?
// PERF: Encoding are too slow with big images w/ big secret messages
func Encode(img *image.RGBA, message []byte, options Options) (*image.RGBA, error) {
	bounds := img.Bounds()
	key := options.Key
	x, y, endX, endY := lsbBoundaries(bounds, key)

	if err := CheckKeyValid(key); err != nil {
		return nil, err
	}

	totalBits := len(message) * 8
	capacityBits := calculateImageCapacity(x, y, endX, endY, bounds, key)

	if totalBits > capacityBits {
		return nil, fmt.Errorf("Insufficient capacity: need %d bits, have %d", totalBits, capacityBits)
	}

	counter := 0
	channelCounter := 0

	for bitIndex := range totalBits {
		byteIndex := bitIndex / 8
		shift := uint8(7 - bitIndex%8)
		bit := (message[byteIndex] >> shift) & 1

		cr, cg, cb, ca := img.At(x, y).RGBA()
		r, g, b, a := uint8(cr>>8), uint8(cg>>8), uint8(cb>>8), uint8(ca>>8)

		currentChannel := key.Channels[channelCounter]

		if currentChannel == ChannelR && r&1 != bit {
			r ^= 1
		}

		if currentChannel == ChannelG && g&1 != bit {
			g ^= 1
		}

		if currentChannel == ChannelB && b&1 != bit {
			b ^= 1
		}

		if options.VisualDebug {
			r, g, b = visualDebug(r, g, b, bit, key, currentChannel)
		}

		img.Set(x, y, color.RGBA{r, g, b, a})

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

	return img, nil
}

// TODO: Description
func Decode(img *image.RGBA, options Options, expectedLength int) ([]byte, error) {
	totalBits := expectedLength * 8

	bounds := img.Bounds()
	key := options.Key
	startX, startY, endX, endY := lsbBoundaries(bounds, key)

	if err := CheckKeyValid(key); err != nil {
		return nil, err
	}

	secret := make([]byte, expectedLength)
	bitIndex := 0

	channelCounter := 0

	for y := startY; y < endY; y += 1 + key.GapY {
		x := startX

		if y != startY {
			x = bounds.Min.X
		}

		for ; x < bounds.Max.X; x += 1 + key.GapX {
			cr, cg, cb, _ := img.At(x, y).RGBA()
			r := uint8(cr >> 8)
			g := uint8(cg >> 8)
			b := uint8(cb >> 8)

			for range key.ChannelsPerPixel {
				if bitIndex >= totalBits {
					return secret, nil
				}

				currentChannel := key.Channels[channelCounter]

				if (currentChannel == ChannelR && r&1 == 1) ||
					(currentChannel == ChannelG && g&1 == 1) ||
					(currentChannel == ChannelB && b&1 == 1) {
					byteIndex := bitIndex / 8
					shift := uint8(7 - bitIndex%8)

					secret[byteIndex] |= 1 << shift
				}

				bitIndex++
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

	return secret, nil
}
