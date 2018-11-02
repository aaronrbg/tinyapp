//load the things we need
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  //keys: process.env.COOKIE_SESSION_KEYS,
  secret: 'supersecret',
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// set the view engine to ejs
app.set('view engine', 'ejs');

//set the port to use for localhost
const PORT = 8080; // default port 8080

function generateRandomString(x) {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    //comment by tbanik
    return [...Array(x)].map(i=>(~~(Math.random()*36)).toString(36)).join('');
    //limitations are that there is a chance a string could be selected twice
    //a different approach to avaoid this could be to create an incrimenting 
    //string which checks the last vlue created in the url database
}

//create databases with default values
const urlDatabase = {
  'b2xVn2': {
    'creator': 'a',
    "longURL": "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    'creator': 'a',
    "longURL": "http://www.google.com"
  }
}
const users = {}

function urlsForUser(userID) {
  let userURLdatabase = {};
  if (userID) {
    for (let urlID in urlDatabase) {
      if (urlDatabase[urlID].creator === userID.id) {
        userURLdatabase[urlID] = urlDatabase[urlID].longURL;
      }
    }
    return userURLdatabase;
  }
}

// home 
app.get('/', function(req, res) {
    if (req.session.user_id) {
      res.redirect('/urls');
    } else {
      res.redirect('/login');
    }
});

app.get('/register', function(req, res) {
  let templateVars = {
    user: req.session.user_i
  }
  res.render('register', templateVars);
});

app.get('/login', function(req, res) {
  let templateVars = {
    user: req.session.user_i
  }
  res.render('login', templateVars);
});

// url list page 
app.get('/urls', function(req, res) {
    let templateVars = { 
      urls: urlsForUser(req.session.user_id),
      user: req.session.user_id
    };
    res.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = {
      user: req.session.user_id
    }
    if (req.session.user_id) {
      res.render("urls_new", templateVars);
    } else {
      res.redirect('/login')
    }
  });

// single url page 
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.send('please log in to edit your links');
  } else if (req.session.user_id.id !== urlDatabase[req.params.id].creator) {
    res.send('this link does not belong to you');
  } else {
    let templateVars = { 
      shortURL: req.params.id, 
      urls: urlsForUser(req.session.user_id),
      user: req.session.user_id
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  });

app.post("/register", (req, res) => {
    if (!req.body.email || !req.body.password) {
      res.statusCode = 400;
      res.send('No email or password entered');
      return;
    }
    for(let account in users){
      if (users[account].email === req.body.email) {
      res.statusCode = 400;
      res.send('That account already exists');
      return;
      }
    }
    let userID = generateRandomString(8)
    let password = req.body.password;
    users[userID] = {
      id: userID,
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(password, 10)
    }
    req.session.user_id = users[userID];
    res.redirect('/urls');
  });

app.post("/login", (req, res) => {
    if (!req.body.email || !req.body.password) {
      res.statusCode = 400;
      res.send('No email or password entered');
      return;
    }
    for(let userID in users){
      let username = users[userID].email;
      let hashedPassword = users[userID].hashedPassword;
      if (username === req.body.email && bcrypt.compareSync(req.body.password, hashedPassword)) {
        req.session.user_id = users[userID];
        res.redirect('/urls?login_success')
        return;
      }
    }
    //if username and pswerd were entered but username isnt found, tell user
    res.statusCode = 403;
    res.send('Wrong username or password');
    res.redirect('/urls');
  });
  
app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect('/urls');
})

app.post("/urls/new", (req, res) => {
    let longURL = req.body.longURL;
    let shortURL = generateRandomString(6);
    let user = req.session.user_id.id;
    urlDatabase[shortURL] = {
      'creator': user,
      'longURL': longURL
    }
    res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});