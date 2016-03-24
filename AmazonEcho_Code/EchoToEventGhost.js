/*
****** Pulls speech input and passes on to Event Ghost for custom events *****
*/
var http = require('http');

var EG_ip = '127.0.0.0';
var EG_Port = '80';
var EG_Event = 'EchoToEG';

var Echo_App_ID = "amzn1.echo-sdk-ams.app.############";

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);


        if (event.session.application.applicationId !== Echo_App_ID) {
             context.fail("Invalid Application ID");
        }


        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        
    // Whatever the Intent is, pass it straight through to 
    // EventGhost 
    
    callEchoToEG(intent, session, callback);

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Main Intent Processing Function ----------------


// This is where are new callEchoToEG functions goes

function callEchoToEG(intent, session, callback)
{
    var sessionAttributes = "{}";
    var cardTitle = 'Black Box Automation';
    var shouldEndSession = true;

    var payload = "";
    var speechOutput = "";
    var repromptText = "I could not understand, please try again";
    var i = 0;
    var slots = intent.slots;
    
    //Pull the spoken text and format
    var actionSlot = intent.slots.Action;
    var setAction = actionSlot.value.toLowerCase();
    var setActionURI = require('querystring').escape(setAction);
    console.log("callEchoToEG - Intent name = " + intent.name);
    console.log("callEchoToEG - Intent = " + setAction);
    console.log("callEchoToEG - Intent = " + setActionURI);


// Options indicating where we should send the request to.
    var get_options = {
        host: EG_ip,
        port: EG_Port,
        path: 'index.html?' + EG_Event + '&' + setActionURI
    };
  
    console.log("Sending request to " + get_options.host + ":" + get_options.port + get_options.path);
    // Set up the request
    var get_req = http.request(get_options, function(res) {
        var eg_results = "";
        console.log('callEchoToEG - STATUS : ' + res.statusCode);
        console.log('callEchoToEG - HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            eg_results += chunk;
        });
        res.on('end', function () {
            console.log('Body: ' + eg_results);
            //Parse the Body results from EG, if the command was unknow we will repromt
            if((eg_results.indexOf('intent: UNKNOWN') > -1)||(eg_results.indexOf('cmd is unknown:') > -1)) {
                console.log('callEchoToEG - Results were a unknown command, we will reprompt');
                speechOutput = "Sorry but I did not understand, " +setAction + ", please try again";
                shouldEndSession=false;
            } else {
                console.log('callEchoToEG - Results were a known command, all is good');
                if(eg_results.indexOf('Return Msg: ') > -1) {
                    var lines = eg_results.split('\n');
                    for(var i = 0;i < lines.length;i++){
                        if(lines[i].indexOf('Return Msg: ') > -1) {
                            var rtn_msg = lines[i].split('Msg:')[1].trim();
                            if (rtn_msg !== '') {
                                setAction = rtn_msg;
                            }
                        }
                    }
                        speechOutput = setAction;
                } else {
                    speechOutput = "Got it, working on the command, "+setAction;
                }
            }

            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession)); //Pass stingResult instead of speechOutput for debugging if needed
        });
    });
    get_req.on('error', function (e) {
        console.log(e);
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
    //post the data
    //get_req.write('');
    get_req.end();
    
}

// --------------- WelcomResponse Function ----------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome to Echo To EventGhost";
    var speechOutput = "Hello, I'm this home's automation AI, what can I do for you";


    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "I could not understand, please try again";
    var shouldEndSession = false;
    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helper Functions ----------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "Echo To EventGhost - " + title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}