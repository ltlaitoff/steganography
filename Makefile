run:
	go run .

build:
	tinygo build -o ./website/src/main.wasm -target wasm .

init:
	cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js ./website/src/
