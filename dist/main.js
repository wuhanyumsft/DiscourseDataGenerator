#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var async = require("async");
var _ = require("lodash");
var discourse = require('discourse-siw-sdk');
var targetUrl;
program
    .version("v" + require('../package.json').version)
    .description('A tool to auto generate data in discourse')
    .option('--username [value]', 'Api user name')
    .option('--apikey [value]', 'Api key')
    .option('--count [value]', 'how many time it runs.', 1)
    .option('--parellel [value]', 'the maxnium corrent thread to create data', 1)
    .arguments('<targetSite>')
    .action(function (targetSite) {
    targetUrl = targetSite;
})
    .parse(process.argv);
if (!targetUrl || !program.username || !program.apikey) {
    console.log('Error: must specify target_site, api_username and api_key');
    program.help();
}
var count = 1;
if (program.count) {
    try {
        count = parseInt(program.count, 10);
    }
    catch (e) { }
}
var parellel = 1;
if (program.parellel) {
    try {
        parellel = parseInt(program.parellel, 10);
    }
    catch (e) { }
}
var randomText = require('random-textblock');
// exactly 1 sentce with exactly 8 words
var titleOptions = {
    minWords: 8,
    maxWords: 20,
    minSentences: 1,
    maxSentences: 1
};
var textOptions = {
    minWords: 8,
    maxWords: 20,
    minSentences: 1,
    maxSentences: 100
};
if (!(targetUrl.indexOf('http') === 0)) {
    targetUrl = "http://" + targetUrl;
}
var client = new discourse(targetUrl, program.apikey, program.username);
var title = program.title;
var array = _.range(count);
var categories = [0, 6, 7, 8, 10, 11, 12];
var tags = ['javascript', 'java', 'csharp', 'android', 'jquery', 'python', 'html', 'ios', 'css', 'mysql', 'nodejs', 'xml', 'swift', 'ruby', 'ajax', 'regex'];
console.log("size " + count + " array ready.");
async.eachLimit(array, parellel, function (index, callback) {
    var category = categories[_.random(categories.length - 1)];
    client.createTopic(randomText.getTextBlock(titleOptions), randomText.getTextBlock(textOptions), category, function (err, body, statusCode) {
        try {
            if (statusCode === 200) {
                console.log(index + " uploaded.");
                var response = JSON.parse(body);
                replyTopic(response.topic_id);
            }
            else {
                try {
                    var error = JSON.parse(body);
                    console.error(index + " failed: " + error.errors[0]);
                }
                catch (_a) {
                    console.error(index + " failed: " + body);
                }
            }
        }
        catch (e) {
            console.error(e);
        }
        finally {
            callback();
        }
    }, _.sampleSize(tags, _.random(5)));
}, function (err) {
    console.error(err);
});
console.log('Exit success.');
function replyTopic(topicId) {
    if (_.random(100) > 75) {
        client.replyToTopic(randomText.getTextBlock(textOptions), topicId, function (err, body, statusCode) {
            replyTopic(topicId);
        });
    }
}
