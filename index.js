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
    console.log('Got response', member);

    callback(member);
  });
}

const getLists = (boardId, callback) => {
  chrome.runtime.sendMessage({ type: 'get-lists', boardId }, lists => {
    callback(lists);
  });
}

function setPopupHTML(popup, userSelection, member, lists) {
  popup.innerHTML = `
    <div class="trellify-popup__select">
      <select name="boards">
        <option value="none">Choose board</option>
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
            `<option value="none">Choose list</option>`
        }
      </select>
    </div>
    <div class="trellify-popup__card">
      <textarea name="card">${userSelection.text}</textarea>
    </div>
    <button class="trellify-popup__btn">Send to Trello</button>
  `;
}

function renderPopupAtSelection(userSelection, member) {
  const { rect } = userSelection;

  const tPopup = document.createElement('div');

  tPopup.classList.add('trellify-popup');

  setPopupHTML(tPopup, userSelection, member);

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
    getMember(member => {
      const popup = renderPopupAtSelection(UserSelection.lastSelection, member);

      popup.addEventListener('change', e => {
        if (e.target.matches('[name="boards"]')) {
          const boardId = e.target.value;
          UserSelection.lastSelection.selectedBoardId = boardId;

          getLists(boardId, lists => {
            setPopupHTML(popup, UserSelection.lastSelection, member, lists);
          });
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

      icon.remove();
    });
  }

  if (e.target.classList.contains('trellify-popup__btn')) {
    const value = document.querySelector('[name="card"]').value;
    console.log(value);
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


