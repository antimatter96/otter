import { CustomCryptoConfig } from "./custom_crypto"
import { NunjucksConfig } from "./nunjucks_config"
import { SessionConfig } from "./session_config"


type Config = {
  cryptoConfig : CustomCryptoConfig,
  nunjucsConfig: NunjucksConfig,
  sessionConfig: SessionConfig,
  port : number,
}

export {
  Config
}
