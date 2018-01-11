#!/usr/bin/env node
import * as request from 'request';
import * as program from 'commander';
import * as async from 'async';
import * as _ from 'lodash';
let discourse = require('discourse-sdk');

let targetUrl: string;
program
.version(`v${require('../package.json').version}`)
.description('A tool to auto generate data in discourse')
.option('--username [value]', 'Api user name')
.option('--apikey [value]', 'Api key')
.option('--count [value]', 'how many time it runs.', 1)
.option('--parellel [value]', 'the maxnium corrent thread to create data', 1)
.arguments('<targetSite>')
.action(function (targetSite: string) {
    targetUrl = targetSite;
 })
.parse(process.argv);

if (!targetUrl || !program.username || !program.apikey) {
    console.log('Error: must specify target_site, api_username and api_key');
    program.help();
}

let count = 1;
if (program.count) {
    try {
        count = parseInt(program.count, 10);
    } catch (e) {}
}

let parellel = 1;
if (program.parellel) {
    try {
        parellel = parseInt(program.parellel, 10);
    } catch (e) {}
}

const randomText = require('random-textblock');
// exactly 1 sentce with exactly 8 words
const titleOptions = {
  minWords: 8,
  maxWords: 20,
  minSentences: 1,
  maxSentences: 1
};
const textOptions = {
    minWords: 8,
    maxWords: 20,
    minSentences: 1,
    maxSentences: 100
};

if (!(targetUrl.indexOf('http') === 0)) {
    targetUrl = `http://${targetUrl}`;
}

let client = new discourse(targetUrl, program.apikey, program.username);

let title: string = program.title;

let array = _.range(count);
let categories = [0, 6, 7, 8, 10, 11, 12];
console.log(`size ${count} array ready.`);
async.eachLimit(array, parellel, (index, callback) => {
    let category = categories[_.random(categories.length - 1)];
    client.createTopic(randomText.getTextBlock(titleOptions), randomText.getTextBlock(textOptions), category, (err: string, body: string, statusCode: number) => {
        try {
            if (statusCode === 200) {
                console.log(`${index} uploaded.`);
                let response = JSON.parse(body);
                replyTopic(response.topic_id);
            } else {
                try {
                    let error = JSON.parse(body);
                    console.error(`${index} failed: ${error.errors[0]}`);
                } catch {
                    console.error(`${index} failed: ${body}`);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            callback();
        }
    });
}, (err) => {
    console.error(err);
});
console.log('Exit success.');

function replyTopic(topicId: string) {
    if (_.random(100) > 75) {
        client.replyToTopic(randomText.getTextBlock(textOptions), topicId, (err: string, body: string, statusCode: number) => {
            replyTopic(topicId);
        });
    }
}
