var crypto = require("crypto");
const util = require("util");
var bcrypt = require("bcryptjs");

var promisfyCryptoScrypt = util.promisify(crypto.scrypt);

async function decrypt(urlData, password) {
	if (!password || !urlData ||
		!urlData.iv || !urlData.salt || !urlData.longURL) {
		return new Promise((resolve, reject) => {
			reject("Critical: Missing Fields");
		});
	}

	try {
		let pwdBuff = Buffer.from(password);

		let iv = Buffer.from(urlData.iv, "hex");
		let salt = Buffer.from(urlData.salt, "hex");

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32);

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

async function encrypt(url, password) {
	if (!password || !url) {
		return new Promise((resolve, reject) => {
			reject("Critical: Missing Fields");
		});
	}

	try {
		let passwordHash = await bcrypt.hash(password, 10);

		let pwdBuff = Buffer.from(password);

		let iv = crypto.randomBytes(16);
		let salt = crypto.randomBytes(12);

		let derivedKeyBuffer = await promisfyCryptoScrypt(pwdBuff, salt, 32);

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

module.exports = {
	decrypt: decrypt,
	encrypt: encrypt,
};