const appKey = '9b83fca52b91674cb3b8328a5d81c412';

class UserSelection {
  constructor(selection) {
    this.text = selection.toString().trim();
    this.rect = selection.getRangeAt(0).getBoundingClientRect();
  }
}

UserSelection.lastSelection = {};

UserSelection.storeLast = obj => {
  UserSelection.lastSelection = obj;
};

const getMember = (callback) => {
  chrome.runtime.sendMessage({ type: 'get-member' }, (member) => {
    callback(member);
  });
}

const getLists = (boardId, callback) => {
  chrome.runtime.sendMessage({ type: 'get-lists', boardId }, lists => {
    callback(lists);
  });
}

const sendCard = (card, callback) => {
  chrome.runtime.sendMessage({ type: 'send-card', card }, (link) => {
    callback(link);
  });
}

const openInTrello = (url) => {
  chrome.runtime.sendMessage({ type: 'open-trello', url });
}

function loadStyle() {
  return fetch(chrome.extension.getURL('all_urls.css'))
  .then(res => res.text());
}

function setPopupHTML(popup, params) {
  const shadowPopup = popup.shadowRoot;

  loadStyle().then(style => {
    let content = '';

    if (params.end) {
      const { link } = params;
      content = `
        <div class="trellify-popup__text">Card sent succesfully.</div>
        <button class="trellify-popup__btn js-btn-link" data-link="${link}">Show in Trello</button>
        <button class="trellify-popup__btn js-btn-close">Close</button>
      `;
    }

    if (params.member === 'no-member' || !params.member && !params.end) {
      content = `
        <div class="trellify-popup__text">Loading...</div>
      `;
    }

    if (params.member === 'no-token') {
      content = `
        <div class="trellify-popup__text">Authorize to use Trellify.</div>
        <button class="trellify-popup__btn js-btn-auth">Authorize</button>
      `;
    }

    if (params.member && params.member !== 'no-token' && params.member !== 'no-member') {
      const { userSelection, member, lists } = params;

      content = `
        <div class="trellify-popup__select">
          <select name="boards">
            <option value="null">Choose board</option>
            ${
              member.boards.map(board => {
                return `<option value="${board.id}" ${ board.id === userSelection.selectedBoardId ? `selected` : `` } >${board.name}</option>`
              })
            }
          </select>
        </div>
        <div class="trellify-popup__select">
          <select ${lists ? `` : `disabled`} name="lists">
            ${
              lists ?
                lists.map(list => {
                  return `<option value="${list.id}">${list.name}</option>`
                })
                :
                `<option value="null">Choose list</option>`
            }
          </select>
        </div>
        <div class="trellify-popup__card">
          <textarea name="card">${userSelection.text}</textarea>
        </div>
        <button class="trellify-popup__btn js-btn-send">Send to Trello</button>
      `;
    }

    shadowPopup.innerHTML = `<style>${style}</style> ${content}`;
  });
}

function renderPopupAtSelection(userSelection, member) {
  const { rect } = userSelection;

  const tPopup = document.createElement('div');
  tPopup.classList.add('trellify-popup');

  const shadowPopup = tPopup.createShadowRoot();
  setPopupHTML(tPopup, { userSelection, member });

  let tPopupX;

  if (rect.right - 300 < 10) {
    tPopupX = 10;
  } else if (rect.right > window.innerWidth - 10) {
    tPopupX = window.innerWidth - 310;
  } else {
    tPopupX = rect.right - 300;
  }

  document.body.appendChild(tPopup);
  tPopup.style.left = `${tPopupX}px`;
  tPopup.style.top = `${rect.top + window.scrollY}px`;

  return tPopup;
}

document.addEventListener('mouseup', e => {
  const icon = document.querySelector('.trellify-icon');
  const popup = document.querySelector('.trellify-popup');

  if (popup && !popup.contains(e.target)) {
    popup.remove();
  }

  if (icon && !icon.contains(e.target)) {
    icon.remove();
  }

  if (e.target.classList.contains('trellify-icon')) {
    const userSelection = UserSelection.lastSelection;
    const popup = renderPopupAtSelection(userSelection, 'no-member');

    getMember(member => {
      if (member && member.error === 'no-token') {
        setPopupHTML(popup, { member: 'no-token' });
      }

      if (member && !member.error) {
        setPopupHTML(popup, { userSelection, member });
      }

      popup.shadowRoot.addEventListener('change', e => {
        if (e.target.matches('[name="boards"]') && e.target.value !== 'null') {
          const boardId = e.target.value;
          UserSelection.lastSelection.selectedBoardId = boardId;

          getLists(boardId, lists => {
            const userSelection = UserSelection.lastSelection;
            UserSelection.lastSelection.selectedListId = lists[0].id;
            setPopupHTML(popup, { userSelection, member, lists });
          });
        }

        if (e.target.matches('[name="boards"]') && e.target.value === 'null') {
          const userSelection = UserSelection.lastSelection;
          UserSelection.lastSelection.selectedBoardId = null;
          UserSelection.lastSelection.selectedListId = null;
          setPopupHTML(popup, { userSelection, member, lists: null });
        }

        if (e.target.matches('[name="lists"]')) {
          const listId = e.target.value;
          UserSelection.lastSelection.selectedListId = listId;
        }

        if (e.target.matches('[name="card"]')) {
          const text = e.target.value;
          UserSelection.lastSelection.text = text;
        }
      });

      popup.shadowRoot.addEventListener('click', e => {
        if (e.target.classList.contains('js-btn-send')) {
          const card = {
            name: UserSelection.lastSelection.text,
            idList: UserSelection.lastSelection.selectedListId,
            due: null,
            desc: `Source: ${window.location.href}`
          };

          sendCard(card, res => {
            setPopupHTML(popup, { end: true, link: res.url });
          });
        }

        if (e.target.classList.contains('js-btn-close')) {
          popup.remove();
        }

        if (e.target.classList.contains('js-btn-link')) {
          const url = e.target.getAttribute('data-link');
          openInTrello(url);
        }

        if (e.target.classList.contains('js-btn-auth')) {
          chrome.runtime.sendMessage({ type: 'authorize' }, () => {
            popup.remove();
          });
        }
      });

      icon.remove();
    });
  }

  const selection = window.getSelection();

  if (!selection.isCollapsed) {
    const s = new UserSelection(selection);

    UserSelection.storeLast(s);

    const tIcon = document.createElement('div');
    tIcon.classList.add('trellify-icon');
    document.body.appendChild(tIcon);

    tIcon.style.left = `${s.rect.right}px`;
    tIcon.style.top = `${s.rect.top - 30 + window.scrollY}px`;
  }
});
