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

document.addEventListener('mouseup', e => {
  const s = new UserSelection(window.getSelection());
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
      const tPopup = document.createElement('div');
      tPopup.classList.add('trellify-popup');
      tPopup.innerHTML = `
        <div class="trellify-popup__select">
          <select name="boards">
            <option value="none">Choose board</option>
            ${
              member.boards.map(board => {
                return `<option value="${board.id}">${board.name}</option>`
              })
            }
          </select>
        </div>
        <div class="trellify-popup__select">
          <select disabled name="lists">
            <option value="none">Choose list</option>
          </select>
        </div>
        <div class="trellify-popup__card">
          <textarea name="card">${UserSelection.lastSelection.text}</textarea>
        </div>
        <button class="trellify-popup__btn">Send to Trello</button>
      `;

      let tPopupX;

      if (s.rect.right - 300 < 10) {
        tPopupX = 10;
      } else if (s.rect.right > window.innerWidth - 10) {
        tPopupX = window.innerWidth - 310;
      } else {
        tPopupX = s.rect.right - 300;
      }

      document.body.appendChild(tPopup);
      tPopup.style.left = `${tPopupX}px`;
      tPopup.style.top = `${s.rect.top + window.scrollY}px`;
    });

  }

  if (e.target.classList.contains('trellify-popup__btn')) {
    const value = document.querySelector('[name="card"]').value;
    console.log(value);

  }

  if (s.text.length > 0) {
    UserSelection.storeLast(s);

    const tIcon = document.createElement('div');
    tIcon.classList.add('trellify-icon');
    document.body.appendChild(tIcon);

    tIcon.style.left = `${s.rect.right}px`;
    tIcon.style.top = `${s.rect.top - 30 + window.scrollY}px`;
  }
});

