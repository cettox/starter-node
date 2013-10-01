var VFORM = {
	embed : function(formId){
		var content = '<iframe src="http://voiceforms.jotform.io:3000/vform/clean/'+formId+'" style="width:98%;height:200px;border:none;overflow:hidden"></iframe>';
		document.write(content);
	}
}