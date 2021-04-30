const resultsElement = document.querySelector('#results');
const params = new URLSearchParams(window.location.search);

const client = new tmi.Client({
  channels: [params.get('channel') || 'codinggarden'],
});

client.connect();

const choiceEmojis = ['1️⃣', '2️⃣', '3️⃣'];
const defaultChoices = ['Yes', 'No'];

const state = {
  voters: new Map(),
  voting_enabled: false,
  choices: defaultChoices.slice(),
};

function renderVotes() {
  const totals = new Map();
  state.choices.forEach((_, index) => {
    totals.set(index + 1, 0);
  });
  [...state.voters.values()].forEach((vote) => {
    totals.set(vote, (totals.get(vote) || 0) + 1);
  });
  [...totals.entries()].forEach(([choice, votes]) => {
    const votesElement = document.querySelector(`#votes-${choice}`);
    votesElement.textContent = `${votes}(${Math.round((votes / state.voters.size) * 100)}%)`;
  });
}

client.on('message', (channel, tags, message) => {
  if (tags.badges && (tags.badges.broadcaster || tags.badges.moderator)) {
    if (message === '!vote-start') {
      state.voting_enabled = true;
      state.voters = new Map();
      resultsElement.innerHTML = '';
      resultsElement.style.display = '';
      state.choices.forEach((choice, index) => {
        const choiceContainer = document.createElement('div');
        choiceContainer.classList.add('option');
        const choiceElement = document.createElement('p');
        choiceElement.classList.add('choice');
        choiceElement.textContent = choice;
        const numElement = document.createElement('p');
        numElement.classList.add('num');
        numElement.textContent = choiceEmojis[index];
        const votesElement = document.createElement('p');
        votesElement.classList.add('votes');
        votesElement.setAttribute('id', `votes-${index + 1}`);
        votesElement.textContent = '0 (0%)';
        choiceContainer.append(choiceElement);
        choiceContainer.append(numElement);
        choiceContainer.append(votesElement);
        resultsElement.append(choiceContainer);
      });
    } else if (message === '!vote-end') {
      state.voting_enabled = false;
    } else if (message === '!vote-reset') {
      state.voters = new Map();
      renderVotes();
    }
  }
  if (!state.voting_enabled) return;
  if (!isNaN(message)) {
    const vote = parseInt(message, 10);
    if (vote <= state.choices.length && vote >= 1) {
      state.voters.set(tags.username, vote);
    }
  }
  renderVotes();
});
