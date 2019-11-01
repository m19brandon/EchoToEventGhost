/**
 * EchoToEG - A custom Amazon Alexa Skill Kit that can send any spoken command to EventGhost
 * v2.3(20191101)
 * 1. Added a Welcome post to EG (allows for a custom responses, I'm suggesting an event bases on the time and past event history)
 * 2. The post to EG now has 5 objects in the payload('spoken string', deviceId, sessionId, requestId, personId)
 * 3. Rewrote some of the code, it should look much cleaner
 * 
 * Brandon Simonsen (m19brandon.shop@gmail.com)
 * https://github.com/m19brandon/EchoToEventGhost
 * EventGhost Thread: http://www.eventghost.net/forum/viewtopic.php?f=2&t=7429
 */

// --------------- Variables that need to be set ----------------

//http or https
var http = require('http');
//Your External IP, https://whatismyipaddress.com/
var EG_ip = '192.168.1.1';
//The port that your have configured for the Event Ghost webserver to run on (80 is default)
//If you need help with configuring your router look here http://www.wikihow.com/Set-Up-Port-Forwarding-on-a-Router
var EG_Port = '80';
//The event that will be posted to EventGhost
var EG_Event = 'EchoToEG';
//Uncomment if you wanted a customized welcome message controlled by EG.
//var EG_Event_Welcome = 'EchoToEGWelcome';
//Leave blank unless you need a specif path (default would be blank)
var EG_uri = '';
//Leave user and password blank if Basic Auth is not used on the EventGhost WebServer
var EG_user = '';
var EG_password = '';

// Adding Seruicty if you want.
//This ID is can be found under the Alexa tab on the amazon developer console page
//Goto https://developer.amazon.com/edw/home.html#/skills > Click 'View Skill ID'
//var Alexa_Skill_ID = 'amzn1.ask.skill.#';

