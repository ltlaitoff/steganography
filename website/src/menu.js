import { assert } from "./shared/errors.js";
import { loadElement, typedEventListener } from "./shared/shared.js";


/**
	* @typedef Block
	* @prop {string} name
	* @prop {string[]} operations
	* @prop {(operationName: string) => void} callback
	*
	* @typedef {Block[]} Blocks
	*/

const root = loadElement({ id: "menu", type: HTMLDivElement })

/**
	* @param {Blocks} blocks  
	*/
function CreateMenu(blocks) {
	render(blocks)
}

/**
	* @param {Blocks} blocks
	*/
function render(blocks) {
	for (const child of Array.from(root.children)) {
		root.removeChild(child)
	}

	for (const block of blocks) {
		const blockUI = document.createElement("div")
		blockUI.className = "menu-block"

		for (const operation of block.operations) {
			const operationUI = document.createElement("label")
			operationUI.className = "menu-block--element"
			operationUI.textContent = operation

			const inputUI = document.createElement("input")
			inputUI.type = "radio"
			inputUI.name = `menu-${block.name}`
			inputUI.value = operation

			if (operation == block.operations[0]) {
				inputUI.checked = true
			}

			operationUI.append(inputUI)
			blockUI.append(operationUI)
		}

		typedEventListener(blockUI, "change", HTMLInputElement, (target) => {
			assert(block.operations.includes(target.value), "Value of changed input should be one of block operations")

			block.callback(target.value)
		})

		root.appendChild(blockUI)
	}
}

export { CreateMenu }
