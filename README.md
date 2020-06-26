# otter

[![Known Vulnerabilities](https://snyk.io/test/github/antimatter96/otter/badge.svg)](https://snyk.io/test/github/antimatter96/otter)


### Otter URL shortner
#### Ability to shorten with passwords and also get the QR code for the link

---

## Stack
- Nodejs
- Express.js
- Redis

## Basic Functioning
- User enters URL to shorten
- Create random string of length 6 consisting of [a-z A-z 0-9]
-> Check in redis if this string exists. If it does then append extra 3 characters
- Save in redis
- Redirect user to page with shortened link and generate QR code using [kjua QR code generator](https://github.com/lrsjng/kjua)

## V1

- The first version lacked support for passwords
- Data was stored as key-value  :   ` SET shortURl longUrl `

## V2

- Password support was added
- Minimum length of passwords is 4
- ~~`bcrypt`~~ `bcryptjs` is used to generate the password's hash (salt is also added using ~~`bcrypt`~~ `bcryptjs`)
- The url is stored in plaintext while the password's hash is stored
- Data was stored using redis hashes (string field to string value mapping) : 
``HMSET shortUrl url longUrl pwd passwordHash``
- If password is not opted for then a `"no"` is saved instead of `"passwordHash"`

## V3

- The longUrl is encrypted using symetric-key ("AES-192-CTR") with the password as the key . If the password matches the one in redis then the longUrl will be decrypted using it .This ensures that longUrl are not visible even to db admins.
- CSRF is implemented
- Basic limiting on number of password attempts is introduced
- Improved error handling and error codes

 ~~Need to Add nonce to AES~~

## Upcoming

~~Passing password in URL will be removed, Password would have to be entered in seperate page~~
Done

Other features to be added :
- Protection : Based on OWASP guidelines
- Basic rate limiting
- Compression
- Caching

---

# LICENSE

### [GPL](https://www.gnu.org/licenses/gpl-3.0.txt)
