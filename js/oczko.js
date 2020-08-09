/***** GLOBAL VARIABLES *****/

const gameUrl = new URL(window.location.href);
const mode = gameUrl.searchParams.get('mode');

let deckId;
let players = [];
let currentPlayerId;
let timeoutList = [];
let isGameEnded = false;
let botPlaying = false;

/***** FUNCTIONS *****/

function newChatMessage(message, type) {
  let chatBox = document.getElementById('chatBox');
  const todayDate = new Date();
  let messageTime = `${
    todayDate.getHours() < 10 ? '0' : ''
  }${todayDate.getHours()}:${
    todayDate.getMinutes() < 10 ? '0' : ''
  }${todayDate.getMinutes()}:${
    todayDate.getSeconds() < 10 ? '0' : ''
  }${todayDate.getSeconds()}`;

  let addMessage;
  if (type === 'error') {
    addMessage = `<div class="chatMessage errorMessage"><b>${messageTime}</b> BŁĄD! ${message}</div>`;
  } else if (type === 'system') {
    addMessage = `<div class="chatMessage systemMessage"><b>${messageTime}</b> ${message}</div>`;
  } else {
    addMessage = `<div class="chatMessage"><b>${messageTime}</b> ${message}</div>`;
  }

  chatBox.innerHTML += addMessage;
  chatBox.scrollTop = chatBox.scrollHeight;
}

