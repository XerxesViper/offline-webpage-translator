chrome.action.onClicked.addListener(tab =>
{
	chrome.tabs.sendMessage(tab.id, { action: chrome.runtime.id })
})
