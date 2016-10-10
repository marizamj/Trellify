let token;
const appKey = '9b83fca52b91674cb3b8328a5d81c412';

function trelloFetch(url, params, method) {
  const appKey = '9b83fca52b91674cb3b8328a5d81c412';
  const paramsWithKey = Object.assign({}, params, { key: appKey });
  const keyValues = Object.keys(paramsWithKey).map(key => `${key}=${paramsWithKey[key]}`);

  return fetch(
    `https://trello.com/1/${url}?${keyValues.join('&')}`,
    method === 'POST' ? { method } : {}
  ).then(res => res.json())
}

function trelloAuth() {
  // chrome.storage.sync.remove('token', () => {
  chrome.storage.sync.get('token', (obj) => {
    if (obj.token) {
      token = obj.token;

    } else {
      const url = `https://trello.com/1/authorize?callback_method=fragments&return_url=/&scope=read,write,account&expiration=never&name=Trellify&key=${appKey}`;
      window.open(url);
    }
  });
  // });
}

const getMember = () => {
  return trelloFetch(`tokens/${token}/member`, {})
    .then(res => {
      return trelloFetch(`members/${res.id}`, {
        'fields': 'username,fullName,url',
        'boards': 'all',
        'board_fields': 'name',
        token
      });
    })
}

const getLists = (boardId) => {
  return trelloFetch(`boards/${boardId}/lists`, {
    cards: 'open',
    card_fields: 'name',
    fields: 'name',
    token
  });
}

const sendCard = (card) => {
  const { name, idList, due } = card;

  return trelloFetch(`cards`, { name, idList, due, token }, 'POST');
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.type === 'save-token') {
    token = request.token;

    chrome.storage.sync.set({ token }, () => {
      sendResponse(true);
    });

    return true;
  }

  if (request.type === 'get-member') {
    getMember().then(member => {
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

  if (request.type === 'open-new-card') {
    window.open(request.url);
  }
});

trelloAuth();
