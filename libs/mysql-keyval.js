/*
	Simple nodejs script that exposes a ready to use db for getting and setting key-value pairs to-from mysql db

	depends on mysql module
*/

//create a local scope 
(function(){
	var mysql      = require('mysql');
	var pool  = mysql.createPool({
	  host     : 'localhost',
	  user     : 'io4voice_kv',
	  password : '243243',
	  database : 'io4voice_kv',
	  insecureAuth : true,
	});

	
	var tblname = "keyval";

	//private functions
	var getDB = function(next){
		pool.getConnection(function(err,connection){
			if(err){
				console.log("ERROR ON GETTING CONNECTION FROM POOL");
			}
			next(connection,function(){
				connection.release();
			});
		});
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

		getDB(function(con,release){
			var query = "select `value` from "+tblname+" where `key` = "+con.escape(key)+"";
			con.query(query,function(e, rows, fields){
				if(e){
					err(e);
					release();
					return;
				}

				if(rows.length === 0){
					next();
				}else{
					next(getJSON(rows[0].value));	
				}
				release();
			});
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

		getDB(function(con,release){
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
						release();
						return;
					}
					next();
					release();
				});
			},function(){
				err();
				release();
			});
		});


	}

	var obj = {
		get:get,
		set:set
	}

	exports.db = obj; //export functionality

})();