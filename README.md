# steganography


## Run for development?

### Go

First, install `Go`, check version in [go.mod](go.mod) or in [tool_version](.tool_version)

Second, to transform logic from Go into WASM to run it in browser install `TinyGo`, check version in 
[tool_version](.tool_version)

Third, to use Go WASM in browser, we need to add `wasm_exec.js` file. 

This file depends on the compiler version, so if you change the compiler(tinygo) version, you need to change this 
file as well.

Also, this file is already saved in the repository for `TinyGo` of version from [tool_version](.tool_version)

But if you use different version of compiler, you should copy file from compiler settings. To do this check these 
commands:

```shell
# For TinyGo manually
cp $(tinygo env TINYGOROOT)/targets/wasm_exec.js ./website/
```

Or we can run `init` script from [Makefile](Makefile):
> Make sure Makefile has access to environment variables

```shell
make run init
```

### Frontend 

All frontend code located in the [website](./website) directory

To develop the frontend part you need to install project dependencies

To do this first install NodeJS and pnpm. Check versions in [tool_version](.tool_version)

And after than install dependencies:
```shell
cd ./website

pnpm install
```

Frontend part don't need any additional transformation to run, because it was written in JS

But, we cannot just open index.html file in browser and expect it will run, because of CORS. Check [StackOverflow](https://stackoverflow.com/questions/48362093/cors-request-blocked-in-locally-opened-html-file) for more details

So, we need to start some sort of server, as example live-server:

```shell
npx live-server
```

