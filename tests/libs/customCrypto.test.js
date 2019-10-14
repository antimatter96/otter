// eslint-disable-next-line no-unused-vars
var should = require('should');
var sinon = require('sinon');

var customCrypto = require("../../src/libs/customCrypto")({bcryptRounds : 1, scryptRounds : 2 });

afterEach(function() {
  // Restore the default sandbox here
  sinon.restore();
});

describe('encrypt', function () {
  describe('Params Checks', function () {
    describe('missing params', function () {

      context('rejects', function () {
        it('all missing params', function () {
          return customCrypto.encrypt().should.be.rejected();
        });
        it('url missing', function () {
          return customCrypto.encrypt(null, "password").should.be.rejected();
        });
        it('on password params', function () {
          return customCrypto.encrypt("url", null).should.be.rejected();
        });

        it('', function() {
          return customCrypto.encrypt("urlData", "password").should.be.resolved().then(function(error) {
            error.should.not.have.property("message", "Critical: Missing Fields");
          });
        });
      });

    });

  });
});

describe('decrypt', function () {
  describe('Params Checks', function () {
    describe('missing params', function () {

      context('rejects', function () {
        it('all missing params', function () {
          return customCrypto.decrypt().should.be.rejected();
        });
        it('urlData missing', function () {
          return customCrypto.decrypt(null, "password").should.be.rejected();
        });
        it('on password missing', function () {
          let urlData = {
            iv : "someiv",
            salt: "somesalt",
            longURL: "somelongURL",
          };
          return customCrypto.decrypt(urlData, null).should.be.rejected();
        });
        context("urlData has iv, salt, longURL", function() {
          let urlData;
          this.beforeEach(function() {
            urlData = {
              iv : "someiv",
              salt: "somesalt",
              longURL: "somelongURL",
            };
          });
          it('', function() {
            delete urlData.iv;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith("Critical: Missing Fields");
          });
          it('', function() {
            delete urlData.salt;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith("Critical: Missing Fields");
          });
          it('', function() {
            delete urlData.longURL;
            return customCrypto.decrypt(urlData, "password").should.be.rejectedWith("Critical: Missing Fields");
          });
          it('', function() {
            return customCrypto.decrypt(urlData, "password").should.be.rejected().then(function(error) {
              error.should.not.have.property("message", "Critical: Missing Fields");
            });
          });
        });
      });

    });

  });
});
