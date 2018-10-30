//load the things we need
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// set the view engine to ejs
app.set('view engine', 'ejs');

//set the port to use for localhost
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// home 
app.get('/', function(req, res) {
    res.render('urls_index');
});

// url list page 
app.get('/urls', function(req, res) {
    let templateVars = { urls: urlDatabase };
    res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
  });

// url list page 
app.get('/urls/:id', function(req, res) {
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
    res.render('urls_show', templateVars);
});

app.post("/urls", (req, res) => {
    console.log(req.body);  // debug statement to see POST parameters
    res.send("Ok");         // Respond with 'Ok' (we will replace this)
  });


app.listen(PORT, () => {
  console.log(`We're listening on port ${PORT}!`);
});