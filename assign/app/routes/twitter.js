const express = require('express');
const logger = require('morgan');
const app = express();
const axios = require("axios");
const router = express.Router();
router.use(logger('tiny'));
var Twit = require('twit');
const server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
const responseTime = require('response-time');
const redis = require('redis');

require('dotenv').config();
const AWS = require('aws-sdk');

// Cloud services setup
// create unique bucket name
const bucketName = 'nhavilah-cab432-twitter-storage';

// create a promise on S3 service object
const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();
bucketPromise.then(function (data) {
    console.log("Successfully created " + bucketName);
}).catch(function (err) {
    console.error(err, err.stack);
});

// create and connect redis client to local instance.
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
    console.log("Error " + err);
});

// use response-time as a middleware
app.use(responseTime());

var T = new Twit({
    consumer_key:         'pXoX1DPcMooGje3jECA4ijHDR',
    consumer_secret:      'FlUJvouA1zrFuERX4ExTjMUFQ4Bfo1kmGpySMjMwoRyhpIK9Rq',
    access_token:         '1443764547085422597-LxGhqq0aQCkGQ3hf2IqUpeSH8dhTVA',
    access_token_secret:  'W2I4C9pBRw2MIHMAcJ8kGpN5btWEtB6SqpSibL8YR2w1E',
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });


router.post('/:number', (req,res) => {
    //keep the tweets array as a public item so we can apppend all tweets at to it
    let tweetArray=[]
    let tweets = req.body.tweets
    console.log(tweets)
    const currentDate = new Date();
    const currentDayOfMonth = currentDate.getDate();
    const currentMonth = currentDate.getMonth(); // Be careful! January is 0, not 1
    const currentYear = currentDate.getFullYear();
    const timestamp = currentDayOfMonth+'-'+currentMonth+'-'+currentYear
    const redisKey = `twitter:${tweets}`;
    const s3Key = `twitter-${tweets}`;
    

    //try the cache
    return redisClient.get(redisKey,(err,result) => {
        console.log(result)
        if(result !== null) {
            //serve from cache
            const resultJSON = JSON.parse(result);
            resultJSON.source = 'Redis Cache';

            return res.send(resultJSON);
        }
        else{
            //check s3
            const params = { Bucket: bucketName, Key: s3Key};
            //check s3 and serve if it exists in there
            return new AWS.S3({apiVersion: '2006-03-01'}).getObject(params, (err,result) => {
                if(result) {
                    //serve from s3 and store in redis just in case
                    const resultJSON = JSON.parse(result.Body);
                    redisClient.setex(redisKey,3600,JSON.stringify({source: 'Redis',...resultJSON}));
                    resultJSON.source = 'S3';
                    return res.end(JSON.stringify(resultJSON));
                } else {
                    for(let i = 0; i < tweets.length; i++) {
                        T.get('search/tweets', { q:tweets[i] , count: req.params.number }, function(err, data, response) {
                            if(data.statuses.length >= req.params.number-2){
                                for (let index = 0; index < data.statuses.length; index++) {
                                    x = data.statuses[index].text;
                                    tweetArray.push(x)
                                }
                                
                                if(tweetArray.length >= (tweets.length*req.params.number)-1){
                                let tweetBody = tweetArray
                                //serve from wikipedia api and store in s3 and redis
                                const body = JSON.stringify({ source: 'S3 Bucket', ...tweetBody});
                                const objectParams = {Bucket: bucketName, Key: s3Key, Body: body};
                                const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
                                uploadPromise.then(function(data) {
                                    console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
                                });
                                redisClient.setex(redisKey,3600,JSON.stringify({source: 'Redis',...tweetBody,}));
                                res.end(body);
                                }
                            }
                            else{
                                res.end(JSON.stringify("Bad Tweet Request"));
                            }

                        })
                    }
                }
            })
        }
    });    
});
    
module.exports = router; 