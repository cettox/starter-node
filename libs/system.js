/*
	This simple script handles basic static backend read functions for example
	checkFreeRights which will return the number of free voice form test amount for given user
*/

var db = require( __dirname + '/mysql-keyval').db;
var keys = require( __dirname + '/keys').keys;
var initial_count = 3;

function noop(){}

exports.getFreeCountLeft = function(username,next,err){
	if(next === undefined){
		next = noop;
	}
	if(err == undefined){
		err == noop;
	}

	var freeCountKey = keys.freeCountKey(username);
	db.get(freeCountKey,function(count){
		if(count === undefined){
			//oops there is no count given yet give it
			db.set(freeCountKey,initial_count,function(){next(initial_count)},err);
		}else{
			next(count);
		}
	},err);
};

exports.setFreeCountLeft = function(username,count,next,err){
	if(next === undefined){
		next = noop;
	}
	if(err == undefined){
		err == noop;
	}

	var freeCountKey = keys.freeCountKey(username);
	db.set(freeCountKey,count,next,err);
};

exports.decrement = function(username,next,err){
	if(next === undefined){
		next = noop;
	}
	if(err == undefined){
		err == noop;
	}
	exports.getFreeCountLeft(username,function(count){
		if(count >= 1){
			count--;
			exports.setFreeCountLeft(username,count,function(){
				next(count);
			},err);
		}else{
			err();
		}
	});
}

exports.getUser = function(username,next,err){
	//check if user exists
	var user_key = keys.user(username);
	db.get(user_key,function(user){
		if(user!== undefined){
			next(user);
			return;
		}
		user = {
			username:username,
			twilio:false,
			apiKey:false
		};
		db.set(user_key,user,function(){
			next(user);
			return;
		},err);
	},err);
}

exports.setUser = function(username,user,next,err){
	var user_key = keys.user(username);
	db.set(user_key,user,next,err);
}


