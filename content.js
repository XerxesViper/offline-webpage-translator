async function sendTextToServer(text, url, body)
{
	const textEscaped = JSON.stringify(text).slice(1, -1)
	//const textEscaped = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
	const data =
	{
		method	: 'POST',
		headers	: { 'Content-Type': 'application/json' },
		body	: body.replace("${text}", textEscaped),
	}
	console.log(data.body)

	try
	{
		const res	= await fetch(url, data)
		const resJson	= await res.json()
		console.log(`resJson: '${JSON.stringify(resJson)}'`)
		//return JSON.parse(`"${resJson.response}"`)
		//const textUnescaped = resJson.response.replace(/\\\\/g, "\\").replace(/\\"/g, '"')
		//const textUnescaped = JSON.parse(`"${resJson.response}"`)
		const textUnescaped = resJson.response //.substring(.requestBody.suffix.length | 0)
		return textUnescaped
	}
	catch(e)
	{
		console.error(e)
		return text
	}
}

function filterNode(node)
{
	const hasVisibleText	= !(/^\s*$/.test(node.textContent))
	const hasLength	= node.textContent.trim().length > 3
	const ret = hasVisibleText && hasLength ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
	return ret
}

async function run()
{
	const res = await fetch(browser.runtime.getURL('settings.json'))
	const settingsDefault = await res.json()
	
	const settings = await browser.storage.sync.get(settingsDefault)
	//console.log(JSON.stringify(settings))

	const selection = window.getSelection()

	const textNodes = []
	//console.log(selection)
	if (selection.rangeCount == 0 || (selection.rangeCount == 1 && selection.type === "Caret"))
	{
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, filterNode)
		let node 	
		while (node = walker.nextNode()) { textNodes.push(node) }			
	}
	else
	{
		function traverseNodes(node)
		{
			if (node.nodeType === Node.TEXT_NODE)
			{
				if (selection.containsNode(node, true) && filterNode(node) === NodeFilter.FILTER_ACCEPT)
				{
					textNodes.push(node)
				}
			}
			else
			{
				for (let i = 0; i < node.childNodes.length; i++)
				{
					traverseNodes(node.childNodes[i])
				}
			}
		}

		for (let i = 0; i < selection.rangeCount; i++)
		{
			const range = selection.getRangeAt(i)
			const commonAncestor = range.commonAncestorContainer
			traverseNodes(commonAncestor)
		}
	}

	let requestBody = settings.requestBody
	const placeholders = /\$\{([a-zA-Z_$][\w$]*)\}/g
	requestBody = requestBody.replace(placeholders, (_, key) => settings.hasOwnProperty(key) ? settings[key] : ("${" + key + "}"))
	requestBody = requestBody.replace(placeholders, (_, key) => settings.hasOwnProperty(key) ? settings[key] : ("${" + key + "}"))
	//console.log(requestBody)
	for (let i = 0; i < textNodes.length; i++)
	{
		try
		{
			const node = textNodes[i]
			const oldText = node.textContent
			const newText = await sendTextToServer(oldText, settings.url, requestBody)
			console.log(`'${oldText}' => '${newText}'`)
			if (newText)
			{
				node.textContent = newText
			}
		}
		catch(e)
		{
			console.error(e)
		}
	}
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
	//console.log(`${message.action} ${browser.runtime.id}`)
	if (message.action === browser.runtime.id)
	{
		run()
	}
})
