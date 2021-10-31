const express = require('express');
const app = express();
const path = require('path');
const twitterSearch = require('./routes/twitter.js');

const hostname = '0.0.0.0';
const port = 3006;


//load views and static sources for use in app
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use('/static',express.static('./src'))
//define home route
app.get('/', (req, res) => {
 res.render("index")
});
//define routes to hit for API searches
app.use(express.json())
app.use('/tweets',twitterSearch)

app.listen(port, function () {
 console.log(`Express app listening at http://${hostname}:${port}/`);
});
