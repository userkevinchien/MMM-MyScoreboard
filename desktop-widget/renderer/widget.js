async function loadConfig() {
  const response = await fetch('/api/config');
  return response.json();
}

function renderScores(payload) {
  const container = document.getElementById('scores');
  container.innerHTML = '';

  payload.leagueScores.forEach((leagueEntry) => {
    const league = document.createElement('section');
    league.className = 'league';

    const heading = document.createElement('h2');
    heading.textContent = leagueEntry.label;
    league.appendChild(heading);

    if (!leagueEntry.scores.length) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'No games';
      league.appendChild(empty);
    }

    leagueEntry.scores.forEach((game) => {
      const gameEl = document.createElement('article');
      gameEl.className = 'game';
      const away = document.createElement('div');
      away.textContent = `${game.vTeam} ${Number.isInteger(game.vScore) ? game.vScore : ''}`.trim();
      const home = document.createElement('div');
      home.textContent = `${game.hTeam} ${Number.isInteger(game.hScore) ? game.hScore : ''}`.trim();
      const status = document.createElement('div');
      status.className = 'status';
      status.textContent = game.status.join(' ');

      gameEl.append(away, home, status);
      league.appendChild(gameEl);
    });

    container.appendChild(league);
  });

  document.getElementById('updated').textContent = `Updated ${new Date(payload.updatedAt).toLocaleTimeString()}`;
}

async function refreshScores() {
  const response = await fetch('/api/scores');
  const payload = await response.json();
  renderScores(payload);
}

async function boot() {
  const config = await loadConfig();
  document.getElementById('title').textContent = config.title;
  await refreshScores();
  setInterval(refreshScores, config.refreshMs);
}

boot();
