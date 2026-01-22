package bpcs

import (
	"image"
)

const (
	BlockSize  = 8
	Threshold  = 0.3
	MaxChanges = 112
)

func BinaryToGray(n uint8) uint8 {
	return n ^ (n >> 1)
}

func GrayToBinary(g uint8) uint8 {
	var b uint8
	for ; g > 0; g >>= 1 {
		b ^= g
	}
	return b
}

func CalculateComplexity(block [8][8]uint8) float64 {
	changes := 0
	for y := 0; y < BlockSize; y++ {
		for x := 0; x < BlockSize; x++ {
			if x < BlockSize-1 && block[y][x] != block[y][x+1] {
				changes++
			}
			if y < BlockSize-1 && block[y][x] != block[y+1][x] {
				changes++
			}
		}
	}
	return float64(changes) / float64(MaxChanges)
}

func Conjugate(block *[8][8]uint8) {
	for y := 0; y < BlockSize; y++ {
		for x := 0; x < BlockSize; x++ {
			if (x+y)%2 != 0 {
				block[y][x] ^= 1
			}
		}
	}
}

func EncodeBPCS(img *image.RGBA, secretData []byte) {
	dataBitIndex := 0
	totalBits := len(secretData) * 8
	bounds := img.Bounds()

	for plane := 0; plane < 8; plane++ {
		for y := bounds.Min.Y; y <= bounds.Max.Y-BlockSize; y += BlockSize {
			for x := bounds.Min.X; x <= bounds.Max.X-BlockSize; x += BlockSize {
				if dataBitIndex >= totalBits {
					return
				}

				var block [8][8]uint8
				for by := 0; by < BlockSize; by++ {
					for bx := 0; bx < BlockSize; bx++ {
						pixel := img.RGBAAt(x+bx, y+by)

						block[by][bx] = (BinaryToGray(pixel.R) >> plane) & 1
					}
				}

				if CalculateComplexity(block) > Threshold {
					var dataBlock [8][8]uint8
					for i := 1; i < 64; i++ {
						if dataBitIndex < totalBits {
							byteIdx := dataBitIndex / 8
							shift := uint(7 - (dataBitIndex % 8))
							dataBlock[i/8][i%8] = (secretData[byteIdx] >> shift) & 1
							dataBitIndex++
						}
					}

					if CalculateComplexity(dataBlock) <= Threshold {
						Conjugate(&dataBlock)
						dataBlock[0][0] = 1
					} else {
						dataBlock[0][0] = 0
					}

					for by := 0; by < BlockSize; by++ {
						for bx := 0; bx < BlockSize; bx++ {
							p := img.RGBAAt(x+bx, y+by)

							g := BinaryToGray(p.R)

							if dataBlock[by][bx] == 1 {
								g |= (1 << plane)
							} else {
								g &= ^(1 << plane)
							}

							p.R = GrayToBinary(g)
							img.SetRGBA(x+bx, y+by, p)
						}
					}
				}
			}
		}
	}
}

func DecodeBPCS(img *image.RGBA) []byte {
	secretData := make([]byte,0)
	dataBitIndex := 0
	// totalBits := expectedSize * 8
	bounds := img.Bounds()

	for plane := 0; plane < 8; plane++ {
		for y := bounds.Min.Y; y <= bounds.Max.Y-BlockSize; y += BlockSize {
			for x := bounds.Min.X; x <= bounds.Max.X-BlockSize; x += BlockSize {
				// if dataBitIndex >= totalBits {
				// 	return secretData
				// }

				var block [8][8]uint8
				for by := 0; by < BlockSize; by++ {
					for bx := 0; bx < BlockSize; bx++ {
						pixel := img.RGBAAt(x+bx, y+by)
						block[by][bx] = (BinaryToGray(pixel.R) >> plane) & 1
					}
				}

				if CalculateComplexity(block) > Threshold {
					wasConjugated := block[0][0] == 1
					if wasConjugated {
						Conjugate(&block)
					}

					for i := 1; i < 64; i++ {
						// if dataBitIndex >= totalBits {
						// 	return secretData
						// }
						bit := block[i/8][i%8]
						byteIdx := dataBitIndex / 8
						shift := uint(7 - (dataBitIndex % 8))
						if bit == 1 {
							secretData[byteIdx] |= (1 << shift)
						}
						dataBitIndex++
					}
				}
			}
		}
	}
	return secretData
}
