const fs = require("fs");
const path = require("path");
const http = require("http");
const moment = require("moment-timezone");

const SNET = require("../providers/SNET");
const ESPN = require("../providers/ESPN");

const SNET_LEAGUES = new Set(["NHL", "NFL", "CFL", "MLB", "MLS"]);

function getProvider(league) {
  return SNET_LEAGUES.has(league) ? SNET : ESPN;
}

function readConfig(configPath) {
  const fullPath = path.resolve(configPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Widget config not found at ${fullPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!Array.isArray(parsed.sports) || parsed.sports.length === 0) {
    throw new Error("Widget config must include a non-empty sports array");
  }

  return parsed;
}

function getScoresForLeague(leagueConfig, gameDate) {
  const provider = getProvider(leagueConfig.league);
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          league: leagueConfig.league,
          label: leagueConfig.label || leagueConfig.league,
          scores: [],
          warning: "Provider timeout"
        });
      }
    }, 8000);

    provider.getScores(
      leagueConfig.league,
      Array.isArray(leagueConfig.teams) && leagueConfig.teams.length > 0
        ? leagueConfig.teams
        : null,
      gameDate,
      (scores) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({
            league: leagueConfig.league,
            label: leagueConfig.label || leagueConfig.league,
            scores: scores || []
          });
        }
      }
    );
  });
}

function sendJson(res, payload) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  const fullPath = path.join(__dirname, "renderer", filePath);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": `${contentType}; charset=utf-8` });
  res.end(fs.readFileSync(fullPath));
}

function createWidgetServer(configPath) {
  const config = readConfig(configPath);

  return http.createServer(async (req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      return sendFile(res, "index.html", "text/html");
    }
    if (req.url === "/widget.css") {
      return sendFile(res, "widget.css", "text/css");
    }
    if (req.url === "/widget.js") {
      return sendFile(res, "widget.js", "application/javascript");
    }

    if (req.url === "/api/config") {
      return sendJson(res, {
        title: config.title || "My Scoreboard",
        refreshMs: config.refreshMs || 120000
      });
    }

    if (req.url === "/api/scores") {
      const gameDate = moment().subtract(config.rolloverHours || 0, "hours").toDate();
      const leagueScores = await Promise.all(
        config.sports.map((leagueConfig) => getScoresForLeague(leagueConfig, gameDate))
      );
      return sendJson(res, {
        updatedAt: new Date().toISOString(),
        leagueScores
      });
    }

    res.writeHead(404);
    res.end("Not found");
  });
}

module.exports = { createWidgetServer };
