// Load app dependencies
var http = require('http'),
    path = require('path'),
    express = require('express'),
    twilio = require('twilio'),
    db = require( __dirname + '/libs/mysql-keyval').db;
var base_url = 'http://voiceforms.jotform.io:3000/';
 
// Load configuration information from system environment variables.
var TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN,
    TWILIO_NUMBER = process.env.TWILIO_NUMBER;

// Create an authenticated client to access the Twilio REST API
var client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Create an Express web application with some basic configuration
var app = express();
var local_db = {};

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

// render our home page
app.get('/', function(request, response) {
    response.render('jotform');
});


// render our home page
app.get('/jotform', function(request, response) {
    response.render('jotform');
});

// render our home page
app.get('/settest', function(request, response) {


    db.set("key1","value1",function(){
        response.send("Key successfully set");
    },function(err){
        response.send("there was an error setting the key "+err);
    });
});

// render our home page
app.get('/get/:key', function(request, response) {
    
    
    var key = request.params.key;

    db.get(key,function(value){
        response.send("Key successfully get => ",value);
    },function(err){
        response.send("there was an error setting the key "+err);
    });
});

// form render
app.get('/vform/:formId', function(request, response) {
    var formId = request.params.formId;

    //get form from db
    db.get(formId+".meta",function(value){
        if(value === undefined){
            response.send("Form with given id does not exists in voice form");
            return;
        }

        //everything ok go render voice form
        var form = value;

        //fetch form details
        var jf = require("jotform-api-nodejs");

        jf.options({
            debug: true,
            apiKey: form.apiKey
        });

        jf.getForm(formId)
        .then(function(r){
              
            response.render("form",{
                formId:value.formId,
                formTitle : r.title
            })

        })
        .fail(function(e){
            response.send("There was an error while reading form data from jotform api");
        });

    },function(err){
        response.send("There was an error while reading form data from db");
    });
});


app.post('/create_voice_form', function(request,response){
    var apiKey = request.body.apiKey;
    var formId = request.body.formId;

    var jf = require("jotform-api-nodejs");

    jf.options({
        debug: true,
        apiKey: apiKey
    });

    jf.getFormQuestions(formId)
    .then(function(r){

        //save voice form data
        var key = formId+".meta";
        var value = {
            formId:formId,
            apiKey:apiKey,
            qs : r,
            answers : {},
            texts : {}
        }
        //store form details
        db.set(key,value,function(){
            response.send(formId);
        },function(err){
            response.send("ERROR "+err);
        });
    })
    .fail(function(e){
        response.send("ERROR "+e);
    });


});

app.post('/connect_jotform', function(request,response){
    var formId = request.body.formId;
    var number = request.body.number;


    db.get(formId+".meta",function(r){
        var form = r;
        console.log(form);
        for(key in form.qs){
            var q = form.qs[key];
            if(q.type == "control_textbox"){

                client.makeCall({
                    to: number,
                    from: TWILIO_NUMBER,
                    url: base_url+'get_audio/'+formId+'/'+number+'/'+key+'/doesnotmatter'
                }, function(err, data) {
                    // When we get a response from Twilio, respond to the HTTP POST request
                    console.log('ERROR :', err);
                    if(err){
                        response.send('There was an error :' +err.message);    
                    }else{
                        //call started create a record in db for example
                        var stat_key = formId+".status."+number; //status text bind to formId and number
                        db.set(stat_key,{
                            formId:formId,
                            number:number,
                            status : "ongoing"
                        },function(){
                            response.send('OK');  
                        });  
                    }
                    
                });
                return false;
            }
        }


    });
    


});

