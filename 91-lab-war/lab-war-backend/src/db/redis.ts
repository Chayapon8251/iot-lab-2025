import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: +(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
});

export default redis;

// Incremental with limit

const incrementalScript = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    local increment = tonumber(ARGV[1])
    local max = tonumber(ARGV[2])
    if current + increment > max then
        redis.call("SET", KEYS[1], max)
        return max
    else
        local new = current + increment
        redis.call("SET", KEYS[1], new)
        return new
    end
`;

async function incrementWithLimit(key: string, increment: number, max: number) {
  const result = await redis.eval(incrementalScript, 1, key, increment, max);
  return result;
}

// Decremental with limit

const decrementalScript = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    local decrement = tonumber(ARGV[1])
    local min = tonumber(ARGV[2])
    if current - decrement < min then
        redis.call("SET", KEYS[1], min)
        return min
    else
        local new = current - decrement
        redis.call("SET", KEYS[1], new)
        return new
    end
`;

async function decrementWithLimit(key: string, decrement: number, min: number) {
  const result = await redis.eval(decrementalScript, 1, key, decrement, min);
  return result;
}

export { incrementWithLimit, decrementWithLimit };
