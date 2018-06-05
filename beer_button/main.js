'use strict';
console.log('Loading function');

const aws = require('aws-sdk');
const sns = new aws.SNS({region: 'us-west-2'});
const https = require('https');
const url = require('url');
const slack_url = 'https://hooks.slack.com/services/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';
const slack_req_opts = url.parse(slack_url);
slack_req_opts.method = 'POST';
slack_req_opts.headers = {
  'Content-Type': 'application/json'
};

var channel = "#notifications";
var username = "beer-bot";
var icon_emoji = ":beer:";

// Set up the code to call when the Lambda function is invoked
exports.handler = (event, context, callback) => {
  // Load the message passed into the Lambda function into a JSON object
  var eventText = JSON.stringify(event, null, 2);

  // Log a message to the console, you can view this text in the Monitoring tab in the Lambda console or in the CloudWatch Logs console
  console.log("Received event:", eventText);

  // Create a string extracting the click type and serial number from the message sent by the AWS IoT button
  var messageText = "Received  " + event.clickType + " message from button ID: " + event.serialNumber;

  // Write the string to the console
  console.log("Message to send: " + messageText);

  // Send a request to the test api slack integration
  var slack_req = https.request(slack_req_opts, function(res) {
    if (res.statusCode === 200) {
      context.succeed('posted to slack');
    } else {
      context.fail('status code: ' + res.statusCode);
    }
  });

  slack_req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    context.fail(e.message);
  });

  var single_click_params = {
    channel: channel,
    username: username,
    icon_emoji: icon_emoji,
    attachments: [{
      fallback: "Beer levels are running dangerously low!",
      pretext: ":cold_sweat: :cold_sweat: :cold_sweat:",
      color: "#000000",
      fields: [{
        "value": "Beer levels are running dangerously low!",
        "short": false
      }]
    }]
  };


  var text_message_params = {
    Message: "We're out of beer! Please refill us!",
    TopicArn: "arn:aws:sns:us-west-2:723902249713:BeerRun"
  };

  // Send text message and slack message on single click to request more beer, double click when refilled
  if (event.clickType == 'SINGLE') {
    console.log("sending SMS message");
    sns.publish(text_message_params, function(err, data) {
      if (err) {
        // an error occurred
        context.fail('error: ' + err + err.stack);
      }
      else {
        // Successfull response
        console.log("sending slack message");
        slack_req.write(JSON.stringify(single_click_params));
        slack_req.end();
      }
    });
  } else if (event.clickType == 'DOUBLE') {
    // Send a request to the test api slack integration

    https.get(giphy('beer'), (res) => {
      let str = '';
      res.on('data', function(chunk) {
        str += chunk;
      });

      res.on('end', function() {
        var json = JSON.parse(str);
        var double_click_params = {
          channel: channel,
          username: username,
          icon_emoji: icon_emoji,
          attachments: [{
            fallback: "Beer is now refilled!",
            pretext: `:beer: :beer: :beer:`,
            color: "#000000",
            image_url: `${json.data.fixed_height_downsampled_url.replace('200_d', 'giphy-downsized')}`,
            fields: [{
              "value": `Beer is now refilled!`,
              "short": false
            }]
          }]
        };
        console.log(json.data.image_url);
        slack_req.write(JSON.stringify(double_click_params));
        slack_req.end();
      });
    });
  }
};

function giphy(tag) {
  var giphy_url = `https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&rating=pg-13&tag=${tag}`;
  return giphy_url;
}
