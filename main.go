package main

import "fmt"

func main() { }

//export Log
func Log(ok bool) {
	fmt.Println("Hello world!!!", ok)
}
