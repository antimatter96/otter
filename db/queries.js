var client = require("./redis.js");

function getURL(shortURL) {
	return client.hgetall(shortURL);
}

function checkURL(shortURL) {
	return client.hexists(shortURL, "longURL");
}

function checkIfPresent(email) {
	return knex('users').count('_id').where({ 'email': email });
}

function checkIfUserPresent(userid) {
	return knex('users').count('_id').where({ '_id': userid });
}

function registerSave(email, passwordHash) {
	return knex('users').returning('_id').insert({ 'email': email, 'password': passwordHash });
}

function getPasswordHash(email) {
	return knex.select('_id', 'password').from('users').where({ email: email });
}

function saveStory(by, storyText, storyTextJson, storyTitle) {
	return knex('stories').returning('_id').insert({ 'userid': by, 'text': storyText, 'text_json': JSON.stringify(storyTextJson), 'title': storyTitle });
}

function getStory(storyid) {
	return knex('stories').join('users', 'stories.userid', '=', 'users._id').leftJoin('crowdratingagg', 'stories._id', '=', 'crowdratingagg.storyid').select('stories.text_json', 'stories.text', 'stories.title', 'users.email', 'stories.emo', 'crowdratingagg.emoavg').where({ 'stories._id': storyid });
}

function checkIfRated(storyid, userid) {
	return knex('crowdrating').where({ 'userid': userid, 'storyid': storyid });
}

function setEmotion(storyid, emotionJSON) {
	return knex('stories').where({ 'stories._id': storyid }).returning('_id').update({ 'emo': JSON.stringify(emotionJSON) });
}

function crowdRateInsert(storyid, userid, emotionJSON) {
	return knex('crowdrating').returning('_id').insert({ 'emo': JSON.stringify(emotionJSON), 'userid': userid, 'storyid': storyid });
}

function crowdRateLikeInsert(storyid, userid, likesOrNot) {
	return knex('crowdrating').returning('_id').insert({ 'likes': likesOrNot, 'userid': userid, 'storyid': storyid });
}

function crowdRateUpdate(storyid, userid, emotionJSON) {
	return knex('crowdrating').returning('_id').update({ 'emo': JSON.stringify(emotionJSON) }).where({ 'userid': userid, 'storyid': storyid });
}

function crowdRateLikeUpdate(storyid, userid, likesOrNot) {
	return knex('crowdrating').returning('_id').update({ 'likes': likesOrNot }).where({ 'userid': userid, 'storyid': storyid });
}

function getCrowdRating(storyid) {
	return knex('crowdrating').select('_id', 'emo').where({ 'storyid': storyid });
}

function checkCrowdAggPresent(storyid) {
	return knex('crowdratingagg').count('_id').where({ 'storyid': storyid });
}

function setCrowdAgg(storyid, emotionJSON) {
	return knex('crowdratingagg').returning('_id').insert({ 'emoavg': JSON.stringify(emotionJSON), 'storyid': storyid });
}

function updateCrowdAgg(storyid, emotionJSON) {
	return knex('crowdratingagg').returning('_id').update({ 'emoavg': JSON.stringify(emotionJSON) }).where({ 'storyid': storyid });
}

function feedBasic(userid, limit = 10) {
	let subcolumn = knex.countDistinct('_id').from('crowdrating as cr2').whereRaw('cr2.storyid = s._id').as('ratings');
	return knex.with('cock', knex.raw('select * from crowdrating where userid = ?', userid)).select('s._id', 's.text', 's.text_json', 's.title', 'u.email', subcolumn, 'cr.emo', 'cr.likes').from('stories as s').join('users as u', 's.userid', '=', 'u._id').leftOuterJoin('cock as cr', 's._id', '=', 'cr.storyid').whereNot('s.userid', userid).orderBy('ratings', 'desc').limit(limit);
}

function feedRecommended(userid, storyIds) {
	let subcolumn = knex.countDistinct('_id').from('crowdrating as cr2').whereRaw('cr2.storyid = s._id').as('ratings');
	knex.with('cock', knex.raw('select * from crowdrating where userid = ?', userid)).select('s._id', 's.text_json', 's.title', 'u.email', 'cr.emo', 'cr.likes').from('stories as s').join('users as u', 's.userid', '=', 'u._id').leftOuterJoin('cock as cr', 's._id', '=', 'cr.storyid').where();
}

function __getStory() {
	return knex('stories').leftJoin('crowdratingagg', 'stories._id', '=', 'crowdratingagg.storyid').select('stories.text_json', 'stories.title', 'users.email', 'stories.emo', 'crowdratingagg.emoavg').where({ 'stories._id': storyid });
}

function getAllStoriesByUser(userid) {
	return knex('stories').join('users', 'stories.userid', '=', 'users._id').select('stories._id', 'stories.text_json', 'stories.text', 'stories.title', 'users.email').where({ 'stories.userid': userid });
}

function getProfile(userid) {
	return knex('users').select('email', 'created_at').where({ '_id': userid });
}

function getEmailsOfUsers(users) {
	return knex.select('email','_id').from('users').whereIn('_id', users);
}

function getStories(stories, userid, limit = 20) {
	return knex.with('cock', knex.raw('select * from crowdrating where userid = ?', userid)).select('s._id', 's.text', 's.text_json', 's.title', 'u.email', 'cr.emo', 'cr.likes').from('stories as s').join('users as u', 's.userid', '=', 'u._id').leftOuterJoin('cock as cr', 's._id', '=', 'cr.storyid').whereIn('s._id', stories).limit(limit);
}

function totalUsers() {
	return knex('users').select('_id');
}

function totalStories() {
	return knex('stories').select('_id');
}

function farzi(emotion, limit) {
	return knex.raw("SELECT s.emo,s._id FROM stories AS s LEFT JOIN LATERAL (SELECT (el ->> 'score')::numeric AS s FROM json_array_elements(emo) AS el WHERE el ->> 'tone_id' = ? LIMIT 1) AS a ON true ORDER BY a.s DESC LIMIT ?;", [emotion,limit]);
}

module.exports = {
	checkURL: checkURL,
	checkIfUserPresent: checkIfUserPresent,
	registerSave: registerSave,
	getPasswordHash: getPasswordHash,
	saveStory: saveStory,
	getStory: getStory,
	checkIfRated: checkIfRated,
	setEmotion: setEmotion,
	crowdRateInsert: crowdRateInsert,
	crowdRateLikeInsert: crowdRateLikeInsert,
	crowdRateUpdate: crowdRateUpdate,
	crowdRateLikeUpdate: crowdRateLikeUpdate,
	getCrowdRating: getCrowdRating,
	checkCrowdAggPresent: checkCrowdAggPresent,
	setCrowdAgg: setCrowdAgg,
	updateCrowdAgg: updateCrowdAgg,
	feedBasic: feedBasic,
	getAllStoriesByUser: getAllStoriesByUser,
	getProfile: getProfile,
	totalUsers: totalUsers,
	totalStories: totalStories,
	getStories: getStories,
	getEmailsOfUsers: getEmailsOfUsers,
	farzi:farzi
};