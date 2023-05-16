import { App } from "@slack/bolt";
import { FileInstallationStore } from "@slack/oauth";
import { LogLevel } from "@slack/logger";

import dotenv from "dotenv";
import { welcome } from "./blocks/welcome";
import { Redis } from "@upstash/redis/with-fetch";

dotenv.config();

// const database = new Redis({
//   url: process.env.REDIS_CONNECTION_URL!!,
//   token: process.env.REDIS_CONNECTION_TOKEN!!,
// });

const database: { [key: string]: any } = {};

// const database = {
//   set: async (key: string, data: any) => {
//     return databaseData[key] = data;
//   },
//   get: async (key: string) => {
//     return databaseData[key];
//   },
//   delete: async (key: string) => {
//     return delete databaseData[key];

//   },
// };

const app = new App({
  ...(process.env.ENVIRONMENT !== "prod" && {
    token: process.env.SLACK_BOT_TOKEN,
  }),
  logLevel: LogLevel.DEBUG,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    "channels:read",
    "channels:history",
    "channels:manage",
    "chat:write",
    "incoming-webhook",
  ],
  socketMode: true,
  installerOptions: {
    directInstall: true,
  },
  //@ts-ignore
  installationStore: new FileInstallationStore(),
});

// All the room in the world for your code

// Listens to incoming messages that contain "hello"
app.message("hello", async ({ message, say, context }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message, "message");
  await say(`Hey there!`);
});

/**

`app_home_opened` event is triggered when a user has entered into the App Home space (= Bot User DM)

https://api.slack.com/events/app_home_opened

We use this event to show the user an interactive welcome message once they open a DM with our App
for the first time

**/
app.event("app_home_opened", async ({ context, event, say }) => {
  if (event.tab === "messages") {
    // check the message history if there was a prior interaction for this App DM
    let history = await app.client.conversations.history({
      token: context.botToken,
      channel: event.channel,
      count: 1, // we only need to check if >=1 messages exist
    });

    // if there was no prior interaction (= 0 messages),
    // it's safe to send a welcome message
    if (!history?.messages?.length) {
      say(welcome);
    }
  }
});

const PORT = process.env.PORT || 3000;

(async () => {
  await app.start(PORT);
  console.log(`⚡️ Bolt app is running on port ${PORT}!`);
})();
