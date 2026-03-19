package bpcs

import (
	"fmt"
	"image"

	"github.com/ltlaitoff/steganography/pkg/assert"
)

const (
	MaxChanges = 112
	Treshold   = 0.35
)

// NOTE: Gray code is better than Binary for BPCS
// SOURCE: https://datahide.org/BPCSe/principle-e.html

// SOURCE: https://en.wikipedia.org/wiki/Gray_code#Converting_to_and_from_Gray_code
func binaryToGray(n uint8) uint8 {
	return n ^ (n >> 1)
}

// SOURCE: https://en.wikipedia.org/wiki/Gray_code#Converting_to_and_from_Gray_code
func grayToBinary(num uint8) uint8 {
	mask := num

	for mask != 0 {
		mask >>= 1
		num ^= mask
	}

	return num
}

// goodComplexity checks if block noisy enough
func goodComplexity(block [8][8]uint8) bool {
	noiseValue := 0

	for y := range 8 {
		for x := range 8 {
			if x < 7 && block[y][x] != block[y][x+1] {
				noiseValue++
			}

			if y < 7 && block[y][x] != block[y+1][x] {
				noiseValue++
			}
		}
	}

	return float64(noiseValue)/float64(MaxChanges) > Treshold
}

// conjugate hides informative by adding revertable noise
// Should be caled again to undo changes
// BASED ON:
// "Principle and applications of BPCS-Steganography"
// Eiji Kawaguchi and Richard O. Eason
func conjugate(block *[8][8]uint8) {
	for y := range 8 {
		for x := range 8 {
			if (y+x)%2 != 0 {
				block[y][x] ^= 1
			}
		}
	}
}

// secretToBlocks generates blocks with good complexity from secret data
func secretToBlocks(secretData []byte) [][8][8]uint8 {
	totalBits := len(secretData) * 8

	totalBlocks := totalBits / 63
	if totalBits-63*totalBlocks > 0 {
		totalBlocks++
	}

	blocks := make([][8][8]uint8, totalBlocks)
	bitIndex := 0

	for blockIndex := range len(blocks) {
		block := [8][8]uint8{}
		block[0][0] = 0

		for i := 1; i < 64; i++ {
			if bitIndex >= totalBits {
				break
			}

			shift := uint8(7 - bitIndex%8)
			block[i/8][i%8] = (secretData[bitIndex/8] >> shift) & 1
			bitIndex++
		}

		if !goodComplexity(block) {
			conjugate(&block)
			block[0][0] = 1
		}

		blocks[blockIndex] = block
	}

	return blocks
}

// parseBlock gets one 8x8 Gray block from image 
func parseBlock(img *image.RGBA, shift uint8, x int, y int) ([8][8]uint8, bool) {
	data := [8][8]uint8{}

	for by := range 8 {
		for bx := range 8 {
			color := img.RGBAAt(x+bx, y+by)
			data[by][bx] = (binaryToGray(color.R) >> shift) & 1
		}
	}

	return data, goodComplexity(data)
}

type Position struct {
	X int
	Y int
}

// getEncodeBlocks parses blocks positions in which information will be encoded
func getEncodeBlocks(img *image.RGBA, shift uint8, maxBlocks int) []Position {
	blocks := make([]Position, 0)
	if maxBlocks == 0 {
		return blocks
	}

	bounds := img.Bounds()
	for y := bounds.Min.Y; y <= bounds.Max.Y-8; y += 8 {
		for x := bounds.Min.X; x <= bounds.Max.X-8; x += 8 {
			_, ok := parseBlock(img, shift, x, y)
			if !ok {
				continue
			}

			blocks = append(blocks, Position{Y: y, X: x})
			if len(blocks) >= maxBlocks {
				return blocks
			}
		}
	}

	return blocks
}

// getDecodeBlocks parses an all complex enough blocks up to the limit
func getDecodeBlocks(img *image.RGBA, shift uint8, maxBlocks int) [][8][8]uint8 {
	blocks := make([][8][8]uint8, 0)
	if maxBlocks == 0 {
		return blocks
	}

	bounds := img.Bounds()
	for y := bounds.Min.Y; y <= bounds.Max.Y-8; y += 8 {
		for x := bounds.Min.X; x <= bounds.Max.X-8; x += 8 {
			data, ok := parseBlock(img, shift, x, y)
			if !ok {
				continue
			}

			blocks = append(blocks, data)
			if len(blocks) >= maxBlocks {
				return blocks
			}
		}
	}

	return blocks
}

// EncodeBPCS hides secretData in a image
func EncodeBPCS(img *image.RGBA, secretData []byte) error {
	secretBlocks := secretToBlocks(secretData)

	planeBlocks := [8][]Position{}
	secretBlocksCountToEncode := len(secretBlocks)

	for plane := range planeBlocks {
		blocks := getEncodeBlocks(img, uint8(plane), secretBlocksCountToEncode)
		planeBlocks[plane] = blocks
		secretBlocksCountToEncode -= len(blocks)
	}

	if secretBlocksCountToEncode > 0 {
			return fmt.Errorf("Insufficient capacity: need %d more blocks in image!", secretBlocksCountToEncode)
	}

	for plane, blocks := range planeBlocks {
		assert.Assert(len(blocks) <= len(secretBlocks), "We should less or equal image blocks to secret blocks")

		for _, blockPos := range blocks {
			secretBlock := secretBlocks[0]
			secretBlocks = secretBlocks[1:]

			for by := range 8 {
				for bx := range 8 {
					color := img.RGBAAt(blockPos.X+bx, blockPos.Y+by)
					channel := binaryToGray(color.R)

					if secretBlock[by][bx] == 1 {
						channel |= (1 << plane)
					} else {
						channel &= ^(1 << plane)
					}

					color.R = grayToBinary(channel)
					img.SetRGBA(blockPos.X+bx, blockPos.Y+by, color)
				}
			}
		}
	}

	return nil
}

// DecodeBPCS parses hidden data from image
func DecodeBPCS(img *image.RGBA, expectedSize int) []byte {
	secretData := make([]byte, expectedSize)
	totalBits := expectedSize * 8
	bitIndex := 0

	for plane := range 8 {
		if bitIndex >= totalBits {
			return secretData
		}

		blocks := getDecodeBlocks(img, uint8(plane), (totalBits-bitIndex)/63+1)

		for _, block := range blocks {
			if block[0][0] == 1 {
				conjugate(&block)
				block[0][0] = 0
			}

			for i := 1; i < 64; i++ {
				if bitIndex >= totalBits {
					return secretData
				}

				value := block[i/8][i%8]
				shift := uint8(7 - (bitIndex % 8))

				if value == 1 {
					secretData[bitIndex/8] |= (1 << shift)
				}
				bitIndex++
			}
		}
	}

	return secretData
}
