var crypto = require("crypto");
const util = require("util");
var bcrypt = require("bcrypt");

var errStrings = require("./errors");
var errErrors = {};
for (let err in errStrings) {
  if (errStrings.hasOwnProperty(err)) {
    errErrors[err] = Error(errStrings[err]);
  }
}

var promisfyCryptoScrypt = util.promisify(crypto.scrypt);

module.exports = function (config) {
  let bcryptRounds = 10;
  let scryptRounds = 16384;

  if (config) {
    bcryptRounds = config.bcryptRounds;
    scryptRounds = config.scryptRounds;
  }

  async function encrypt(url, password) {
    if (!password || !url) {
      return new Promise((_resolve, reject) => {
        reject(errErrors.errParamMissing);
      });
    }

    if (typeof (password) != "string" || typeof (url) != "string") {
      return new Promise((_resolve, reject) => {
        reject(errErrors.errParamMissmatch);
      });
    }

    try {
      let passwordHash = await bcrypt.hash(password, bcryptRounds);

      let pwdBuff = Buffer.from(password);

      let iv = crypto.randomBytes(16);
      let salt = crypto.randomBytes(16);

      let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32, { cost: scryptRounds });

      let cipher = crypto.createCipheriv("aes-256-cbc", derivedKeyBuffer, iv);
      let encrypted = cipher.update(url, "utf8", "hex");
      encrypted += cipher.final("hex");

      return new Promise((resolve, _reject) => {
        resolve({
          iv: iv.toString("hex"),
          longURL: encrypted.toString("hex"),
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

  async function decrypt(urlData, password) {
    if (!password || !urlData ||
      !urlData.iv || !urlData.salt || !urlData.longURL) {
      return new Promise((_resolve, reject) => {
        reject(errErrors.errParamMissing);
      });
    }

    if (typeof (password) != "string" || typeof (urlData) != "object" ||
      typeof (urlData.iv) != "string" || typeof (urlData.salt) != "string" ||
      typeof (urlData.longURL) != "string") {
      return new Promise((_resolve, reject) => {
        reject(errErrors.errParamMissmatch);
      });
    }

    try {
      let pwdBuff = Buffer.from(password);

      let iv = Buffer.from(urlData.iv, "hex");
      let salt = Buffer.from(urlData.salt, "hex");

      let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32, { cost: scryptRounds });

      let decipher = crypto.createDecipheriv("aes-256-cbc", derivedKeyBuffer, iv);
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

  return {
    decrypt: decrypt,
    encrypt: encrypt,
  };
};
