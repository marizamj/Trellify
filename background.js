const appKey = '9b83fca52b91674cb3b8328a5d81c412';

function trelloAuth() {
  const url = `https://trello.com/1/authorize?callback_method=fragments&return_url=/&scope=read,write,account&expiration=never&name=Trellify&key=${appKey}`;
  window.open(url);
}

const getMember = (function() {
  let promise = null;

  return function(token) {
    // if (promise) {
    //   console.log('getMember: using cache');
    //   return promise;
    // }

    console.log('getMember: calling trello');

    promise = fetch(`https://trello.com/1/tokens/${token}/member?key=${appKey}`)
      .then(res => res.json())
      .then(json => {

        return fetch(`https://api.trello.com/1/members/${json.id}?fields=username,fullName,url&boards=all&board_fields=name&organizations=all&organization_fields=displayName&key=${appKey}&token=${token}`)
        .then(res => res.json());
      });

    return promise;
  };
})();

const getLists = (boardId) => {
  return fetch(`https://api.trello.com/1/boards/${boardId}/lists?cards=open&card_fields=name&fields=name&key=${appKey}&token=${token}`)
    .then(res => res.json());
}

const sendCard = (card) => {
  const { name, idList, due } = card;

  return fetch(`https://api.trello.com/1/cards?name=${name}&idList=${idList}&due=${due}&key=${appKey}&token=${token}`, {
    method: 'POST'
  }).then(res => res.json());
}

let token;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.type === 'save-token') {
    token = request.token;

    chrome.storage.sync.set({ token }, () => {
      console.log('Token saved.');

      sendResponse(true);
    });

    return true;
  }

  if (request.type === 'get-member') {
    getMember(token).then(member => {
      console.log('Got member', member);

      sendResponse(member);
    });

    return true;
  }

  if (request.type === 'get-lists') {
    getLists(request.boardId).then(lists => {
      sendResponse(lists);
    });

    return true;
  }

  if (request.type === 'send-card') {
    sendCard(request.card).then(link => {
      sendResponse(link);
    });

    return true;
  }
});

trelloAuth();
