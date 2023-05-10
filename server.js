import { build } from './src/app.js'
import { getConfig, setConfig } from "./src/config.js";
import https from "https"
import http from "http"
import fs from "fs"

const run = async () => {
  await setConfig()
  const { port, enableHttpsForDev } = getConfig();

  const app = await build();
  
  if (enableHttpsForDev) {
    https
      .createServer(
        {
          key: fs.readFileSync("server-dev-only.key"),
          cert: fs.readFileSync("server-dev-only.cert")
        },
        app
      ).listen(port, () => console.log(`Server running on port ${port}`))
  } else {
    http
      .createServer(app).listen(port, () => console.log(`Server running on port ${port}`))

  }
};

run();




