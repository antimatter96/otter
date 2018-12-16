// var express = require('express');
// var csrf = require('csurf');

// var dbQueries = require('../db/queries');
// var config = require('../config');
// var dbErrors = require('../db/errors');

// var utils = require('./utils');
// var userRouter = require('./users');

// var router = express.Router();

// var csrfProtection = csrf({
// 	cookie: false
// });

// var formTamperedWithError = "Form Tampered With (- _ -)";

// //===============

// function ensureLoggedIn(req, res, next) {
// 	if (req.session && req.session.userid) {
// 		next();
// 	} else {
// 		res.redirect('/login?authNeeded=true');
// 	}
// }

// router.use('/users/', userRouter);

// router.get('/', ensureLoggedIn, csrfProtection, mainGet);
// //router.get('/feed', ensureLoggedIn, csrfProtection, feedGet);
// router.get('/feed', ensureLoggedIn, csrfProtection, feedNew);
// router.get('/feed2', ensureLoggedIn, csrfProtection, feedNew2);

// router.get('/share', csrfProtection, ensureLoggedIn, shareGet);
// router.post('/share', csrfProtection, ensureLoggedIn, sharePost);

// router.get('/story/:storyid', ensureLoggedIn , csrfProtection, storyGet);

// router.post('/story/rate/:storyid', ensureLoggedIn, csrfProtection, crowdRatePost);

// router.post('/story/like/:storyid', ensureLoggedIn, csrfProtection, crowdRateLikePost);

// router.get('/admin/getAgg/:storyid', csrfProtection, dummy);
// router.get('/story/:storyid/updateAgg', csrfProtection, dummy);

// //=========

// function mainGet(req, res) {
// 	if (req.session && req.session.userid) {
// 		res.redirect('/feed');
// 	} else {
// 		let afterSignup = req.query.afterSignup || false;
// 		res.render('index.njk', {
// 			csrfToken: req.csrfToken(),
// 			afterSignup: afterSignup
// 		});
// 	}
// }

// async function shareGet(req, res) {
// 	res.render('share.njk', {
// 		csrfToken: req.csrfToken()
// 	});
// }

// async function sharePost(req, res) {
// 	if (!req.body.storytext || !req.body.storytitle || !req.body.storytextjson) {
// 		res.render('share.njk', {
// 			error: formTamperedWithError,
// 			csrfToken: req.csrfToken()
// 		});
// 		return
// 	}
// 	let storyText = req.body.storytext;
// 	let storyTextJson = JSON.parse(req.body.storytextjson);
// 	try {
// 		let rows = await dbQueries.saveStory(req.session.userid, storyText, storyTextJson, req.body.storytitle);
// 		let storyid = rows[0];
// 		try {
// 			console.log(client, client.analyze)
// 			let watsonResult = await clientanalyze(storyText);
// 			let watsonRes = JSON.parse(watsonResult.text);
// 			try {
// 				let rows2 = await dbQueries.setEmotion(storyid, watsonRes.document_tone.tones);
// 				res.redirect('/story/' + storyid);
// 			} catch (err) {
// 				console.error("FAILED TO SAVE EMOTION TO DB", err);
// 				res.redirect('/story/' + storyid + '?error=analysis_db_save_failed');
// 			}
// 		} catch (err) {
// 			console.error("FAILED TO GET EMOTION FROM SERVER", err);
// 			res.redirect('/story/' + storyid + '?error=analysis_failed');
// 		}
// 	} catch (err) {
// 		console.error("FAILED TO SAVE STORY TO DB", err);
// 		res.status(500).send({
// 			error: 500
// 		});
// 	}
// }

