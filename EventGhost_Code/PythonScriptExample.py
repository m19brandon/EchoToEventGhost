import random

GOODBYE_RESPONSES = ["talk to you later", "peace", "I'm out", "talk to you next time", "I live to serve", "good bye", "bye bye", "goodbye and goodluck"]

eg.globals.bb_cmd = ''
eg.globals.bb_location = ''
eg.globals.bb_session = ''
eg.globals.bb_request = ''
ReturnMsg = ''
EndSession = 'yes'

#Example of what could be done with the event from Alexa
if len(eg.event.payload) > 2:
    #This is an example of the command "lights on"
    eg.globals.bb_cmd = eg.event.payload[0]
    eg.globals.bb_location =  eg.event.payload[1] #Location (deviceID)
    eg.globals.bb_session = eg.event.payload[2] #SessionID
    eg.globals.bb_request = eg.event.payload[3] #RequestID
    
    print 'BlackBox Command Received: ' + eg.globals.bb_cmd \
    + '\nDevice Location: ' + eg.globals.bb_location \
    + '\nSessionID: ' + eg.globals.bb_session \
    + '\nRequestID: ' + eg.globals.bb_request
    
    if eg.globals.bb_cmd == 'lights on':
        #Action
        eg.TriggerEvent('some_lights_on')
        ReturnMsg = 'Got it, turning on the lights, ' + random.choice(GOODBYE_RESPONSES)
        EndSession = 'yes'
        
        #Move advance but you can re-prompt for things like which bedroom, build out a conversation with the bb_session and bb_request
        #ReturnMsg = 'which bebroom'
        #EndSession = 'no'
    else:
        #We did not understand the command, re-prompt with follow up action.
        ReturnMsg = 'I did not understand the command ' + eg.globals.bb_cmd + ' , please try a command like lights on'
        #This will end the session but if you wanted to ask a follow up question say no (see commented out example below)
        EndSession = 'no'
else:
    print 'Something went what, not enough objects in the payload'
    ReturnMsg = 'There was an error, ' + random.choice(GOODBYE_RESPONSES)
    EndSession = 'yes'
    

#Formate the response message to Alexa
eg.globals.bb_msg = 'Return Msg: ' + ReturnMsg + \
'\nEndSession: ' + EndSession
print eg.globals.bb_msg

#This will pass a formated response to the index.html page which is read by your Alexa skill as a response.
eg.plugins.Webserver.SetValue(u'bb_response', u'{eg.globals.bb_msg}', False, False)
