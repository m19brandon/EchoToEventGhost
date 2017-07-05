## EchoToEventGhost
Thread: http://www.eventghost.net/forum/viewtopic.php?f=2&t=7429

UPDATE VERSION v2.2 07/04/2014
Changes:

1. Added a Welcome post to EG (allows for a custom responses, I'm suggesting an event bases on the time and past event history)
2. The post to EG now has 4 objects in the payload('spoken string', deviceid, sessionid, requestId)
3. Rewrote some of the code, it should look much cleaner
4. Moved to Node.js 6.10 (Should work with Node.js 4.3)

UPDATE VERSION v2.1 03/26/2016
Changes:

1. Added support for EventGhost's Webserver Basic Auth 
2. Better response code handling

UPDATE VERSION v2 03/23/2016
Changes:

1. Result Parsing for unknown command so Alexa can re-prompt if needed.
2. Added result parsing for custom voice speechOutput.

***********************************

Hope all enjoy. :D 

If you are like me, you have been using EventGhost for home automation because you want the customized control this platform allows. Or you are nuts and spend your nights writing code only you will ever see and use. If this is you, you may also have an Amazon Echo seating in the kitchen. Now this $180 kitchen timer is great, but it can do so much more. Now with this new skill, you can pass any spoken command to EventGhost where this intent becomes actionable.

This is a simple AWS Lambda node.js script that packages up the Alexa Skills Kit Intent and will post any spoken command to your EventGhost Webserver as an Event with a payload.

I have added the option to parse the body of the return response from EG webserver to allow for custom replies back. (IE. User: Q - is the garage open. Alexa: A - Yes the garage has been open for 30 minutes)

## Getting Started with EchoToEG

The guide below was mostly copied from this link https://developer.amazon.com/alexa-skills-kit/alexa-skill-quick-start-tutorial I recommend using both, Amazon's has screen shots.

## Step 1 (Create your AWS Lambda function that your skill will use)

1. Download or clone my EchoToEventGhost github project https://github.com/m19brandon/EchoToEventGhost

2. Make sure you have your EventGhost Webserver is running and you can post to from outside your network.

  * Get Your External IP, https://whatismyipaddress.com/
  * Plus the post that your have configured for the Event Ghost webserver to run on (80 is default). If you need help with configuring port forwardinglook here http://www.wikihow.com/Set-Up-Port-Forwarding-on-a-Router
  * To test goto http://ip:port/page?event ie. http://192.168.1.1:80/index.html?EG_Event and a event should be logged in EventGhost

3. If you do not already have an account on AWS, go to Amazon Web Services and create an account.

4. Log in to the AWS Management Console and navigate to AWS Lambda.

5. Click the region drop-down in the upper-right corner of the console and select either **US East (N. Virginia)** or **EU (Ireland)**.
Lambda functions for Alexa skills must be hosted in either the **US East (N. Virginia)** or **EU (Ireland)** region.

6. If you have no Lambda functions yet, click **Get Started Now**. Otherwise, click **Create a Lambda Function**.

7. Under the blueprints, click **Blank Function**.

8. Click in the empty box and select **Alexa Skills Kit**, then next.

9. For the function name enter **EchoToEGv2**, the Description can be left blank, and for the runtime select **Node.js 6.10**

10. Under the **Lambda function** code section leave as **Edit code inline** and then copy in my code.
The code can be found under \EchoToEventGhost\AlexaSkillKit_Code\EchoToEGv2.js

You will need to edit some variables in the code.
  * Line 16: Is your EventGhost Webserver using http and https
  * Line 18: Enter your External IP
  * Line 21: Enter the port number you configured in the EventGhost Webserver
  * Lines 29 & 30 are your EventGhost Webserver user name and password

11. Under the **Lambda function handler and role** section, leave **Handler** and **Role** as is and for **Existing role** select "lamba_basic_execution"

12. Leave the other sections as is and click **Next** and then on the next page click **Create Function**

13. Under **Actions** you can test your function by using the **Configure test event**, change the name of **Hello World** as needed and pasted the contents of \EchoToEventGhost\AlexaSkillKit_Code\EchoToEG_TestEvent.xml (Line 22 is the command that is passed) and then **Save and Test**
If all works you could see an event in your EventGhost log.


## Step 2 (Create your Alexa Skill and link your Lambda function)

1. Sign in to the **Amazon developer portal**. If you haven’t done so already, you’ll need to create a free account. https://developer.amazon.com/edw/home.html#/

2. From the top navigation bar, select **Alexa**.

3. Under **Alexa Skills Kit**, choose **Get Started >**.

4. Choose **Add a New Skill**.

5. Name your skill. This is the name displayed to users in the Alexa app. **Event Ghost** is a good choice.

6. Create an invocation name. This is the word or phrase that users will speak to activate the skill. **Event Ghost** is a good choice. Amazon recommends against signal word invocation name. Click **Save**.

7. Choose **Next** to continue to development of the new skill.

8. In the **Intent Schema** box, paste the JSON code from \EchoToEventGhost\AlexaSkillKit_Code\IntentSchema.txt

9. Skip over the **Custom Slot Types** section.

10. Under **Sample Utterances** paste in contents of \EchoToEventGhost\AlexaSkillKit_Code\Utterances.txt

11. Choose **Next** and wait until the interaction model finishes loading, in no more than a few seconds

12. Select the Endpoint AWS Lambda ARN then paste your ARN code. Select North America as your region, and for Account Linking select No, then choose Next.

This code can be found under the Lambda function create in steps 1.
arn:aws:lambda:us-east-1:#:function:EchoToEGv2

13. There is a new testing tool under the testing tab. Logs can be found here https://console.aws.amazon.com/cloudwatch


14. There is no need to Publish the skill.


## Step 3 (EventGhost, add some code to make stuff happen)

1. Create a new Python Script Macro, copy in the contents of \EchoToEventGhost\EventGhost_Code\PythonScriptExample.py

2. Copy \EchoToEventGhost\EventGhost_Code\index.html into your webserver folder

3. Drag the HTTP.EchoToEG event into that macro to fire.

3. Test your Skill

************

Examples:

* "Alexa, Tell INVOCATION_NAME lights on"
* "Alexa, Tell INVOCATION_NAME to change the channel to ESPN"
* "Alexa, Tell INVOCATION_NAME to turn off the bedroom lights"
