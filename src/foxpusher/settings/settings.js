const spKeyElement = document.getElementsByName('key')[0];
const tabTitleRadio = document.getElementsByName('title');

function loadSavedData(data) {
  const key = data.key;
  const notifyTitle = data.notifyTitle;
  
  spKeyElement.value = key || "";

  if (notifyTitle === 'tab')
    tabTitleRadio[0].checked = true;
  else if (notifyTitle === 'private')
    tabTitleRadio[1].checked = true;
}

if (browser === undefined) {
    var browser = chrome;
}

function getFromLocalStorage(arg) {
    if (chrome !== undefined) {
        return new Promise(function(resolve, reject) {
            browser.storage.local.get(arg, function (items) {
                if (chrome.runtime.lastError !== undefined) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(items);
                }
            });
        });
    } else {
        return browser.storage.local.get(arg);
    }
}

document.addEventListener('DOMContentLoaded', function() {
  const savedData = getFromLocalStorage();
  savedData.then(loadSavedData);
});

function getTitlePrivacySetting() {
  let notifyTitle = '';

  for (let i = 0; i < tabTitleRadio.length; i++) {
    if (tabTitleRadio[i].checked)
      notifyTitle = tabTitleRadio[i].value;
    else
      continue;
  }

  return notifyTitle || "tab";
}

function getKeySetting() {
  return spKeyElement.value || "";
}

var saveSettings = function() {
    const settings = {
        key: getKeySetting(),
        notifyTitle: getTitlePrivacySetting()
    };

    browser.storage.local.set(settings);
  };

for (let i = 0; i < tabTitleRadio.length; i++) {
  tabTitleRadio[i].onclick = saveSettings;
}

spKeyElement.onblur = saveSettings;