// async function storyGet(req, res) {
// 	let storyid = req.params.storyid;
// 	try {
// 		let rows = await dbQueries.getStory(req.params.storyid);
// 		if (rows.length != 0) {
// 			let userid = req.session.userid;
// 			let rated = false;
// 			let liked = false;
// 			try {
// 				if (userid) {
// 					let rowsIfCheckRated = await dbQueries.checkIfRated(storyid, userid);
// 					console.log(rowsIfCheckRated, rowsIfCheckRated.length);
// 					if (rowsIfCheckRated.length > 0) {
// 						if (rowsIfCheckRated[0].emo) {
// 							rated = true;
// 						}
// 						if (rowsIfCheckRated[0].likes === true || rowsIfCheckRated[0].likes === false) {
// 							liked = rowsIfCheckRated[0].likes + '_';
// 						} else {
// 							liked = "not";
// 						}
// 					}
// 				}
// 			} catch (err) {
// 				console.error("FAILED TO CHECK IF STORY RATED BY USER", err);
// 			} finally {
// 				let template_data = {
// 					story_text: rows[0].text,
// 					by: rows[0].email,
// 					title: rows[0].title,
// 					emo: rows[0].emo,
// 					emoAgg: rows[0]['emoavg'],
// 					storyid: storyid,
// 					userid: userid,
// 					rated: rated,
// 					liked: liked,
// 					csrfToken: req.csrfToken()
// 				}

// 				if (!rows[0].text_json) {
// 					template_data.story_text = rows[0].text;

// 				} else {
// 					template_data.story = utils.changeToBase64(rows[0].text_json);
// 				}
// 				//console.log(template_data);
// 				res.render('stories.njk', template_data);
// 			}
// 		} else {
// 			res.render('stories.njk', {
// 				error: "No story ",
// 				csrfToken: req.csrfToken()
// 			});
// 		}
// 	} catch (err) {
// 		console.error("FAILED TO GET STORY", err);
// 		res.status(500).send({
// 			error: 500
// 		});
// 	}
// }

// async function crowdRatePost(req, res) {
// 	let storyid = req.params.storyid;
// 	let userid = req.session.userid;
// 	let dataToPut = {};

// 	for (let i in emotions) {
// 		let inputName = 'crowddata-' + emotions[i];
// 		dataToPut[emotions[i]] = req.body[inputName];
// 	}

// 	try {
// 		let rowsIfCheckRated = await dbQueries.checkIfRated(storyid, userid);
// 		if (rowsIfCheckRated.length > 0) {
// 			try {
// 				let result = await dbQueries.crowdRateUpdate(storyid, userid, dataToPut);
// 				console.log(result);
// 				res.redirect('/story/' + storyid + '/updateAgg?afterRating=true');
// 				//res.sendStatus(200);
// 			} catch (err) {
// 				console.log(err);
// 				res.sendStatus(500);
// 			}
// 		} else {
// 			//INSERT
// 			try {
// 				let result = await dbQueries.crowdRateInsert(storyid, userid, dataToPut);
// 				console.log(result);
// 				res.redirect('/story/' + storyid + '/updateAgg?afterRating=true');
// 				//res.sendStatus(200);
// 			} catch (err) {
// 				console.log(err);
// 				res.sendStatus(500);
// 			}
// 		}
// 	} catch (err) {
// 		if (dbErrors.get('crowdrate').has(err.code)) {
// 			// NOT ACTAULLY AN ERROR, USER HAD ALREADY RATED
// 			res.redirect('/story/' + storyid + '?ratingerror=' + dbErrors.get('crowdrate').get(err.code));
// 		} else {
// 			console.error("FAILED TO SAVE USER RATING TO DB", err);
// 			res.status(500).send({
// 				error: 500
// 			});
// 		}
// 	}
// }

// async function crowdRateLikePost(req, res) {
// 	let storyid = req.params.storyid;
// 	if (req.query.action != "like" && req.query.action != "dislike") {
// 		res.sendStatus(400);
// 		return;
// 	}

// 	let action = req.query.action == "dislike" ? false : true;
// 	let userid = req.session.userid;

