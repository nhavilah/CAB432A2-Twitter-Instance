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

var T = new Twit({
    consumer_key:         'pXoX1DPcMooGje3jECA4ijHDR',
    consumer_secret:      'FlUJvouA1zrFuERX4ExTjMUFQ4Bfo1kmGpySMjMwoRyhpIK9Rq',
    access_token:         '1443764547085422597-LxGhqq0aQCkGQ3hf2IqUpeSH8dhTVA',
    access_token_secret:  'W2I4C9pBRw2MIHMAcJ8kGpN5btWEtB6SqpSibL8YR2w1E',
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  });


router.post('/:number', (req,res) => {
    //keep the tweets array as a public item so we can apppend all tweets at to it
    const tweetArray=[]
    let tweets = req.body.tweets
    for(let i = 0; i < tweets.length; i++) {
        T.get('search/tweets', { q:tweets[i] , count: req.params.number }, function(err, data, response) {
            for (let index = 0; index < data.statuses.length; index++) {
                x = data.statuses[index].text;
                tweetArray.push(x)
           }
           if(tweetArray.length === tweets.length*req.params.number){
            console.log("done")
            res.write(JSON.stringify(tweetArray));
            res.end();
           }
        })
    }
    });
    
    
    


module.exports = router;
