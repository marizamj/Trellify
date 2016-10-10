function run() {
  renderPopup();

  getMember(member => {
    renderPopup(member);
  });

}

function renderPopup(member) {
  const rootElem = document.querySelector('.root');
  rootElem.innerHTML = `
  <div class="header">Trellify</div>
  ${member && member.fullName ?
    `
      <div class="popup-text">Hello, ${member.fullName}!</div>
      <button class="trellify-popup__btn btn-open-trello" data-link="https://trello.com/">Open Trello</button>
      <button class="trellify-popup__btn btn-logout">Log out</button>
    `
    :
    `
      <div class="popup-text">Hi there!</div>
      <button class="trellify-popup__btn btn-open-trello" data-link="https://trello.com/">Open Trello</button>
      <button class="trellify-popup__btn btn-auth">Authorize</button>
    `
  }`;

  return rootElem;
}

document.querySelector('.root').addEventListener('click', e => {
  if (e.target.classList.contains('btn-logout')) {
    chrome.storage.sync.set({ token: null });
    renderPopup();
  }

  if (e.target.classList.contains('btn-open-trello')) {
    const url = e.target.getAttribute('data-link');
    chrome.runtime.sendMessage({ type: 'open-trello', url });
  }

  if (e.target.classList.contains('btn-auth')) {
    chrome.runtime.sendMessage({ type: 'authorize' });
  }

});

const getMember = (callback) => {
  chrome.runtime.sendMessage({ type: 'get-member' }, (member) => {
    callback(member);
  });
}

run();
