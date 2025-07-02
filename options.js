let settingsDefault = {}
async function initSettings(ev)
{
	const res	= await fetch(browser.runtime.getURL('settings.json'))
	settingsDefault	= await res.json()

	for (const key of Object.keys(settingsDefault))
	{
		document.getElementById(key).addEventListener('input', saveSettings)
	}

	loadSettings()
}

async function loadSettings(ev)
{
	try
	{
		settings = await browser.storage.sync.get(settingsDefault)
		for (const [key, value] of Object.entries(settings))
		{
			document.getElementById(key).value = value
		}
		console.log(`loadSettings: ${JSON.stringify(settings)}`)
	}
	catch(e)
	{
		console.error(e)
	}
}

async function saveSettings(ev)
{
	ev.preventDefault()

	const settings = { ...settingsDefault }
	for (const key of Object.keys(settings))
	{
		const value = document.getElementById(key).value
		if (value && value.trim() !== '')
		{
			settings[key] = value
			console.log(value)
		}
	}

	try
	{
		await browser.storage.sync.set(settings)
		console.log(`saveSettings: ${JSON.stringify(settings)}`)
	}
	catch(e)
	{
		console.error(e)
	}
}

//document.addEventListener('load', initSettings)
document.addEventListener('DOMContentLoaded', initSettings)
