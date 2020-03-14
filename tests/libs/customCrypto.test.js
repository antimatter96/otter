// eslint-disable-next-line no-unused-vars
var should = require("should");
//var sinon = require('sinon');

var customCrypto = require("../../src/libs/customCrypto")({ bcryptRounds: 1, scryptRounds: 2 });
var errStrings = require("../../src/libs/errors");

// afterEach(function () {
//   // Restore the default sandbox here
//   sinon.restore();
// });

describe("encrypt", function () {
  describe("Params Checks", function () {
    describe("missing params", function () {

      context("rejects", function () {
        it("all missing params", function () {
          return customCrypto.encrypt().should.be.rejectedWith(errStrings.errParamMissing);
        });
        it("url missing", function () {
          return customCrypto.encrypt(null, "password").should.be.rejectedWith(errStrings.errParamMissing);
        });
        it("password params", function () {
          return customCrypto.encrypt("url", null).should.be.rejectedWith(errStrings.errParamMissing);
        });
      });

      context("accepts", function () {
        it("none missing", function () {
          return customCrypto.encrypt("url", "password").should.be.resolved();
        });
      });

    });

    describe("type mismatch params", function () {

      context("rejects", function () {
        it("url type mismatch", function () {
          return customCrypto.encrypt({}, "password").should.be.rejectedWith(errStrings.errParamMissmatch);
        });
        it("password type mismatch", function () {
          return customCrypto.encrypt("url", {}).should.be.rejectedWith(errStrings.errParamMissmatch);
        });
      });

      context("accepts", function () {
        it("none missing", function () {
          return customCrypto.encrypt("url", "password").should.be.resolved();
        });
      });

    });

  });
});

describe("decrypt", function () {
  describe("Params Checks", function () {
    let urlData = sampleURLData();
    this.beforeEach(function () {
      urlData = sampleURLData();
    });
    describe("missing params", function () {

      context("rejects", function () {
        it("all missing params", function () {
          return customCrypto.decrypt().should.be.rejected();
        });
        it("urlData missing", function () {
          return customCrypto.decrypt(null, "password").should.be.rejected();
        });
        it("password missing", function () {

          return customCrypto.decrypt(urlData, null).should.be.rejected();
        });
        context("urlData present", function () {
          it("iv missing", function () {
            delete urlData.iv;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith(errStrings.errParamMissing);
          });
          it("salt missing", function () {
            delete urlData.salt;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith(errStrings.errParamMissing);
          });
          it("password missing", function () {
            delete urlData.longURL;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith(errStrings.errParamMissing);
          });
        });

        context("type mismatch", function () {
          it("password missing", function () {
            return customCrypto.decrypt(urlData, {}).should.be.rejectedWith(errStrings.errParamMissmatch);
          });
          it("urlData missing", function () {
            delete urlData.salt;
            return customCrypto.decrypt("urlData", "password").should.be.rejectedWith(errStrings.errParamMissing);
          });
          it("password missing", function () {
            delete urlData.longURL;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith(errStrings.errParamMissing);
          });
        });
      });

      context("accepts", function () {
        it("none missing", function () {
          return customCrypto.decrypt(urlData, "password").should.be.resolved();
        });
      });

    });

  });
});

describe("both", function () {
  describe("bcrypt and scrypt params wrong", function () {
    context("rejects", function () {
      context("encrypt", function () {
        it("wrong bcrypt", function () {
          customCrypto = require("../../src/libs/customCrypto")({ bcryptRounds: "number", scryptRounds: 2 });
          return customCrypto.encrypt("urlData", "password").should.be.rejectedWith(/Invalid/);
        });
        it("wrong scrypt", function () {
          customCrypto = require("../../src/libs/customCrypto")({ bcryptRounds: 1, scryptRounds: 333 });
          return customCrypto.encrypt("urlData", "password").should.be.rejectedWith("Invalid scrypt parameter");
        });
      });
      context("decrypt", function () {
        let urlData = sampleURLData();
        // decrypt does not matter on bcrypt rounds
        it("wrong bcrypt PASSES", function () {
          customCrypto = require("../../src/libs/customCrypto")({ bcryptRounds: "number", scryptRounds: 2 });
          return customCrypto.decrypt(urlData, "password").should.be.resolved();
        });
        it("wrong scrypt", function () {
          customCrypto = require("../../src/libs/customCrypto")({ bcryptRounds: 1, scryptRounds: 77 });
          return customCrypto.decrypt(urlData, "password").should.be.rejectedWith("Invalid scrypt parameter");
        });
      });
    });
  });
});

function sampleURLData() {
  return {
    iv: "49d31b0d07a1145fc22df3168110572b",
    longURL: "24b0032fb7541d35b585bfc24d8e5b8e",
    salt: "1ddb76208f7d2db188e242322de7f0d8",
    password: "$2b$04$BWcUP5yqUZ7wKrx0IKFPKesuQ8ZAa7Nwz2ED1Zyr2Ne29fkT2LEEm",
  };
}
