import https from 'https';
import http from 'http';
import fs from 'fs';
import { build } from './app';
import { getConfig, setConfig } from './config';
import { getStatusManager } from './status';

const run = async () => {
  await setConfig();
  const { port, enableHttpsForDev } = getConfig();

  await getStatusManager();
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
