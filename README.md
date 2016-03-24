# EchoToEventGhost
Thread: http://www.eventghost.net/forum/viewtopic.php?f=2&t=7429

If you are like me, you have been using EventGhost for home automation because you want the customized control this platform allows. Or you are nuts and spend your nights writing code only you will ever see and use. If this is you, you may also have an Amazon Echo seating in the kitchen. Now this $180 kitchen timer is great, but it can do so much more. Now with this new skill, you can pass any spoken command to EventGhost where this intent becomes actionable.

This is a simple AWS Lambda node.js script that packages up the Alexa Skills Kit Intent and will post any spoken command to your EventGhost Webserver as an Event with a payload.

I have added the option to parse the body of the return response from EG webserver to allow for custom replies back. (IE. User: Q - is the garage open. Alexa: A - Yes the garage has been open for 30 minutes)

Getting Started with EchoToEG

Note: If you haven't created an Alexa Skills Kit Lambda before, it's best to read "Developing an Alexa Skill as a Lambda Function"
https://developer.amazon.com/public/sol ... a-function Get the Color Game demo working and then use the same approach but use my code.

0. Extract the .zip file and make sure your EG Webserver is running.

1. Rename "EchoToEG.js" to "index.js" follow the instructions for Creating a Lambda Function for an Alexa Skill, using the "index.js" code rather than the template code.

2. At the top of the file, find and added your webserver's external IP for EG_ip and port for EG_port. Also, add the applicationId to Echo_App_ID.

3. Follow the remaining steps to finish creating the Lambda function and, most importantly, assigning a basic execution Role in order to allow the Alexa skill to make use of the Lambda.

4. Once you've saved the Lambda and go back to the "Function List" page, you'll see your Lambda listed and below it, the label "Function ARN" followed by a string starting with "arn:" (e.g., "arn:aws:lambda:us-east-1:201599999999:function:Function-Name". Take note of this as you'll need it to tell your Alexa Skill what function to call.

5. Make sure you add the Alexa skill in the AWS Function.

6. Use the sample the two sample files for the IntentSchema and Utterances.

7. You will most likely need to port forward from your router to your EG webserver.

8. Add the index.html to your Webserver path. Note the {{bb_response}} in the text is for a Temporary variable that needs to be set in an EG Macro

9. Create a macro based on Marco_AmazonEchoRcv.txt. By default, I have set the Python Script in this macro to return a 'cmd is unknown' response. I use a Jump To and Return to do my custom code which then changes the response to a good response with a custom response to be spoken back to the user.

Example of EG response to the POST (v2 custom response is parsing for 'Return Msg:')

Results Received:
Cmd: turn off the tv
intent: tv
confidence: 0.988
entities: {u'action': [{u'type': u'value', u'value': u'off'}], u'channel': [{u'suggested': True, u'type': u'value', u'value': u'tv'}]}
Trigger: ip2ir_Family_All_Power_Off
Return Msg: turning off the family room tv

Examples:
"Alexa, Tell INVOCATION_NAME to change the channel to ESPN"
"Alexa, Tell INVOCATION_NAME to turn off the bedroom lights"
