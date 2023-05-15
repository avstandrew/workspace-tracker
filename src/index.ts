import { App } from "@slack/bolt";
import dotenv from "dotenv";
import { welcome } from "./blocks/welcome";

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true, // add this
  appToken: process.env.SLACK_APP_TOKEN, // add this,
});

// All the room in the world for your code

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message, 'message')
  await say(`Hey there!`);
});

/**

`app_home_opened` event is triggered when a user has entered into the App Home space (= Bot User DM)

https://api.slack.com/events/app_home_opened

We use this event to show the user an interactive welcome message once they open a DM with our App
for the first time

**/
app.event("app_home_opened", async ({ context, event, say }) => {
  console.log(event, 'event')
  console.log(context, "context");
  if (event.tab === "messages") {
    // check the message history if there was a prior interaction for this App DM
    let history = await app.client.conversations.history({
      token: context.botToken,
      channel: event.channel,
      count: 1 // we only need to check if >=1 messages exist
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