'use strict';
console.log('Loading function');

const https = require('https');
const http = require('http');
const url = require('url');
const slack_url = 'https://hooks.slack.com/services/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';
const slack_req_opts = url.parse(slack_url);
slack_req_opts.method = 'POST';
slack_req_opts.headers = {
  'Content-Type': 'application/json'
};

var giphy_tag = 'milk';
var giphy_rating = 'pg';

var giphy_ids = [
  "sAY2wh0zK1z68",
  "li6pFaccMPsnm",
  "Rs9fChcbRs6qc",
  "u8VZs510bfqj6",
  "yH3wJkUbY7DpK",
  "aacOScXMXvjpK",
  "HUWmownHjnjR6",
  "n0nbF9Jhp3Dyg",
  "Ew3n0zJ5kGyyI"
];

var channel = "#notifications";
var username = "creamer-bot";
var icon_emoji = ":cow:";

var single_click_fallback = 'More creamer, please?!';
var single_click_pretext  = ':cold_sweat: :cold_sweat: :cold_sweat:';
var single_click_message  = 'More creamer, please?!';

var double_click_fallback = 'You now have creamer for your coffee!';
var double_click_pretext  = ':cow: :cow: :cow:';
var double_click_message  = 'You now have creamer for your coffee!';

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
      fallback: single_click_fallback,
      pretext: single_click_pretext,
      color: "#000000",
      fields: [{
        "value": single_click_message,
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

    http.get(giphy(giphy_ids[Math.floor(Math.random()*giphy_ids.length)]), (res) => {
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
            fallback: double_click_fallback,
            pretext: double_click_pretext,
            color: "#000000",
            image_url: `${json.data.images.downsized.url}`,
            fields: [{
              "value": double_click_message,
              "short": false
            }]
          }]
        };
        slack_req.write(JSON.stringify(double_click_params));
        slack_req.end();
      });
    });
  }
};

function giphy(id) {
  var giphy_url = `http://api.giphy.com/v1/gifs/${id}?api_key=dc6zaTOxFJmzC`;
  return giphy_url;
}
