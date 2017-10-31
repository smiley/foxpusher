var API_URL = "https://api.simplepush.io/send";
var BUTTON_CAPTION = "Push to device";
var SEND_STATUS_DELAY = 3000;

function urlencodeFormData(fd){
    var params = new URLSearchParams();
    for(var pair of fd.entries()){
        typeof pair[1]=='string' && params.append(pair[0], pair[1]);
    }
    return params.toString();
}

function send(key, title, message, event, encrypted) {
    var data = new FormData();
    data.append("key", key);
    if (typeof title !== "undefined" && title != '') { data.append("title", title); };
    data.append("msg", message);
    if (typeof event !== "undefined" && event != '') { data.append("event", event); };
    
    var encodedData = urlencodeFormData(data);
    
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    
    return fetch(API_URL, {method: 'POST', mode: 'cors', body: encodedData, headers: myHeaders});
}

var _latestClear = undefined;

function setBadgeTextEx(details) {
    if (_latestClear !== undefined) {
        clearTimeout(_latestClear);
        _latestClear = undefined;
    }
    
    browser.browserAction.setBadgeText(details)
}

function clearButtonStatusAsync(timeout) {
    _latestClear = setTimeout(function() {
        browser.browserAction.setBadgeText({text: ''});
        browser.browserAction.setTitle({title: BUTTON_CAPTION});
        _latestClear = undefined;
    }, timeout);
}

function setButtonStatus(emojiCode, errorText) {
    if (emojiCode === null) {
        setBadgeTextEx({
            text: ''
        });
    } else {
        setBadgeTextEx({
            text: emojiCode
        });
    }
    
    if (errorText === null || errorText === undefined) {
        browser.browserAction.setTitle({title: BUTTON_CAPTION});
    } else {
        browser.browserAction.setTitle({title: BUTTON_CAPTION + " (" + errorText + ")"});
    }
}

function sendURLAsync(_title, _url, _originTitle, _originURL, _isLink) {
    browser.storage.local.get()
        .then(
            function(obj) {
                const KEY = obj.key || "";
                if (KEY === "") {
                    console.error('No key set!');
                    setButtonStatus('🔑', 'No Simplepush key set');
                    clearButtonStatusAsync(SEND_STATUS_DELAY);
                    browser.runtime.openOptionsPage();
                    return;
                }
                
                const USE_PRIVATE_TITLE = (obj.notifyTitle || "tab") === "private";
                var title = _isLink ? "Link received" : "Tab received";
                if (!USE_PRIVATE_TITLE) {
                    title += ': "' + _title + '"';
                }
                
                var body = _url;
                if ((_originTitle !== null) && (_originTitle !== undefined)) {
                    body += '\n\nOriginally from: "' + _originTitle + '"\n' + _originURL;
                }
                
                send(KEY, title, body, "foxpusher")
                    .then(function(res) {
                        setButtonStatus('✔');
                        clearButtonStatusAsync(SEND_STATUS_DELAY);
                    })
                    .catch(function(err) {
                        setButtonStatus('⚠', "Failed to send; try again later");
                        clearButtonStatusAsync(SEND_STATUS_DELAY);
                    });
            }
        );
}

const ICONS = {
  "16": "icons/phone-16.png",
  "32": "icons/phone-32.png",
  "48": "icons/phone-48.png",
  "64": "icons/phone-64.png"
};

browser.contextMenus.create({
    id: "push-link-to-device",
    title: "Push link to device",
    contexts: ["link"],
    icons: ICONS
});

browser.contextMenus.create({
    id: "push-tab-to-device",
    title: "Push tab to device",
    contexts: ["page", "tab"],
    icons: ICONS
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "push-link-to-device") {
        sendURLAsync(info.linkText, info.linkUrl, tab.title, tab.url, true);
    } else if (info.menuItemId === "push-tab-to-device") {
        sendURLAsync(tab.title, tab.url, null, null, false);
    }
});

browser.browserAction.onClicked.addListener((tab) => {
    setButtonStatus('⌛', "Sending...");
    sendURLAsync(tab.title, tab.url, null, null, false);
});