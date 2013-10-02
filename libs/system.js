/*
	This simple script handles basic static backend read functions for example
	checkFreeRights which will return the number of free voice form test amount for given user
*/

var db = require( __dirname + '/mysql-keyval').db;
var keys = require( __dirname + '/keys').keys;
var initial_count = 3;
var crypto = require('crypto');

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
exports.getUserForms = function(username,next,err){
	if(next === undefined){
		next = noop;
	}
	if(err == undefined){
		err == noop;
	}

	db.find(keys.userForms(username),function(forms){
		next(forms);
	},err);

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


exports.getSubmissions = function(username,formId,number,isText,next,err){
	
	var sub_key = keys.submission(username,formId,number,isText);
    db.get(sub_key,function(submissions){
    	if(submissions === undefined){
    		submissions = {};

    		db.set(sub_key,submissions,function(){next(submissions)},err);
    		return;
    	}
    	next(submissions);

    },err);
}

exports.createNewSubmission = function(callId,username,formId,number,isText,next,err){-
	exports.getSubmissions(username,formId,number,isText,function(submissions){
		if(callId in submissions){
			next(submissions,callId);
			return;
		}

		submissions[callId] = {};
		next(submissions,callId);
		return;
	},err);

}

exports.saveSubmissions = function(username,formId,number,submissions,isText,next,err){
	var sub_key = keys.submission(username,formId,number,isText);
	db.set(sub_key,submissions,next,err);
}	

exports.insertDataToSubmission = function(callId,username,formId,number,qid,data,isText,next,err){
	exports.createNewSubmission(callId,username,formId,number,isText,function(submissions,targetIndex){
		submissions[targetIndex][qid] = data;
		exports.saveSubmissions(username,formId,number,submissions,isText,next,err);
	},err);
}

/*
	creates and returns a sha1 hash from formId, number and current date
	this callId will be assigned to individual calls and used to keep track of individual
	record and transcribe responses eminated from that call.
*/
exports.getNewCallId = function(formId,number){
	var d=new Date();
	var dateString=d.toUTCString(); 
	var shasum = crypto.createHash('sha1');
	shasum.update(formId+"-"+number+"-"+dateString);
	return shasum.digest('hex');
}

exports.menu = [
	{
		"link" : "/",
		"text" : "Home"
	},
	{
		"link" : "/account/vforms",
		"text" : "Voice Forms"
	},
	{
		"link" : "/account",
		"text" : "Account Settings"
	},
];

