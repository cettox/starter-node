//this file hold all key-value key generator functions for site-wide consistency

exports.keys = {
    vform : function(username,formId){
        return formId+'.fm.'+username+'.fm';
    },
    formSearch : function(formId){
        return formId+'.fm.';
    },
    userForms : function(username){
    	return '.'+username+'.fm';
    },
    user : function(username){
    	return username+'.meta';
    },
    freeCountKey: function(username){
    	return username+'.freeCount';
    },
    formSubmissionStatKey: function(formId,number){
    	return formId+".status."+number;
    },
    submission : function(username,formId,number,isText){
    	if(isText === undefined){isText = false;}
    	console.log("submission key equals => ",username+'.s'+(isText?'':'v')+'.'+formId+'.s'+(isText?'':'v')+'.'+number+'.s'+(isText?'':'v')+'.data');
    	return  username+'.s'+(isText?'':'v')+'.'+formId+'.s'+(isText?'':'v')+'.'+number+'.s'+(isText?'':'v')+'.data';
    },
    submissions : function(formId,isText){
    	if(isText === undefined){isText = false;}

    	return  formId+'.s'+(isText?'':'v')+'.';
    }

}