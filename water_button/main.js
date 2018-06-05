'use strict';
console.log('Loading function');

const https = require('https');
const url = require('url');
const slack_url = 'https://hooks.slack.com/services/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';
const slack_req_opts = url.parse(slack_url);
slack_req_opts.method = 'POST';
slack_req_opts.headers = {
  'Content-Type': 'application/json'
};

var giphy_tag = 'drinking+water';
var giphy_rating = 'pg';

var channel = "#notifications";
var username = "water-bot";
var icon_emoji = ":sweat_drops:";

var single_click = {
  fallback: 'We need water!',
  pretext: ':cold_sweat: :cold_sweat: :cold_sweat:',
  message: 'We need water!'
}

var double_click = {
  fallback: 'Water is now refilled!',
  pretext: ':sweat_drops: :sweat_drops: :sweat_drops:',
  message: 'Water is now refilled!'
}

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
      fallback: single_click.fallback,
      pretext: single_click.pretext,
      color: "#000000",
      fields: [{
        "value": single_click.message,
        "short": false
      }]
    }]
  };

  // Send slack message on single click to request more coffee, double click when refilled
  if (event.clickType == 'SINGLE') {

    // Successfull response
    console.log("sending slack message");
    slack_req.write(JSON.stringify(single_click_params));
    slack_req.end();

  } else if (event.clickType == 'DOUBLE') {
    // Send a request to the test api slack integration

    https.get(giphy(giphy_tag, giphy_rating), (res) => {
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
            fallback: double_click.fallback,
            pretext: double_click.pretext,
            color: "#000000",
            image_url: `${json.data.fixed_height_downsampled_url.replace('200_d', 'giphy-downsized')}`,
            fields: [{
              "value": double_click.message,
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

function giphy(tag, rating) {
  var giphy_url = `https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&rating=${rating}&tag=${tag}`;
  return giphy_url;
}
