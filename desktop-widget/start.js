const path = require("path");
const fs = require("fs");

const { createWidgetServer } = require("./widget-server");

const defaultConfigPath = path.join(__dirname, "config.json");
const exampleConfigPath = path.join(__dirname, "config.example.json");
const CONFIG_PATH = process.env.MYSCOREBOARD_WIDGET_CONFIG
  || (fs.existsSync(defaultConfigPath) ? defaultConfigPath : exampleConfigPath);
const PORT = parseInt(process.env.MYSCOREBOARD_WIDGET_PORT || "7399", 10);

const server = createWidgetServer(CONFIG_PATH);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`MyScoreboard widget running at http://127.0.0.1:${PORT}`);
  console.log(`Using config: ${CONFIG_PATH}`);
});