app.post('/get_audio/:formId/:number/:qid/:pqid', function(request,response){
    var formId = request.params.formId;
    var number = request.params.number;
    var qid = request.params.qid;
    var pqid = request.params.pqid;
    var jf = require("jotform-api-nodejs");
    var form_key = formId+".meta";
    //get form details from db
    db.get(form_key,function(form){
        var qs = form.qs;
        var answers = form.answers;
        if(pqid != 'doesnotmatter'){

            answers[pqid] = request.body.RecordingUrl;
            //save form
            db.set(form_key,form);
        }


        if(qid == 'this_is_the_end'){

            console.log('this is the end ',answers);
            var twiml = new twilio.TwimlResponse();
            twiml.say('Your voice submisson successfully received');
            // Return an XML response to this request
            response.set('Content-Type','text/xml');
            response.send(twiml.toString());
            return false;
        }
        var flag = false;
        var next = false;
        for(var key in qs){
            if(key == qid){
                flag = true;
                continue;
            }
            var q = qs[key];
            if(flag === true){
                if(q.type=='control_textbox'){
                    next = key;
                    break;
                }
            }

        }

        if(next === false){
            next = 'this_is_the_end';
        }

        var qqq = qs[qid];
        var twiml = new twilio.TwimlResponse();  
        twiml.say('Please Answer by voice and push * to finish: What is the Value of '+ qqq.text);
        twiml.record({
            action : base_url+'get_audio/'+formId+'/'+number+'/'+next+'/'+qid,
            method:"POST",
            maxLength:"20",
            finishOnKey:"*",
            transcribe:true,
            transcribeCallback:base_url+'transcribe/'+formId+'/'+number+'/'+qid+'/'+next,
        });
        response.set('Content-Type','text/xml');
        response.send(twiml.toString());

    },function(err){

    });

});

// handle a POST request to send a text message.  This is sent via ajax on our
// home page
app.post('/transcribe/:formId/:number/:qid/:is_end', function(request, response) {
    var formId = request.params.formId;
    var number = request.params.number;
    var qid = request.params.qid;
    var is_end = request.params.is_end;
    var text = request.body.TranscriptionText;
    var form_key = formId+".meta";
    //get form details from db
    db.get(form_key,function(form){
        var qs = form.qs;
        var qqq = qs[qid];
        form.texts[qid] = text;

        console.log('transcripton completed for ',qqq.name,'  ',text);

        if(is_end == 'this_is_the_end'){
            console.log('all transcription completed!!!');
            var stat_key = formId+".status."+number
            db.get(stat_key,function(status){
                status.status = 'done';
                db.set(stat_key,status,function(){
                    db.set(form_key,form,function(){
                        response.send('   ');
                    });
                });
            });
        }
        
    });

   
});

app.get('/status/:formId/:number',function(request,response){
    var formId = request.params.formId;
    var number = request.params.number;
    var stat_key = formId+".status."+number;
    var form_key = formId+".meta";
    db.get(stat_key,function(status){
        if (status.status == 'ongoing'){
            response.send(JSON.stringify({status:'ongoing'}));
        }else{
            db.get(form_key,function(form){
                response.send(JSON.stringify({status:'done',answers:form.answers,qs:form.qs,texts:form.texts}));
            });
        }
    });
   
});

// Create a TwiML document to provide instructions for an outbound call
app.post('/webhook/voice', function(request, response) {
    // Create a TwiML generator
    var twiml = new twilio.TwimlResponse();
    twiml.gather("", {
        action : "https://4a245a03.ngrok.com/voice2",
        numDigits:1
    }, function(){
        this.say('Press 1 to record a new message. Press 2 to listen last three messages. ');
    });

    // Return an XML response to this request
    response.set('Content-Type','text/xml');
    response.send(twiml.toString());
});

// Create a TwiML document to provide instructions for an outbound call
app.post('/webhook/voiceap', function(request, response) {
    // Create a TwiML generator
    var twiml = new twilio.TwimlResponse();
    twiml.dial(request.body.phone_number,{callerId:'+15107688058'});

    // Return an XML response to this request
    response.set('Content-Type','text/xml');
    response.send(twiml.toString());
});


// Create a TwiML document to provide instructions for an outbound call
app.post('/webhook/sms', function(request, response) {
    // Create a TwiML generator
    var twiml = new twilio.TwimlResponse();
    twiml.sms('Hello there! You have successfully configured a web hook.');
    
    // Return an XML response to this request
    response.set('Content-Type','text/xml');
    response.send(twiml.toString());
});


// Start our express app, by default on port 3000
http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});