// 	try {
// 		let rowsIfCheckRated = await dbQueries.checkIfRated(storyid, userid);
// 		if (rowsIfCheckRated.length > 0) {
// 			//console.log(rowsIfCheckRated);
// 			if (rowsIfCheckRated[0].likes === true || rowsIfCheckRated[0].likes === false) {
// 				if (rowsIfCheckRated[0].likes === action) {
// 					res.sendStatus(200);
// 					return;
// 				}
// 			}
// 			try {
// 				let result = await dbQueries.crowdRateLikeUpdate(storyid, userid, action);
// 				res.sendStatus(200);
// 			} catch (err) {
// 				console.log(err);
// 				res.sendStatus(500);
// 			}
// 		} else {
// 			//INSERT
// 			try {
// 				let result = await dbQueries.crowdRateLikeInsert(storyid, userid, action);
// 				res.sendStatus(200);
// 			} catch (err) {
// 				console.log(err);
// 				res.sendStatus(500);
// 			}
// 		}
// 	} catch (err) {
// 		console.error("FAILED TO SAVE USER RATING TO DB", err);
// 		res.status(500).send({
// 			error: 500
// 		});
// 	}
// }

// async function dummy(req, res) {
// 	let storyid = req.params.storyid;

// 	try {
// 		let rows = await dbQueries.getCrowdRating(storyid);
// 		var x = {};
// 		for (let i in emotions) {
// 			x[emotions[i]] = 0;
// 		}
// 		let cnt = rows.length;
// 		for (let i of rows) {
// 			if(!i){
// 				cnt--;
// 				continue;
// 			}
// 			let y = i.emo;
// 			if(!y){
// 				cnt--;
// 				continue;
// 			}
// 			for (let z in emotions) {
// 				if(y && y[emotions[z]]){
// 					x[emotions[z]] += parseFloat(y[emotions[z]]);
// 				}
// 			}
// 		}
// 		console.log(x);
// 		for (let i in emotions) {
// 			x[emotions[i]] /= cnt;
// 			x[emotions[i]] /= 10;
// 		}
// 		try {
// 			let noErrors = false;
// 			let rows2 = await dbQueries.checkCrowdAggPresent(storyid);
// 			try {
// 				if (rows2[0].count == 0) {
// 					let resultSet = await dbQueries.setCrowdAgg(storyid, x);
// 				} else {
// 					let resultSet = await dbQueries.updateCrowdAgg(storyid, x);
// 				}
// 				noErrors = true;
// 			} catch (err) {
// 				console.error("FAILED TO SAVE AGG EMOTION TO DB", err);
// 				res.status(500).send({
// 					error: 500
// 				});
// 			}
// 			if (noErrors) {
// 				if (req.query.afterRating === "true") {
// 					res.redirect('/story/' + storyid + '?rated=true');
// 				} else {
// 					res.send(200);
// 				}
// 			}
// 		} catch (err) {
// 			console.error("FAILED TO GET AGG RATING", err);
// 			res.status(500).send({
// 				error: 500
// 			});
// 		}
// 	} catch (err) {
// 		console.error("FAILED TO GET CROWD RATING", err);
// 		res.status(500).send({
// 			error: 500
// 		});
// 	}
// }

// /*
// async function feedGet(req, res) {
// 	let userid = req.session.userid;
// 	try {
// 		let rows = await dbQueries.feedBasic(userid);
// 		let stories_json = new Array();
// 		//console.log(rows);

// 		for (let i of rows) {
// 			if (i.likes === true || i.likes === false) {
// 				i.likes = i.likes + '_';
// 			} else {
// 				i.likes = "not";
// 			}
// 			let temp = { id: i._id };
// 			if(i.text_json){
// 				temp.json = utils.changeToBase64(i.text_json);
// 			}
// 			stories_json.push(temp);
// 		}
// 		res.render('feed.njk', { stories: rows, stories_json: stories_json, csrfToken: req.csrfToken() });
// 	} catch (err) {
// 		console.log(err);
// 		res.status(500);
// 	}
// }
// */

