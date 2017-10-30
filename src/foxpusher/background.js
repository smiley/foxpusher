var API_URL = "https://api.simplepush.io/send";

function send(key, title, message, event, encrypted) {
  var http = new XMLHttpRequest();
  
  http.open("POST", API_URL, true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  
  var data = "key=" + key;
  if(typeof title !== "undefined" && title != '') {data += "&title=" + encodeURIComponent(title);}
  data += "&msg=" + encodeURIComponent(message);
  if(typeof event !== "undefined" && event != '') {data += "&event=" + event;}
  
  http.send(data);
  
  return http;
}

function sendURLAsync(_title, _url, _originTitle, _originURL, _isLink) {
    browser.storage.local.get()
        .then(
            function(obj) {
                const KEY = obj.key || "";
                if (KEY === "") {
                    console.error('No key set!');
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
                
                send(KEY, title, body, "foxpusher");
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
    sendURLAsync(tab.title, tab.url, null, null, false);
});