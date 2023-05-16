import { App } from "@slack/bolt";
import { FileInstallationStore } from "@slack/oauth";
import dotenv from "dotenv";
import { welcome } from "./blocks/welcome";

dotenv.config();

const database = new Map();

const app = new App({
  ...(process.env.ENVIRONMENT !== "prod" && {
    token: process.env.SLACK_BOT_TOKEN,
  }),
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
  installationStore:
    process.env.ENVIRONMENT !== "prod"
      ? new FileInstallationStore()
      : {
          storeInstallation: async (installation) => {
            // Bolt will pass your handler an installation object
            if (
              installation.isEnterpriseInstall &&
              installation.enterprise !== undefined
            ) {
              // handle storing org-wide app installation
              return await database.set(
                installation.enterprise.id,
                installation
              );
            }
            if (installation.team !== undefined) {
              // single team app installation
              return await database.set(installation.team.id, installation);
            }
            throw new Error(
              "Failed saving installation data to installationStore"
            );
          },
          fetchInstallation: async (installQuery) => {
            // Bolt will pass your handler an installQuery object
            if (
              installQuery.isEnterpriseInstall &&
              installQuery.enterpriseId !== undefined
            ) {
              // handle org wide app installation lookup
              return await database.get(installQuery.enterpriseId);
            }
            if (installQuery.teamId !== undefined) {
              // single team app installation lookup
              return await database.get(installQuery.teamId);
            }
            throw new Error("Failed fetching installation");
          },
          deleteInstallation: async (installQuery) => {
            // Bolt will pass your handler  an installQuery object
            if (
              installQuery.isEnterpriseInstall &&
              installQuery.enterpriseId !== undefined
            ) {
              // org wide app installation deletion
              return await database.delete(installQuery.enterpriseId);
            }
            if (installQuery.teamId !== undefined) {
              // single team app installation deletion
              return await database.delete(installQuery.teamId);
            }
            throw new Error("Failed to delete installation");
          },
        },
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

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
