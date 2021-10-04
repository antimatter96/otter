import ioredis from "ioredis"

interface RedisConfig extends ioredis.RedisOptions  {
  password?: string,
  type?: string,
}

export {
  RedisConfig
}
