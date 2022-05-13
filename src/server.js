const fs = require("fs");
const axios = require("axios");
const os = require("os");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");
const { execSync } = require("child_process");

const config = {
  port: process.env.PORT || 30000,
  ntfyServer: process.env.NTFY_SERVER_ADDRESS || "http://localhost:30001",
  tempFolderPath: undefined,
};

fs.mkdtemp(path.join(os.tmpdir(), "ntfy_alertmanager_bridge"), (err, folder) => {
  if (err) throw err;
  console.log("created temp folder: " + folder);
  config.tempFolderPath = folder;
});

const app = new Koa();
app.use(bodyParser());
const router = new Router();

function cleanShellOutput(source) {
  return source.trimEnd("\r\n").replaceAll('"', "");
}

function logIncomingRequest(ctx) {
  const incoming = {
    url: ctx.URL,
    headers: ctx.headers,
    body: ctx.request.body,
  };
  const serialized = JSON.stringify(incoming, null, 2);
  const now = new Date();
  const logFileName = path.join(
    config.tempFolderPath,
    `req-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.log`
  );
  fs.writeFileSync(logFileName, serialized);
}

router
  .get("/", (ctx, next) => {
    ctx.body = "hello world";
  })
  .post("/ntfy_alert", (ctx, next) => {
    logIncomingRequest(ctx);
    ctx.request.body.alerts.forEach((x) => {
      const tempAlertFilePathForJq = `tmp-alert.json`;
      fs.writeFileSync(tempAlertFilePathForJq, JSON.stringify(x), {});

      const topic = execSync(`jq -r "${ctx.query.topic}" ${tempAlertFilePathForJq}`);
      const title = execSync(`jq -r "${ctx.query.title}" ${tempAlertFilePathForJq}`);
      const priority = execSync(`jq -r "${ctx.query.priority}" ${tempAlertFilePathForJq}`);
      const data = {
        topic: cleanShellOutput(topic.toString()),
        title: cleanShellOutput(title.toString()),
        message: `${x.labels.job}
        ${x.labels.alertname}
        ${x.annotations.description}`,
        tags: [],
        priority: parseInt(priority.toString()),
      };
      console.log(`Sending to ${config.ntfyServer}...\n${JSON.stringify(data, null, 2)}`);
      axios.post(config.ntfyServer, data);
    });

    ctx.body = "tnx alertmanager";
  });

app.use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
