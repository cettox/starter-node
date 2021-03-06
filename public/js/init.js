function init(){


	$("#start").click(function(){
		start_auth_and_form_picker();
		return false;
	});


}

function start_auth_and_form_picker(){
	JF.login(function(){
		JF.FormPicker({
			title : "Please choose one of your forms",
			onSelect : step2
		});

	},function(){
		alert('please login again');
	});
	return false;
}


//polls /status/formId about the status of conversion and submission if finished renders result audio
function checkStatus(callId,formId,number,callback){
	var iflag = false;
	var c = 0;
	var iii = setInterval(function(){
		c++;
		us('checking...');

		$.get('/status/'+callId+'/'+formId+'/'+number,function(response){
			var res = JSON.parse(response);
			us('checked...');
			if(res.status == 'done'){
				if(callback === undefined){
					us('Form Voice Submitted. Preparing results.');
					setTimeout(function(){
						renderResults(callId,formId);
					},300);	
				}else{
					callback(true);
				}
				
				iflag = true
			}else{
				us('still in progress!');
			}

			if(iflag === true){
				clearInterval(iii);
			}
		});



	},2000);

}

function us(str){
	$('#status').html(str);
}

function renderResults(callId,formId){	
	var html = '';

	html = "Submission received. Click <a target='_self' href='/account/submission/"+formId+"/"+callId+"'>here</a> to see the results.";
	console.log('final html ',html);

	$('#results').html(html);

}

// After form is selected
function step2(selected){
	
	var apiKey = JF.getAPIKey();
	var formId = selected[0].id;

	JF.getUser(function(response){

	    step3(formId,apiKey,response.username);
	});
}

function playSound(link){
	var mySound = soundManager.createSound({
      id: link,
      url: link,
      onload: function() { console.log('sound loaded!' +link, this); }
    });

    mySound.play();

}

function step3(formId,apiKey,username){
	$.post("/create_voice_form",{
		formId:formId,
		apiKey:apiKey,
		username:username,
	},function(response){
		if(response.indexOf("ERROR") === 0){
			alert("there was an error while creating your voice form");
			return;
		}

		document.location.href = "/vform/"+formId; //redirect user to form view page

	});
}

function step3_old(formId,number){
	$.post("/connect_jotform",{
		formId:formId,
		number:number
	},function(response){
		if(response.indexOf('OK') === 0){
			checkStatus(response.split(':')[1],formId,number);
		}else{
			us(response);
		}
	});
}

function step3_embed(formId,number,callback){
	$.post("/connect_jotform",{
		formId:formId,
		number:number
	},function(response){
		if(response.indexOf('OK') === 0){
			checkStatus(response.split(':')[1],formId,number,callback);
		}else{
			us(response);
		}
	});
}

function closeModalTmp(modal_id){
	$("#lean_overlay").fadeOut(0);
    $("#"+modal_id).css({
        "display": "none"
    });

}