function drawCards(playerId, amount) {
  const player = players.find(p => p.id === playerId);

  if (player && amount > 0 && deckId) {
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${amount}`)
      .then(response => response.json())
      .then(deckData => {
        if (!deckData.success) {
          throw new Error("API Nie można dobrać kart");
        } else {
          return deckData.cards;
        }
      })
      .then(newCards => {
        return newCardsSetup(playerId, newCards);
      })
      .then(() => {
        
      })
      .catch(err => {
        console.log(err);
        newChatMessage(err.message, 'error');
      });
  } else {
    newChatMessage('Nie prawidłowa ilość kart lub gracz nie istnieje', 'error');
  }
}

function newCardsSetup(playerId, newCards) {
  const player = players.find(p => p.id === playerId);

  newCards.map((card, index) => {
    let cardPoints;
    let cardValuePL;
    let cardSuitPL;
    if (isNaN(card.value)) {
      switch(card.value) {
        case 'JACK':
          cardPoints = 2;
          cardValuePL = "waleta";
          break;
        case 'QUEEN':
          cardPoints = 3;
          cardValuePL = "królową";
          break;
        case 'KING':
          cardPoints = 4;
          cardValuePL = "króla";
          break;
        case 'ACE':
          cardPoints = 11;
          cardValuePL = "asa";
          break;
      }
    } else {
      cardPoints = +card.value;
      cardValuePL = +card.value;
    }

    switch(card.suit) {
      case 'DIAMONDS':
        cardSuitPL = "karo";
        break;
      case 'SPADES':
        cardSuitPL = "pik";
        break;
      case 'HEARTS':
        cardSuitPL = "kier";
        break;
      case 'CLUBS':
        cardSuitPL = "trefl";
        break;
    }
    
    timeoutList.push(setTimeout(() => { 
      moveNewCard(player, card, cardPoints, cardValuePL, cardSuitPL)
    }, index*700));
  });
}

function moveNewCard(player, card, cardPoints, cardValuePL, cardSuitPL) {
  if (mode === 'solo' && player.id > 1) {
    newChatMessage(`Bot dobrał ${cardValuePL} ${cardSuitPL}.`);
  } else {
    newChatMessage(`Gracz ${player.id} dobrał ${cardValuePL} ${cardSuitPL}.`);
  } 
  player.points += cardPoints;
  document.getElementById('statsPoints').innerHTML = `Punkty: ${player.points}`;
  player.cards.push(card);
  const newCardId = `card${card.code}`;
  const newCardHTML = `<div class="flip-card" id="${newCardId}">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <img src="img/back.png" alt="back" />
    </div>
    <div class="flip-card-back">
      <img src="${card.image}" alt="${card.code}" draggable="false"/>
    </div>
  </div>
</div>`;
  let stackField = document.getElementById('stackField');
  stackField.innerHTML += newCardHTML;

  let playerField = document.querySelector(`.playerField:nth-child(${player.id})`);

  let newCardElementInner = document.querySelector(`#${newCardId} > .flip-card-inner`);
  let newCardElement = document.getElementById(newCardId);
  const cardLeftPos = stackField.offsetLeft-playerField.offsetLeft-((player.cards.length-1)*30);

  newCardElementInner
    .animate([
      { transform: 'rotateY(0)' }, 
      { transform: 'rotateY(180deg)' }
    ], { 
      duration: 400,
      fill: 'forwards',
    });
    
  newCardElement
    .animate([
      { left: '13px' }, 
      { left: `-${cardLeftPos}px` }
    ], { 
      duration: 600,
      fill: 'forwards',
    });

    timeoutList.push(setTimeout(() => {
    document.querySelector(`#${newCardId} > .flip-card-inner`).setAttribute("style", " transition: none !important; transform: rotateY(180deg);");
    document.getElementById(newCardId).style.left = `-${cardLeftPos}px`;
  }, 600));


  if(checkPerskieOczko(player.id)) {
    console.log("Perskie oczko!")
  } else if (player.points >= 22) {
    if (mode === 'solo' && !botPlaying) {
      player.points = 0;
      newChatMessage(`Gracz ${player.id} przegrał.`);
      botPlays();
      botPlaying = true;

    } else if (mode === 'multi') {
      newChatMessage(`Gracz ${player.id} przegrał.`);
      timeoutList.push(setTimeout(playerPass, 700));
    }
  } 
}

function playerPass() {
  currentPlayerId++;
    if (currentPlayerId > players.length) {
      endGame();
    } else {
      const player = players.find(p => p.id === currentPlayerId);
      newChatMessage(`Runda gracza ${currentPlayerId}`, 'system');
      drawCards(currentPlayerId, 2);
      document.getElementById('statsRound').innerHTML = `Runda gracza ${currentPlayerId}`;
      document.getElementById('statsPoints').innerHTML = `Punkty: ${player.points}`;
    }
}

function endGame(winner) {
  isGameEnded = true;

  if (mode === 'solo' && winner == 2) {
    newChatMessage(`KONIEC GRY! Wygrał BOT! Kliknij Reset, aby zacząć od nowa!`, 'system');
  } else if (winner) {
    newChatMessage(`KONIEC GRY! Wygrał gracz ${winner}! Kliknij Reset, aby zacząć od nowa!`, 'system');
  } else {
    let winners = [];
    let maxPoints = 0;
    players.forEach(p => {
      if (p.points > maxPoints && p.points < 22) {
        maxPoints = p.points;
        winners.length = 0;
        winners.push(p.id);
      } else if (p.points === maxPoints && p.points < 22) {
        winners.push(p.id);
      }
    })
    if (winners.length > 0) {
      let winnersText;
      if (mode === 'solo' && winners.includes(2)) {
        winnersText = "BOT";
      } else {
        winnersText = winners[0];
      }
      for(let i = 1; i < winners.length; i++) {
        if (mode === 'solo' && winners.includes(2)) {
          winnersText = + ", BOT";
        } else {
          winnersText += `, ${winners[i]}`
        }
      }
      
      newChatMessage(`KONIEC GRY! Wygra${(winners.length > 1)?"li":"ł"} gracz${(winners.length > 1)?"e":""} ${winnersText}! Kliknij Reset, aby zacząć od nowa!`, 'system');
    } else {
      newChatMessage(`KONIEC GRY! Nikt nie wygrał! Kliknij Reset, aby zacząć od nowa!`, 'system');
    }
  }
}

function resetGame() {
  timeoutList.forEach(clearTimeout);

  fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`)
      .then(response => response.json())
      .then(deckData => {
        if (!deckData.success) {
          throw new Error("API Nie można dobrać kart");
        } else {
          newChatMessage(`Nowa gra!`, 'system');
          init(mode, false);
          isGameEnded = false;
        }
      })
      .catch(err => {
        console.log(err);
        newChatMessage(err.message, 'error');
      });
}

function checkPerskieOczko(playerId) {
  const player = players.find(p => p.id === playerId);

  if (player.cards.length === 2 && player.cards[0].value === "ACE" && player.cards[1].value === "ACE") {
    endGame(player.id);
    return true;
  } else {
    return false;
  }
}

function botPlays() {
  currentPlayerId++;
  const bot = players.find(p => p.id === currentPlayerId);
  newChatMessage(`Runda gracza ${currentPlayerId}`, 'system');
  drawCards(currentPlayerId, 2);
  document.getElementById('statsRound').innerHTML = `Runda BOTa`;
  document.getElementById('statsPoints').innerHTML = `Punkty: ${bot.points}`;

  let botInterval = setInterval(() => {
    if (bot.cards.length >= 2 && bot.points <= players[0].points && bot.points < 22) {
      drawCards(2, 1);
    } else {
      clearInterval(botInterval);
      endGame();
    }
  }, 1500);
}

function setModeSettings(gameMode) {
  if (gameMode === 'multi')
      {
        players = [
          {
            id: 1,
            points: 0,
            cards: [],
          },
          {
            id: 2,
            points: 0,
            cards: [],
          },
          {
            id: 3,
            points: 0,
            cards: [],
          },
        ];
        
        const newFieldHTML = `<div class="playerField">
  <h1>Gracz 1</h1>
</div>
<div class="playerField">
  <h1>Gracz 2</h1>
</div>
<div class="playerField">
  <h1>Gracz 3</h1>
</div>
<div id="stackField"></div>`;
        let fieldBox = document.getElementById('fieldBox');
        fieldBox.innerHTML = newFieldHTML;
      } else if (gameMode === 'solo') {
        players = [
          {
            id: 1,
            points: 0,
            cards: [],
          },
          {
            id: 2,
            points: 0,
            cards: [],
          },
        ];

        const newFieldHTML = `<div class="playerField">
  <h1>Gracz 1</h1>
</div>
<div class="playerField">
  <h1>Bot</h1>
</div>
<div id="stackField"></div>`;
        let fieldBox = document.getElementById('fieldBox');
        fieldBox.innerHTML = newFieldHTML;
      }
}

function init(gameMode, newGame) {
  if (newGame) {
    fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    // fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AD,AC,AS,AH,QD,QC')
    .then(response => response.json())
    .then(newDeckData => {
      if (!newDeckData.success) {
        throw new Error('API Nie można pobrać nowej talii');
      } else {
        deckId = newDeckData.deck_id;
      }
    })
    .then(() => {
      drawCards(1,2);
    })
    .catch(err => {
      console.log(err);
      newChatMessage(err.message, 'error');
    });
  } else {
    drawCards(1,2);
  }

  setModeSettings(gameMode);
  currentPlayerId = 1;
  timeoutList.forEach(clearTimeout);
  timeoutList = [];
  stackField.innerHTML = "";
  botPlaying = false;
  document.getElementById('statsRound').innerHTML = `Runda gracza 1`;
  document.getElementById('statsPoints').innerHTML = `Punkty: 0`;
}

/***** EVENT LISTENERS *****/

document
  .getElementById('drawCard')
  .addEventListener('click', function (event) {
    if (!isGameEnded && !botPlaying) {
      drawCards(currentPlayerId, 1);
    }
});

document
  .getElementById('passCard')
  .addEventListener('click', function (event) {
    if (mode === 'solo' && !botPlaying) {
      botPlays();
      botPlaying = true;
    } else if (!isGameEnded && !botPlaying) {
      playerPass();
    }
  });

document
.getElementById('settingsReturn')
.addEventListener('click', function (event) {
  window.location.href = "index.html";
});

document
.getElementById('settingsReset')
.addEventListener('click', function (event) {
  resetGame();
});

/***** MAIN PROGRAM *****/

init(mode, true);
