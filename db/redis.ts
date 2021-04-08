import Redis from "ioredis";

let redis = new Redis();

const getRedis = () => {
  if (!redis) {
    redis = new Redis();
  }
  return redis;
};

export default getRedis;
