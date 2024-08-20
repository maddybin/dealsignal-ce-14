var ceTabId = 0;
var cookieInfo = null;
var cePopupWindow = null;
var parentWindow = null;
var selectedTab = null;
var baseURL = null;
var baseURLV1 = null;

var ceForSales = function (tab, windowData) {
  var currentScreenSize = windowData.screenWidth;
  var height = windowData.screenHeight;
  var ceSize = 430;

  if (cePopupWindow) {
    /* Close Popup Ce window */
    chrome.windows.remove(cePopupWindow.id, () => {
      /* Set main window to normal state. */
      chrome.windows.update(tab.windowId, {
        focused: true, top: 0, left: 0, width: +currentScreenSize
      });

      cePopupWindow = null;
    });
  } else {
    const windowParams = {
      url: 'index.html', type: 'popup', state: 'normal', focused: true,
      height: +height, width: +ceSize, top: 0, left: 0
    }

    /* Open new popup ce window next to main window */
    chrome.windows.create(windowParams, (popUp) => {
      cePopupWindow = popUp;

      const siteInfo = { csrfToken: (cookieInfo || {}).value, parentTab: tab, cePopupTab: popUp };
      chrome.storage.local.set({ siteData: siteInfo });

      chrome.windows.onCreated.addListener(() => {
        chrome.windows.update(tab.windowId, {
          focused: false,
          width: currentScreenSize - ceSize,
          top: 0,
          left: ceSize
        });

        ceTabId = cePopupWindow.tabs[0].id;

        chrome.tabs.reload(parentWindow.id, function () { });
      })
    });
  }
}

chrome.action.onClicked.addListener(function (tab) {
  parentWindow = tab;
  chrome.cookies.get({ url: 'https://www.linkedin.com/', name: 'JSESSIONID' }, function (cookie) {
    cookieInfo = cookie;

    /* Get Current window dimensions */
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { title: 'getWindowInfo', tab: tab }, (resp) => {
        return resp;
      })
    }, 500);
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.title === 'setWindowInfo') {
    baseURL = message.baseURL;
    baseURLV1 = message.baseURLV1;
    ceForSales(parentWindow, message);
    sendResponse(true);
  }

  if (message.title === 'parsedDataFromCS') {
    chrome.tabs.sendMessage(ceTabId, { title: 'parsedData', payload: message.payload })
    sendResponse(true);
  }

  if (message.title === 'sendToApp') {
    chrome.tabs.sendMessage(ceTabId, { title: 'fromBackground', info: 'I am comming from background' }, (resp) => {
      return resp;
    });
    sendResponse(true);
  }
})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, currentTab) {
  if (tabId && parentWindow && currentTab.status == "complete"
    && changeInfo.status == 'complete' && currentTab.url != undefined && !currentTab.url.includes('?miniProfileUrn')
    && !(currentTab.url.includes('savedSearchId')
      && (currentTab.url.includes('sessionId') || currentTab.url.includes('searchSessionId')))) {
    if (tabId === parentWindow.id) {
      if (currentTab.url.includes('/search/')) {
        setTimeout(function () {
          chrome.tabs.sendMessage(ceTabId, { title: 'refreshPage', windowId: parentWindow.id, ceTabId: ceTabId });
        }, 4000);
      } else {
        if (!(currentTab.url.includes('/detail/'))) {
          setTimeout(function () {
            chrome.tabs.sendMessage(ceTabId, { title: 'refreshPage', windowId: parentWindow.id });
          }, 2500);
        }
      }
    }
  }
});