browser.browserAction.onClicked.addListener(tab =>
{
	browser.tabs.sendMessage(tab.id, { action: browser.runtime.id })
})
