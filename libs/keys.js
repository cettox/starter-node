//this file hold all key-value key generator functions for site-wide consistency

exports.keys = {
    vform : function(username,formId){
        return formId+'.'+username+'.form.meta';
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
    submission : function(username,formId,number,){
    	return : username+'.s.'+formId+'.s'+number+'.s.data'
    }

}