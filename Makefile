run:
	go run .

build:
	tinygo build -o ./website/main.wasm -target wasm ./main.go

init:
	cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js ./website/
