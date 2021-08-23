import crypto from "crypto"
import util from "util"
import bcrypt from "bcrypt"
import errors from "./errors"

import { CustomCryptoConfig } from "../../models/config/custom_crypto"
import { URLObj } from "../../models/url_object"


const promisfyCryptoScrypt = <(password: crypto.BinaryLike, salt: crypto.BinaryLike, keylen: number) => Promise<any>> util.promisify(crypto.scrypt)

// let bcryptRounds = 10;
// let scryptRounds = 16384;


class CustomCrypto {
  bcryptRounds:number
  scryptRounds:number

  constructor(config: CustomCryptoConfig) {
    this.bcryptRounds = config.bcryptRounds;
    this.scryptRounds = config.scryptRounds;
  }

  async encrypt(url:string, password:string): Promise<URLObj> {
    if (!password || !url) {
      return new Promise((_resolve, reject) => {
        reject(errors.errParamMissing);
      });
    }

    try {
      let passwordHash = await bcrypt.hash(password, this.bcryptRounds);

      let pwdBuff = Buffer.from(password);

      let iv = crypto.randomBytes(16);
      let salt = crypto.randomBytes(16);

      let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, this.scryptRounds);

      let cipher = crypto.createCipheriv(algorithm, derivedKeyBuffer, iv);
      let encrypted = cipher.update(url, "utf8", "hex");
      encrypted += cipher.final("hex");

      return new Promise((resolve, _reject) => {
        resolve({
          iv: iv.toString("hex"),
          longURL: encrypted,
          salt: salt.toString("hex"),
          password: passwordHash,
        });
      });
    } catch (error) {
      return new Promise((_resolve, reject) => {
        reject(error);
      });
    }
  }

  async decrypt(urlData: URLObj, password:string): Promise<string> {
    if (!password || !urlData ||
      !urlData.iv || !urlData.salt || !urlData.longURL) {
      return new Promise((_resolve, reject) => {
        reject(errors.errParamMissing);
      });
    }

    if (typeof (urlData) != "object" ||
      typeof (urlData.iv) != "string" || typeof (urlData.salt) != "string" ||
      typeof (urlData.longURL) != "string") {
      return new Promise((_resolve, reject) => {
        reject(errors.errParamMissmatch);
      });
    }

    try {
      let pwdBuff = Buffer.from(password);

      let iv = Buffer.from(urlData.iv, "hex");
      let salt = Buffer.from(urlData.salt, "hex");

      let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, this.scryptRounds);

      let decipher = crypto.createDecipheriv(algorithm, derivedKeyBuffer, iv);
      let decrypted = decipher.update(urlData.longURL, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return new Promise((resolve, _reject) => {
        resolve(decrypted);
      });
    } catch (error) {
      return new Promise((_resolve, reject) => {
        reject(error);
      });
    }
  }
}

const algorithm = "aes-256-gcm"