var deviceId = '';
var personId = '';


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    console.log(event);
    try {
        console.log('event.session.application.applicationId=' + event.session.application.applicationId);
        /**
        * Adding Security if you want.
        * Uncomment this if statement and populate with your skill's application ID to
        * prevent someone else from configuring a skill that sends requests to this function.
        */
        /*
        if (event.session.application.applicationId !== Alexa_Skill_ID) {
            console.log('Check the Alexa_Skill_ID value, it did not match')
            console.log('event.session.application.applicationId=' + event.session.application.applicationId);
            console.log('versus');
            console.log('Alexa_Skill_ID=' + Alexa_Skill_ID);
            context.fail('Invalid Application ID');
        }
        */

        // get the deviceId if present
        try {
            deviceId = '';
            if( typeof event.context.System.device.deviceId !== 'undefined' ) {
                deviceId = event.context.System.device.deviceId;
                console.log('deviceId='+deviceId);
            } else {
                console.log('deviceId not found');
            }
        } 
        catch (err) {
            console.log('deviceId not found');
        }
        
        // get the personId if present
        try {
            personId = '';
            if( typeof event.context.System.person.personId !== 'undefined' ) {
                deviceId = event.context.System.person.personId;
                console.log('personId='+personId);
            } else {
                console.log('personId not found');
            }
        } 
        catch (err) {
            console.log('personId not found');
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        dumpError(e);
        context.fail('Exception: ' + e);
    }
};


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output
        },
        card: {
            type: 'Simple',
            title: 'Echo To EventGhost - ' + title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log('onSessionStarted requestId=' + sessionStartedRequest.requestId + ', sessionId=' + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log('onLaunch requestId=' + launchRequest.requestId + ', sessionId=' + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(launchRequest.requestId,session,callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log('onIntent requestId=' + intentRequest.requestId + ', sessionId=' + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        
    // Whatever the Intent is, pass it straight through to 
    // EventGhost
    callEchoToEG(intent,intentRequest.requestId,session,callback);

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log('onSessionEnded requestId=' + sessionEndedRequest.requestId + ', sessionId=' + session.sessionId);
    // Add cleanup logic here
}


// --------------- Functions that control the skill's behavior -----------------------

/**
 * Determines if a session should end based on string search in EG response
 */
function Get_shouldEndSession(string, def)
{
    var end = def;
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

/**
 * This is the main function, this is what sends the intent to EG and then
 * determine what to do based on the response 
 * EG's response
 */

function callEchoToEG(intent,requestId,session,callback)
{
    this.cb = callback;
    var sessionAttributes = '{}';
    var cardTitle = 'Black Box Automation';
    var shouldEndSession = true;
    console.log('SessionEnd='+shouldEndSession.toString());

    var payload = '';
    var speechOutput = '';
    var repromptText = 'I could not understand, please try again';
    var i = 0;
    var slots = intent.slots;
    
    //Pull the spoken text and format
    var actionSlot = intent.slots.Action;
    var setAction = actionSlot.value.toLowerCase();
    var setActionURI = require('querystring').escape(setAction);
    console.log('callEchoToEG - Intent name = ' + intent.name);
    console.log('callEchoToEG - Intent = ' + setAction);
    console.log('callEchoToEG - Intent = ' + setActionURI);


// Options included where we should send the request to with or without basic auth
    EG_uri = '/index.html?' + EG_Event + '&' + setActionURI + '&' + deviceId + '&' + session.sessionId + '&' + requestId + '&' + personId;
    
    
    sendToEG(EG_uri,function(body) {
        var eg_results = body;
        if (eg_results != 'Error') {
            console.log('Body: ' + eg_results);
            //Parse the Body results from EG, if the command was unknow we will repromt
            if((eg_results.indexOf('intent: UNKNOWN') > -1)||(eg_results.indexOf('cmd is unknown:') > -1)) {
                console.log('callEchoToEG - Results were a unknown command, we will reprompt');
                speechOutput = 'Sorry but I did not understand, ' +setAction + ', please try again';
                shouldEndSession = Get_shouldEndSession(eg_results,shouldEndSession);
            } else {
                console.log('callEchoToEG - Results were a known command, all is good');
                if(eg_results.indexOf('Return Msg: ') > -1) {
                    var lines = eg_results.split('\n');
                    for(var ix = 0;ix < lines.length;ix++){
                        if(lines[ix].indexOf('Return Msg: ') > -1) {
                            var rtn_msg = lines[ix].split('Msg:')[1].trim();
                            if (rtn_msg !== '') {
                                setAction = rtn_msg;
                                shouldEndSession = Get_shouldEndSession(eg_results,shouldEndSession);
                            }
                        }
                    }
                    speechOutput = setAction;
                } else {
                    speechOutput = 'Got it, working on the command, '+setAction;
                    shouldEndSession = Get_shouldEndSession(eg_results,shouldEndSession);
                }
            }
        } else {
            console.log('callEchoToEG - Error, EventGhost response error');
            speechOutput = 'Error, EventGhost response error';
        }
    console.log('SessionEnd='+shouldEndSession.toString());
    this.cb({},buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    //callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession)); //Pass stingResult instead of speechOutput for debugging if needed
    }.bind(this));
}

/**
 * This is function is similar to callEchoToEG but handles the welcome message.
 */

function getWelcomeResponse(requestId,session,callback)
{
    this.cb = callback;
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = 'Welcome to Echo To EventGhost';
    var speechOutput = "Hello, I'm this home's automation AI, what can I do for you";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = 'I could not understand, please try again';
    var shouldEndSession = false;

    /**
     * Get customer Welcome prompt from EG, the default is to use pre-defined
     * information above.
     */
    if( typeof EG_Event_Welcome !== 'undefined' ) {
        EG_uri = '/index.html?' + EG_Event_Welcome + '&&' + deviceId + '&' + session.sessionId + '&' + requestId + '&' + personId;
        sendToEG(EG_uri,function(body) {
            var egw_results = body;
            if (egw_results != 'Error') {
            console.log('Body: ' + egw_results);
            //Parse the Body results from EG, if the command was unknow we will repromt
                console.log('getWelcomeResponse - Results');
                if(egw_results.indexOf('Welcome Msg: ') > -1) {
                    var lines = egw_results.split('\n');
                    var setWelcomeMsg = '';
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
                console.log('callEchoToEG - Error, EventGhost response error');
                speechOutput = 'Error, EventGhost response error';
            }
        console.log('SessionEnd='+shouldEndSession.toString());
        this.cb({},buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        }.bind(this));
    } else {
        console.log('SessionEnd='+shouldEndSession.toString());
        this.cb({},buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    //callback(sessionAttributes,buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Reusable function that handle the post to EG
 */

function sendToEG(uri,cb) {
// Options included where we should send the request to with or without basic auth
    EG_uri = uri;
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
    
    console.log('sendToEG - Start0');
    console.log('sendToEG - Sending request to ' + get_options.host + ':' + get_options.port + get_options.path);
    // Set up the request
    console.log('sendToEG - Start1');
    //var eg_results = '';
    return http.get(get_options,function(res) {
        res.setEncoding('utf8');
        // Continuously update stream with data
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {

            try {
                console.log(body);
                //var parsed = JSON.parse(body);
                cb(body);
                //return parsed.MRData;
            } catch (err) {
                console.error('Unable to parse response as JSON', err);
                dumpError(err);
                throw(err);
            }
        });
    }).on('error', function(err) {
        // handle errors with the request itself
        console.error('Error with the request:', err.message);
        dumpError(err);
        throw(err);
    });
}

function dumpError(err) {
  if (typeof err === 'object') {
    if (err.message) {
      console.log('\nMessage: ' + err.message)
    }
    if (err.stack) {
      console.log('\nStacktrace:')
      console.log('====================')
      console.log(err.stack);
    }
  } else {
    console.log('dumpError :: argument is not an object');
  }
}

// --------------- End ----------------
