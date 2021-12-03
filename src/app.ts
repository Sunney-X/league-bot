import { Client, MessageEmbed } from "discord.js";
import Riot from "./riot";
import { config } from "dotenv";

config();

if (
  process.env.RIOT_API_KEY === undefined ||
  process.env.DISCORD_BOT_TOKEN === undefined
) {
  throw new Error("API key or Discord bot token not found");
}

console.log(process.env.RIOT_API_KEY);

const riot = new Riot(process.env.RIOT_API_KEY);

const client = new Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.on("ready", () => {
  console.log("Logging in...");
});

client.on("message", async (message) => {
  console.log("Received a message.");

  if (
    !message.content.startsWith("!check") ||
    !message.content.split("!check ").length
  ) {
    return;
  }

  const summonerName = message.content.split("!check ")[1];

  try {
    const participants = await riot.participantsInfoByName(summonerName);
    const embeds: MessageEmbed[] = [];

    const split = participants.length / 2;
    const firstHalf = participants.slice(0, split);
    const secondHalf = participants.slice(split);
    const participantsList = [firstHalf, secondHalf];

    participantsList.forEach((participants, index) => {
      const embed = new MessageEmbed();
      index ? embed.setColor(0xff0000) : embed.setColor("#0099ff");
      participants.forEach((participant) =>
        embed.addField(
          participant.championName,
          participant.ranks.solo || participant.ranks.flex || "Unranked",
          true
        )
      );
      embeds.push(embed);
    });

    await message.channel.send({ embeds });
  } catch (e: any) {
    if (e.status === 404) {
      message.channel.send(`Summoner ${summonerName} not found or not ingame`);
      message.react("😔");
    } else {
      message.react("❌");
    }

    console.error(e);
  }
});

client.on("error", console.error);

client.login(process.env.DISCORD_BOT_TOKEN);
