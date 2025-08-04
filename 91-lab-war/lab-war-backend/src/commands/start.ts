import redis from "../db/redis";

async function start() {
  await redis.set("game-started", "true");
  await redis.set("game-need-update", "true");

  console.log(`[Start] Game started`);
  process.exit(0);
}

start();
