const appKey = '9b83fca52b91674cb3b8328a5d81c412';

function trelloAuth() {
  const url = `https://trello.com/1/authorize?callback_method=fragments&return_url=/&scope=read,write,account&expiration=never&name=Trellify&key=${appKey}`;
  window.open(url);
}

function getMember(token, callback) {
  fetch(`https://trello.com/1/tokens/${token}/member?key=${appKey}`)
  .then(res => res.json())
  .then(json => {

    fetch(`https://api.trello.com/1/members/${json.id}?fields=username,fullName,url&boards=all&board_fields=name&organizations=all&organization_fields=displayName&key=${appKey}&token=${token}`)
    .then(res => res.json())
    .then(json => {
      callback(json);
    });
  });
}

let token;
// let member;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.trelloToken) {
    sendResponse(true);

    token = request.trelloToken;

    chrome.runtime.onConnect.addListener(function(port){
      port.postMessage({ token });
    });

    chrome.storage.sync.set({ token: request.trelloToken }, () => {
      console.log('Token saved.');
    });

    getMember(token, member => {
      chrome.runtime.onConnect.addListener(function(port){
        port.postMessage({ member });
      });
    });
  }

  if (request.message === 'Member request.') {
    fetch(`https://trello.com/1/tokens/${token}/member?key=${appKey}`)
    .then(res => res.json())
    .then(json => {
      console.log('response to content message');
      sendResponse({ json });
    });

    sendResponse(true);
  }
});


// const run = new Promise((resolve, reject) => {

// });

trelloAuth();


// chrome.storage.sync.get('token', (obj) => { token = obj.token; });





// 568e6d91a9939f46efd45c5a
// 568fc9087c977a45833a91da
