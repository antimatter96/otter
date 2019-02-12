var customCrypto = require("../../libs/customCrypto");

describe("customCrypto.js", function () {

	describe("decrypt", function () {

		beforeEach(() => {

		});

		describe("Throws error on missing fields main", function () {

			test("Both fields", async () => {
				await expect(customCrypto.decrypt()).rejects.toMatch("Critical: Missing Fields");
			});

		});

	});

	describe("decrypt", function () {

		beforeEach(() => {

		});

		describe("Throws error on missing fields main", function () {

			
			test("Both fields", async () => {
				await expect(customCrypto.encrypt()).rejects.toMatch("Critical: Missing Fields");
			});

		});

	});
});