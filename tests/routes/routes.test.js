// eslint-disable-next-line no-unused-vars
var should = require("should");

const testConfig = require("../config-test");
const app = require("../../src/app")(testConfig);

const request = require("supertest");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
var jQuery = require("jquery")(window);

describe("POST /shorten", function () {

  // it('with no csrf token', function (done) {
  //   request(app)
  //     .post('/shorten')
  //     //.set('Accept', 'application/json')
  //     //.expect('Content-Type', /json/)
  //     .expect(403, done);
  // });

  describe("with csrf token", function () {

    let token;
    let cookies;

    beforeEach((done) => {
      request(app).get("/").end((_err, res) => {
        cookies = res.headers["set-cookie"];

        let $html = jQuery(res.text);
        token = $html.find("input[name=_csrf]").val();

        done();
      });
    });

    it("should redirect if no url", function (done) {
      request(app)
        .post("/shorten")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
        }).expect(function (res) {
          res.text.should.match(/\/new\?invalid=true/);
        }).expect(302, done);
    });

    it("should redirect if url is bad", function (done) {
      request(app)
        .post("/shorten")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          url: "https://com"
        })
        .expect(function (res) {
          res.text.should.match(/\/new\?invalid=true/);
        }).expect(302, done);
    });

    it("should not post just a name2", function (done) {
      request(app)
        .post("/shorten")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          url: "https://www.google.com",
        })
        .expect(function (res) {
          //console.log(res);
          //console.log(res.text);
        }).expect(200, done);
    });

    it("should not post just a name2", function (done) {
      request(app)
        .post("/shorten")
        .type("form")
        .set("Cookie", cookies)
        .send({
          _csrf: token,
          url: "https://www.google.com",
          password: "asdasd"
        })
        .expect(function (res) {
          //console.log(res);
          //console.log(res.text);
        }).expect(200, done);
    });

    

  });

});
