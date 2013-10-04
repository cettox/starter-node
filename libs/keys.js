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
    allForms : function(){
        return '.fm';
    },
    user : function(username){
    	return username+'.meta';
    },
    freeCountKey: function(username){
    	return username+'.freeCount';
    },
    formSubmissionStatKey: function(formId,number,callId){
    	return formId+".status."+number+".status."+callId;
    },
    submission : function(username,formId,number,isText){
    	if(isText === undefined){isText = false;}
        var ret = username+'.s'+(isText?'':'v')+'.'+formId+'.s'+(isText?'':'v')+'.'+number+'.s'+(isText?'':'v')+'.data';
    	return  ret;
    },
    submissions : function(formId,isText){
    	if(isText === undefined){isText = false;}

    	return  formId+'.s'+(isText?'':'v')+'.';
    }

}