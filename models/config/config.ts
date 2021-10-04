import { CustomCryptoConfig } from "./custom_crypto"
import { NunjucksConfig } from "./nunjucks_config"
import { SessionConfig } from "./session_config"
import { RedisConfig } from "./redis_config"
import { MorganConfig } from "./morgan_config"


type Config = {
  cryptoConfig : CustomCryptoConfig,
  nunjucsConfig: NunjucksConfig,
  sessionConfig: SessionConfig,
  redisConfig: RedisConfig,
  morganConfig: MorganConfig,
  port : number,
}

export {
  Config
}
