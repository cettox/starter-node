function init(){


	$("#start").click(function(){

		JF.login(function(){

			JF.FormPicker({
				title : "Please choose one of your forms",
				onSelect : step2
			});

		},function(){
			alert('please login again');
		});
		return false;
	});




}

//polls /status/formId about the status of conversion and submission if finished renders result audio
function checkStatus(formId){
	var iflag = false;
	var c = 0;
	var iii = setInterval(function(){
		c++;
		us('checking...');

		$.get('/status/'+formId,function(response){
			var res = JSON.parse(response);
			us('checked...');
			if(res.status == 'done'){
				us('Form Voice Submitted. Preparing results.');
				setTimeout(function(){
					renderResults(res.answers,res.questions);
				},300);
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

function renderResults(answers, questions){
	console.log(answers,questions);
	
	var html = '';

	for(var i in answers){
		var alink = answers[i];
		var q = questions[i];
		console.log('inside the loop ', alink, q.text);
		html += 'Q: '+q.text+' : <a href="'+alink+'" target="_blank">Click here to listen</a> <br />';

	}
	console.log('final html ',html);

	$('#results').html(html);

}

// After form is selected
function step2(selected){
	
	var apiKey = JF.getAPIKey();
	var formId = selected[0].id;
	var number = prompt('Which number do you want us to relay your voice phone','+905339651303');

	step3(formId,apiKey,number);

}

function step3(formId,apiKey,number){
	
	$.post("/connect_jotform",{
		formId:formId,
		apiKey:apiKey,
		number:number
	},function(response){
		if(response == 'OK'){
			checkStatus(formId);
		}else{
			us(response);
		}

	});

}