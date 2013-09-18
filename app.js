// Load app dependencies
var http = require('http'),
    path = require('path'),
    express = require('express'),
    twilio = require('twilio');

var base_url = 'http://memblr.net:3000/';
 
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
    response.render('index');
});

// render our home page
app.get('/twilio', function(request, response) {
    var twilio = require('twilio');
    var capability = new twilio.Capability(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    //Create a capability token using the TwiML app with sid "AP123"
    capability.allowClientOutgoing('AP4040fcb1e1ce6bb19c3072c5b8ed08f2');
    capability.allowClientIncoming('AP4040fcb1e1ce6bb19c3072c5b8ed08f2');
    var token = capability.generate();

    response.render('twil',{token:token});
});

// render our home page
app.get('/jotform', function(request, response) {
    response.render('jotform');
});

app.post('/connect_jotform', function(request,response){
    var apiKey = request.body.apiKey;
    var formId = request.body.formId;
    var number = request.body.number;

    var jf = require("jotform-api-nodejs");

    jf.options({
        debug: true,
        apiKey: apiKey
    });

    jf.getFormQuestions(formId)
    .then(function(r){
        
        console.log(r);
        local_db[formId] = {
            qs : r,
            answers : {}
        };
        for(key in r){
            var q = r[key];
            if(q.type == "control_textbox"){

                client.makeCall({
                    to: number,
                    from: TWILIO_NUMBER,
                    url: base_url+'get_audio/'+apiKey+'/'+formId+'/'+number+'/'+key+'/doesnotmatter'
                }, function(err, data) {
                    // When we get a response from Twilio, respond to the HTTP POST request
                    console.log('ERROR :', err);
                    if(err){
                        response.send('Call incoming!' +err.message);    
                    }
                    
                });
                return false;
            }
        }


    })
    .fail(function(e){
        /*
         error during request or not authenticated
         */
    });


});

app.post('/get_audio/:apiKey/:formId/:number/:qid/:pqid', function(request,response){
    var apiKey = request.params.apiKey;
    var formId = request.params.formId;
    var number = request.params.number;
    var qid = request.params.qid;
    var pqid = request.params.pqid;
    var jf = require("jotform-api-nodejs");

    var qs = local_db[formId].qs;
    var answers = local_db[formId].answers;
    if(pqid != 'doesnotmatter'){

        answers[pqid] = request.body.RecordingUrl;

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
     twiml.say('Value of '+ qqq.text);
        twiml.record({
            action : base_url+'get_audio/'+apiKey+'/'+formId+'/'+number+'/'+next+'/'+qid,
            method:"POST",
            maxLength:"20",
            finishOnKey:"*",
            transcribe:false,
            transcribeCallback:base_url+'transcribe/'+apiKey+'/'+formId+'/'+number+'/'+qid+'/'+next,
        });
        response.set('Content-Type','text/xml');
        response.send(twiml.toString());


});

// handle a POST request to send a text message.  This is sent via ajax on our
// home page
app.post('/transcribe/:apiKey/:formId/:number/:qid/:is_end', function(request, response) {
    var apiKey = request.params.apiKey;
    var formId = request.params.formId;
    var number = request.params.number;
    var qid = request.params.qid;
    var is_end = request.params.is_end;
    var text = request.body.TranscriptionText;
    var qs = local_db[formId].qs;
    var qqq = qs[qid];
    console.log('transcripton completed for ',qqq.name,'  ',text);

    if(is_end == 'this_is_the_end'){
        console.log('all transcription completed!!!');
    }
    
    response.send('   ');
});

// handle a POST request to send a text message.  This is sent via ajax on our
// home page
app.post('/message', function(request, response) {
    // Use the REST client to send a text message
    client.sendSms({
        to: request.param('to'),
        from: TWILIO_NUMBER,
        body: 'Good luck on your Twilio quest!'
    }, function(err, data) {
        // When we get a response from Twilio, respond to the HTTP POST request
        response.send('Message is inbound!');
    });
});

// handle a POST request to make an outbound call.  This is sent via ajax on our
// home page
app.post('/call', function(request, response) {
    // Use the REST client to send a text message
    client.makeCall({
        to: request.param('to'),
        from: TWILIO_NUMBER,
        url: 'http://twimlets.com/message?Message%5B0%5D=http://demo.kevinwhinnery.com/audio/zelda.mp3'
    }, function(err, data) {
        // When we get a response from Twilio, respond to the HTTP POST request
        response.send('Call incoming!');
    });
});

// Create a TwiML document to provide instructions for an outbound call
app.get('/hello', function(request, response) {
    // Create a TwiML generator
    var twiml = new twilio.TwimlResponse();
    twiml.say('Hello there! You have successfully configured a web hook.');
    twiml.say('Good luck on your Twilio quest!', { 
        voice:'woman' 
    });

    // Return an XML response to this request
    response.set('Content-Type','text/xml');
    response.send(twiml.toString());
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
app.post('/voice2', function(request, response) {
    // Create a TwiML generator

    console.log("digitsss " ,request.body.Digits);

    var digit = request.body.Digits.charAt(0);


    var twiml = new twilio.TwimlResponse();
      
    if(digit == '1'){
        //record
       c
        return false;

    }else if(digit == '2'){
        
        client.recordings.get(function(err,rec){
            console.log(rec.recordings);

            for(var i=0; i < rec.recordings.length; i++){
                var recc = rec.recordings[i];

                var record_url = 'http://api.twilio.com'+recc.uri.replace('.json','');  
                twiml.say('Now playing message number '+(i+1));
                twiml.play(record_url);   

                if(i==2){break;}
            }

            response.set('Content-Type','text/xml');
            response.send(twiml.toString());
            return false;

            
        });
        return false;

    }

    
    var twiml = new twilio.TwimlResponse();
    twiml.say(txt);

    // Return an XML response to this request
    response.set('Content-Type','text/xml');
    response.send(twiml.toString());
});

app.post('/record_completed',function(request,response){
    console.log(request.body.RecordingUrl);
    var twiml = new twilio.TwimlResponse();
    twiml.say('Your recording successfully saved!');
    twiml.redirect(base_url+'webhook/voice');
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