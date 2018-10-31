//load the things we need
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// set the view engine to ejs
app.set('view engine', 'ejs');

//set the port to use for localhost
const PORT = 8080; // default port 8080

function generateRandomString(x) {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    //comment by tbanik
    return [...Array(x)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
    //limitations are that there is a chance a string could be selected twice
    //a different approach to avaoid this could be to create an incrimenting string which checks the last vlue created in the url database
}

console.log(generateRandomString(6));

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

// single url page 
app.get("/urls/:id", (req, res) => {
    let templateVars = { shortURL: req.params.id, urls: urlDatabase};
    res.render("urls_show", templateVars);
    console.log(req.params.id)
  });

app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    if (longURL === undefined) {
    res.redirect('/urls');
    } else {
    res.redirect(longURL);
    }
  });

app.post("/urls", (req, res) => {
    let longURL = req.body //
    let shortURL = generateRandomString(6);
    urlDatabase[shortURL] = longURL.longURL;
    console.log(urlDatabase);
    res.redirect(`http://localhost:8080/urls/${shortURL}`);
  });


app.listen(PORT, () => {
  console.log(`We're listening on port ${PORT}!`);
});