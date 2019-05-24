var bcrypt = require("bcryptjs");
jest.mock("bcryptjs");

describe("customCrypto.js", function () {

	describe("decrypt", function () {

		var customCrypto = require("../../libs/customCrypto");

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
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = [{
					"salt": "asd",
					"iv": "asd",
					"longURL": "asd",
				}];
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("One field", async () => {
				let args = [undefined, "password"];
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "",
					"salt": "asd",
					"longURL": "asd",
				}, "password"];
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "asd",
					"salt": "",
					"longURL": "asd",
				}, "password"];
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
			});

			test("Keys in urlData", async () => {
				let args = [{
					"iv": "asd",
					"salt": "asd",
					"longURL": "",
				}, "password"];
				await expect(customCrypto.decrypt(...args)).rejects.toMatch("Critical: Missing Fields");
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
				let x = customCrypto.decrypt(...args);
				x.catch((_e) => {});
				expect(bufferCreationMock).toBeCalled();
				Buffer.from = beforeMock;
			});

		});

	});

	describe("decrypt", function () {

		var customCrypto = require("../../libs/customCrypto");

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
				var customCrypto2 = require("../../libs/customCrypto");
				let args = ["will_not_throw", "will_not_throw"];
				customCrypto2.encrypt(...args);
				expect(bcrypt.hash).toBeCalled();
				jest.unmock("bcryptjs");
			});

		});

	});
});