// async function feedNew(req,res){
// 	let userid = req.session.userid;
// 	console.log(userid);
// 	if( req.session.visits > 5){
// 		try {
// 			let feedRec = await clientgetFeed(userid)
// 			//console.log(feedRec)
// 			let sIds = feedRec['storyids'];
// 			let uIds = feedRec['userids'];
// 			//console.log(sIds,uIds);
// 			sIds = sIds.split(',')
// 			uIds = uIds.split(',')
// 			//console.log(sIds,uIds);

// 			let rows = await dbQueries.getStories(sIds,userid);
// 			let w = await dbQueries.getEmailsOfUsers(uIds);

// 			let stories_json = new Array();
// 			//console.log(rows);

// 			for (let i of rows) {
// 				if (i.likes === true || i.likes === false) {
// 					i.likes = i.likes + '_';
// 				} else {
// 					i.likes = "not";
// 				}
// 				let temp = { id: i._id };
// 				if(i.text_json){
// 					temp.json = utils.changeToBase64(i.text_json);
// 				}
// 				stories_json.push(temp);
// 			}

// 			res.render('feedNew.njk', { stories: rows, stories_json: stories_json, userrec: w,userId:userid, csrfToken: req.csrfToken() });
// 		} catch (err) {
// 			console.log(err);
// 			res.status(500);
// 		}
// 	}
// 	else{
// 		req.session.visits++;
// 		console.log("New user")
// 		try {
// 			let rows = await dbQueries.feedBasic(userid);
// 			let stories_json = new Array();
// 			//console.log(rows);

// 			for (let i of rows) {
// 				if (i.likes === true || i.likes === false) {
// 					i.likes = i.likes + '_';
// 				} else {
// 					i.likes = "not";
// 				}
// 				let temp = { id: i._id };
// 				if(i.text_json){
// 					temp.json = utils.changeToBase64(i.text_json);
// 				}
// 				stories_json.push(temp);
// 			}
// 			res.render('feed.njk', { stories: rows, stories_json: stories_json, csrfToken: req.csrfToken() });
// 		} catch (err) {
// 			console.log(err);
// 			res.status(500);
// 		}
// 	}
// }

// async function feedNew2(req,res){
// 	let userid = req.session.userid;
// 	console.log(userid);
// 	try {
// 		let feedRec = await clientgetFeed(userid)
		
// 		let sIds = feedRec['storyids'];
// 		let uIds = feedRec['userids'];
		
// 		sIds = sIds.split(',')
// 		uIds = uIds.split(',')
		
// 		let rows = await dbQueries.getStories(sIds,userid);
// 		let w = await dbQueries.getEmailsOfUsers(uIds);

// 		let stories_json = new Array();
		
// 		for (let i of rows) {
// 			if (i.likes === true || i.likes === false) {
// 				i.likes = i.likes + '_';
// 			} else {
// 				i.likes = "not";
// 			}
// 			let temp = { id: i._id };
// 			if(i.text_json){
// 				temp.json = utils.changeToBase64(i.text_json);
// 			}
// 			stories_json.push(temp);
// 		}

// 		res.render('feedNew.njk', { stories: rows, stories_json: stories_json, userrec: w,userId:userid, csrfToken: req.csrfToken() });
// 	} catch (err) {
// 		console.log(err);
// 		res.status(500);
// 	}
// }

// clientgetFeed = (options) => {
// 	return new Promise((resolve, reject) => {
// 		client2.GetFeed(parseInt(options), (error, response) => {
// 			if (error) { reject(error); }
// 			resolve(response);
// 		});
// 	});
// };

// clientanalyze = (options) => {
// 	return new Promise((resolve, reject) => {
// 		client.analyze(options, (error, response) => {
// 			if (error) { reject(error); }
// 			resolve(response);
// 		});
// 	});
// };

// module.exports = router;