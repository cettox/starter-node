/*
	Simple nodejs script that exposes a ready to use db for getting and setting key-value pairs to-from mysql db

	depends on mysql module
*/

//create a local scope 
(function(){
	var mysql      = require('mysql');
	var initialized = false;
	var connection_details = {
		  host     : 'localhost',
		  user     : 'io4voice_kv',
		  password : '243243',
		  database : 'io4voice_kv',
		  insecureAuth : true,
	};
	var connection = mysql.createConnection(connection_details);
	var tblname = "keyval";

	//private functions
	var getDB = function(){
		console.log("yupyup");
		if(initialized === false){
			initalize();
			initialized = true;
		}
		
		return connection;
	}

	var initalize = function(){
		
		connection.connect();
	}

	function noop(){

	}

	function getJSON(text){
		if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
		replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
		replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
		  //the json is ok
			return JSON.parse(text);
		}else{
		  //the json is not ok
		  return text;
		}
	}
	//get set methods
	function get(key,next,err){
		if(next === undefined){
			next = noop;
		}
		if(err == undefined){
			err == noop;
		}

		var con = getDB();
		var query = "select `value` from "+tblname+" where `key` = "+con.escape(key)+"";
		con.query(query,function(e, rows, fields){
			if(e){
				err(e);
				return;
			}

			if(rows.length === 0){
				next();
			}else{
				next(getJSON(rows[0].value));	
			}
		});
	}

	function set(key,value,next,err){
		if(next === undefined){
			next = noop;
		}
		if(err == undefined){
			err == noop;
		}

		if(typeof value != "string"){
			value = JSON.stringify(value);
		}

		var con = getDB();

		//first get
		get(key,function(res){
			if(res === undefined){
				var query = "insert into "+tblname+" (`id`,`key`,`value`) values (NULL,"+con.escape(key)+","+con.escape(value)+")";
			}else{
				var query = "update "+tblname+" set `value` = "+con.escape(value)+" where `key`= "+con.escape(key);
			}
			con.query(query,function(e, rows, fields){
				if(e){
					err(e);
					return;
				}
 
				next();
			});
		},err);

	}

	var obj = {
		get:get,
		set:set
	}

	exports.db = obj; //export functionality

})();