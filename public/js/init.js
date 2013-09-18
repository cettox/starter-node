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

	});

}
// After form is selected
function step2(selected){
	
	var apiKey = JF.getAPIKey();
	var formId = selected[0].id;
	alert(apiKey+' '+formId);

	var number = prompt('Which number do you want us to relay your voice phone','4156910958');

	step3(formId,apiKey,number);

}

function step3(formId,apiKey,number){

	$.post("/connect_jotform",{
		formId:formId,
		apiKey:apiKey,
		number:number
	},function(response){
		alert('Your request is now in progress. '+response);
	});

}