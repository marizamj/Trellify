console.log('trello content script!', location.href);

const match = location.href.match(/token=(\w+)/);

if (match && match.length === 2) {
  console.log(match[1]);

  const trelloToken = match[1];

  chrome.runtime.sendMessage({ type: 'save-token', token: trelloToken }, () => {
    window.close();
  });
}
