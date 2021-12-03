import axios from "axios";
import championsRaw from "./champions.json";
import {
  CurrentGameInfo,
  LeagueEntry,
  Participant,
  ParticipantIdentity,
  Summoner,
} from "./types";

const champions: { [key: string]: string } = championsRaw;

class Riot {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async fetch<T>(endpoint: string): Promise<T> {
    const req = await axios.get(`https://eun1.api.riotgames.com${endpoint}`, {
      headers: {
        "X-Riot-Token": this.apiKey,
      },
    });

    if (req.status !== 200) {
      throw new Error("Request failed");
    }

    return req.data;
  }

  getCurrentGame = (summonerId: string): Promise<CurrentGameInfo> =>
    this.fetch(`/lol/spectator/v4/active-games/by-summoner/${summonerId}`);

  getLeague = (summonerId: string): Promise<LeagueEntry[]> =>
    this.fetch(`/lol/league/v4/entries/by-summoner/${summonerId}`);

  summonerByName = (summonerName: string): Promise<Summoner> =>
    this.fetch(`/lol/summoner/v4/summoners/by-name/${summonerName}`);

  participantsInfoByName = async (
    summonerName: string
  ): Promise<ParticipantIdentity[]> => {
    const participants: ParticipantIdentity[] = [];

    const summoner = await this.summonerByName(summonerName);
    const currentGame = await this.getCurrentGame(summoner.id);

    for (let p of currentGame.participants) {
      const leagues = await this.getLeague(p.summonerId);
      const participant: ParticipantIdentity = {
        summonerId: p.summonerId,
        summonerName: p.summonerName,
        championName: champions[p.championId],
        ranks: {},
      };

      leagues.forEach((l) => {
        if (!l.rank || !l.tier) {
          return;
        }

        let rankNumber: string;

        switch (l.rank) {
          case "I":
            rankNumber = "1";
            break;
          case "II":
            rankNumber = "2";
            break;
          case "III":
            rankNumber = "3";
            break;
          case "IV":
            rankNumber = "4";
            break;
          default:
            rankNumber = "0";
        }

        const rank =
          l.tier[0] + l.tier.toLowerCase().substring(1) + " " + rankNumber;

        switch (l.queueType) {
          case "RANKED_SOLO_5x5":
            participant.ranks.solo = rank;
            break;
          case "RANKED_FLEX_SR":
            participant.ranks.flex = rank;
            break;
        }
      });
      participants.push(participant);
    }

    return participants;
  };
}

export default Riot;
