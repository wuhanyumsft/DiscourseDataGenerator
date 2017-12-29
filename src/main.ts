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
console.log(`size ${count} array ready.`);
async.eachLimit(array, parellel, (index, callback) => {
    client.createTopic(randomText.getTextBlock(titleOptions), randomText.getTextBlock(textOptions), 0, (err: string, body: string, statusCode: number) => {
        if (statusCode === 200) {
            console.log(`${index} uploaded.`);
        } else {
            try {
                let error = JSON.parse(body);
                console.error(`${index} failed: ${error.errors[0]}`);
            } catch {
                console.error(`${index} failed: ${body}`);
            }
        }
        callback();
    });
}, (err) => {
    console.error(err);
});
console.log('Exit success.');
