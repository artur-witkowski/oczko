// main page info popup handler
let infoIcon = document.getElementById('infoIcon');
infoIcon.addEventListener('click', function (event) {
  let infoPopup = document.getElementById('infoPopup');
  infoPopup.classList.add('showPopup');
});

window.addEventListener('click', function (event) {
  let infoPopup = document.getElementById('infoPopup');
  if (infoPopup.classList.value.includes('showPopup') && !infoPopup.contains(event.target) && !infoIcon.contains(event.target)) {
    infoPopup.classList.remove('showPopup');
  }
});

let infoPopupX = document.getElementById('infoPopupX');
infoPopupX.addEventListener('click', function (event) {
  let infoPopup = document.getElementById('infoPopup');
  infoPopup.classList.remove('showPopup');
});

// new game buttons handler
let newGameSolo = document.getElementById('newGameSolo');
newGameSolo.addEventListener('click', function (event) {
  window.location.href = "oczko.html?mode=solo"
});

let newGameMulti = document.getElementById('newGameMulti');
newGameMulti.addEventListener('click', function (event) {
  window.location.href = "oczko.html?mode=multi"
});