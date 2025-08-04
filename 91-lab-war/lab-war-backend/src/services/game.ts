import redis from "../db/redis";
import { DEFAULT_MAX_HEALTH } from "../lib/gameVar";

export interface TeamData {
  name: string;
  health: number;
  maxHealth: number;
  active: boolean;
}

// Key: teams
export const defaultTeamData: TeamData[] = [
  {
    name: "A",
    health: DEFAULT_MAX_HEALTH,
    maxHealth: DEFAULT_MAX_HEALTH,
    active: true,
  },
  {
    name: "B",
    health: DEFAULT_MAX_HEALTH,
    maxHealth: DEFAULT_MAX_HEALTH,
    active: true,
  },
  {
    name: "C",
    health: DEFAULT_MAX_HEALTH,
    maxHealth: DEFAULT_MAX_HEALTH,
    active: true,
  },
  {
    name: "D",
    health: DEFAULT_MAX_HEALTH,
    maxHealth: DEFAULT_MAX_HEALTH,
    active: true,
  },
];
// NOTE: Redis Key: game-need-update => boolean
// NOTE: Redis Key: team-{TEAM}-health => number
// NOTE: Redis Key: team-{TEAM}-maxHealth => number
// NOTE: Redis Key: team-{TEAM}-active => boolean

export const getTeamsData = async () => {
  const teams = await redis.get("teams");
  if (!teams) {
    await redis.set("teams", JSON.stringify(defaultTeamData));
    return defaultTeamData;
  }
  return JSON.parse(teams);
};
