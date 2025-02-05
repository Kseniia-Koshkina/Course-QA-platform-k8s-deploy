import { connect } from "../deps.js";

const redis = await connect({
  hostname: "redis",
  port: 6379,
});

export const userBlockActions = async(userUuid) => {
  const exists = await redis.exists(userUuid);
  if (exists === 1) {
    return true;
  }
  return false;
}

export const setUserBlockActions = async(userUuid) => {
  const lastActivity = {
    lastActivity: new Date().toISOString()
  };
  await redis.set(userUuid, JSON.stringify(lastActivity), { ex: 60 });
  const todisplay = await redis.get(userUuid);
}