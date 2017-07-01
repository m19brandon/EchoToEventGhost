/*
****** Pulls speech input and passes on to Event Ghost for custom events *****
v2 - added the reprompt flag with message and ID
*/
var http = require('http');

var EG_ip = '97.100.217.225';
var EG_Port = '8084';
var EG_Event = 'EchoToEG';
var EG_Event_Welcome = 'EchoToEGWelcome';
var EG_uri = '';
//Leave user and password blank if Basic Auth is not used on the EventGhost WebServer
var EG_user = 'master';
var EG_password = '4077333619';

//var Echo_App_ID = "amzn1.echo-sdk-ams.app.3847036a-4e6c-47e4-b6c8-11bd202c6469";
var Echo_App_ID = "amzn1.ask.skill.c3a0d497-615b-4a3a-a823-b8b154a9fa19";

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
    getWelcomeResponse(callback,session);
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


function Get_shouldEndSession(string, def)
{
    end = def;
    if(string.indexOf('EndSession: ') > -1) {
        var lines = string.split('\n');
        for(var i = 0;i < lines.length;i++){
            if(lines[i].indexOf('EndSession: ') > -1) {
                var es = lines[i].split('EndSession:')[1].trim();
                if (es === 'yes') {
                    end = true;
                }
                if (es === 'no') {
                    end = false;
                }
            }
        }
    }

    return end;
}

// This is where new callEchoToEG functions goes

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


// Options included where we should send the request to with or without basic auth
    EG_uri = '/index.html?' + EG_Event + '&' + setActionURI + '&' + 'master';
    var get_options = '';
    if (EG_user === '') {
        get_options = {
            host: EG_ip,
            port: EG_Port,
            path: EG_uri
        };
    } else {
        get_options = {
            host: EG_ip,
            port: EG_Port,
            path: EG_uri,
            headers: {
                'Authorization': 'Basic ' + new Buffer(EG_user + ':' + EG_password).toString('base64')
            }
        };
    }
  
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
            if (res.statusCode === 200) {
                console.log('Body: ' + eg_results);
                //Parse the Body results from EG, if the command was unknow we will repromt
                if((eg_results.indexOf('intent: UNKNOWN') > -1)||(eg_results.indexOf('cmd is unknown:') > -1)) {
                    console.log('callEchoToEG - Results were a unknown command, we will reprompt');
                    speechOutput = "Sorry but I did not understand, " +setAction + ", please try again";
                    shouldEndSession=Get_shouldEndSession(eg_results,shouldEndSession);
                } else {
                    console.log('callEchoToEG - Results were a known command, all is good');
                    if(eg_results.indexOf('Return Msg: ') > -1) {
                        var lines = eg_results.split('\n');
                        for(var i = 0;i < lines.length;i++){
                            if(lines[i].indexOf('Return Msg: ') > -1) {
                                var rtn_msg = lines[i].split('Msg:')[1].trim();
                                if (rtn_msg !== '') {
                                    setAction = rtn_msg;
                                    shouldEndSession=Get_shouldEndSession(eg_results,shouldEndSession);
                                }
                            }
                        }
                            speechOutput = setAction;
                    } else {
                        speechOutput = "Got it, working on the command, "+setAction;
                        shouldEndSession=Get_shouldEndSession(eg_results,shouldEndSession);
                    }
                }
            } else {
                console.log('callEchoToEG - Error, EventGhost response code was ' + res.statusCode);
                speechOutput = "Error, EventGhost response code was " + res.statusCode;
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

function getWelcomeResponse(callback,session)
{
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome to Echo To EventGhost";
    var speechOutput = "Hello, I'm this home's automation AI, what can I do for you";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "I could not understand, please try again";
    var shouldEndSession = false;

    ////////////////////////////////
    //Get customer Welcome prompt with suggestion
    ////////////////////////////////
    EG_uri = '/index.html?' + EG_Event_Welcome + '&' + '' + '&' + session.sessionId;
    var get_options = '';
    if (EG_user === '') {
        get_options = {
            host: EG_ip,
            port: EG_Port,
            path: EG_uri
        };
    } else {
        get_options = {
            host: EG_ip,
            port: EG_Port,
            path: EG_uri,
            headers: {
                'Authorization': 'Basic ' + new Buffer(EG_user + ':' + EG_password).toString('base64')
            }
        };
    }

    console.log("Sending request to " + get_options.host + ":" + get_options.port + get_options.path);
    // Set up the request
    var get_req_welcome = http.request(get_options, function(res) {
        var eg_results = '';
        console.log('getWelcomeResponse - STATUS : ' + res.statusCode);
        console.log('getWelcomeResponse - HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            eg_results += chunk;
        });
        res.on('end', function () {
            if (res.statusCode === 200) {
                console.log('Body: ' + eg_results);
                //Parse the Body results from EG, if the command was unknow we will repromt
                    console.log('getWelcomeResponse - Results');
                    if(eg_results.indexOf('Welcome Msg: ') > -1) {
                        var lines = eg_results.split('\n');
                        for(var i = 0;i < lines.length;i++){
                            if(lines[i].indexOf('Welcome Msg: ') > -1) {
                                var rtn_msg = lines[i].split('Msg:')[1].trim();
                                if (rtn_msg !== '') {
                                    setWelcomeMsg = rtn_msg;
                                }
                            }
                        }
                            speechOutput = setWelcomeMsg;
                    }
            } else {
                console.log('getWelcomeResponse - Error, EventGhost response code was ' + res.statusCode);
                speechOutput = "Error, EventGhost response code was " + res.statusCode;
            }
            callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    });
    get_req_welcome.on('error', function (e) {
        console.log(e);
        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
    get_req_welcome.end();
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