

describe("customCrypto.js", function () {

	beforeEach(() => {
		jest.resetModules();
	});

	describe("decrypt", function () {
		var customCryptoD = require("../../src/libs/customCrypto");

		beforeEach(() => {
			jest.clearAllMocks();
		});
		afterEach(() => {
			jest.clearAllMocks();
		});

		describe("Throws error on missing fields main", function () {

			beforeEach(() => {
				jest.clearAllMocks();
			});
			afterEach(() => {
				jest.clearAllMocks();
			});

			test("Both fields", async () => {
				let args = [];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = [{
					"salt": "asd",
					"iv": "asd",
					"longURL": "asd",
				}];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = [undefined, "password"];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "",
					"salt": "asd",
					"longURL": "asd",
				}, "password"];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "asd",
					"salt": "",
					"longURL": "asd",
				}, "password"];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "asd",
					"salt": "asd",
					"longURL": "",
				}, "password"];
				await expect(customCryptoD.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Does not throw ", async () => {
				let bufferCreationMock = jest.fn();
				let beforeMock = Buffer.from;
				let customMocker = function (z) {
					if (z == "will_not_throw") {
						bufferCreationMock();
					} else {
						return beforeMock(z);
					}
				};
				Buffer.from = customMocker;
				let args = [{
					"longURL": "will_not_throw",
					"salt": "will_not_throw",
					"iv": "will_not_throw",
				}, "will_not_throw"];
				let x = customCryptoD.decrypt(...args);
				x.catch((_e) => {});
				expect(bufferCreationMock).toBeCalled();
				Buffer.from = beforeMock;
			});

		});

		describe("Throws error on malformed fields", function () {

			beforeEach(() => {
				jest.clearAllMocks();
			});
			afterEach(() => {
				jest.clearAllMocks();
			});

			test("Invalid IV Length", async () => {
				let args = [{
					"longURL": "will_not_throw",
					"salt": "will_not_throw",
					"iv": "__TOO_SMALL__",
				}, "will_not_throw"];
				await expect(customCryptoD.decrypt(...args)).rejects.toHaveProperty("message", "Invalid IV length");
			});

		});

		describe("Works", function () {

			var longURLEncrypted, salt, iv;
			var longURL = "www.url.com";
			var password = "this_is_a_password";
			beforeEach(async () => {
				let args = [longURL, password];
				let x = await customCryptoD.encrypt(...args);
				iv = x.iv;
				salt = x.salt;
				longURLEncrypted = x.longURL;
				jest.clearAllMocks();
			});
			afterEach(() => {
				jest.clearAllMocks();
			});

			test("Invalid IV Length", async () => {
				let args = [{
					"longURL": longURLEncrypted,
					"salt": salt,
					"iv": iv,
				}, password];
				await expect(customCryptoD.decrypt(...args)).resolves.toBe(longURL);
			});

		});

	});

	describe("encrypt", function () {

		var customCrypto = require("../../src/libs/customCrypto");

		beforeEach(() => {
			jest.clearAllMocks();
		});
		afterEach(() => {
			jest.clearAllMocks();
		});

		describe("Throws error on missing fields main", function () {

			beforeEach(() => {
				jest.clearAllMocks();
			});
			afterEach(() => {
				jest.clearAllMocks();
			});

			test("Both fields", async () => {
				let args = [];
				await expect(customCrypto.encrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = ["url", undefined];
				await expect(customCrypto.encrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = [undefined, "pwd"];
				await expect(customCrypto.encrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Does not throw", async () => {
				jest.doMock("bcryptjs", () => {
					return { hash: jest.fn(() => 1) };
				});
				var customCryptoE = require("../../src/libs/customCrypto");
				var bcrypt = require("bcryptjs");
				let args = ["will_not_throw", "will_not_throw"];
				customCryptoE.encrypt(...args);
				expect(bcrypt.hash).toBeCalled();
				jest.dontMock("bcryptjs");
			});

		});

	});
});