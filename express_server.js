// load the things we need
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session')
;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  // keys: process.env.COOKIE_SESSION_KEYS <- requires .env file. othwerwise use 'supersecret' below
  secret: 'supersecret',
}));

// set the view engine to ejs
app.set('view engine', 'ejs');

// random generator for creatinpmng unique ids
// source: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript //comment by tbanik
function generateRandomString(x) {
  return [...Array(x)].map(i => (~~(Math.random() * 36)).toString(36)).join('');
}

// helper function to serve a filtered database according to what user is logged in
function urlsForUser(userID) {
  const userurl_db = {};
  if (userID) {
    for (const urlID in url_db) {
      if (url_db[urlID].creator === userID.id) {
        userurl_db[urlID] = url_db[urlID].longURL;
      }
    }
    return userurl_db;
  }
}

// set the port to use for localhost
const PORT = 8080; // default port 8080

// create init databases with some default values
const url_db = { ea29ps: { creator: '1p5whfmt', longURL: 'http://festivalworlds.com' } };
const users = { '1p5whfmt': { id: '1p5whfmt', email: 'a@a', hashedPassword: /* 'a' */ '$2b$10$fmZojVzHnrdMlMwdhSP7uOKd/kYllv9G3xxzqH.Iym8QZpi14BKvK' } };

// home route
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// login page | home redirect when no user is logged in
app.get('/login', (req, res) => {
  const templateVars = {
    user: req.session.user_id,
  };
  res.render('login', templateVars);
});
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send('No email or password entered');
    return;
  }
  for (const userID in users) {
    const username = users[userID].email;
    const hashedPassword = users[userID].hashedPassword;
    if (username === req.body.email && bcrypt.compareSync(req.body.password, hashedPassword)) {
      req.session.user_id = users[userID];
      res.redirect('/urls?login_success');
      return;
    }
  }
  // if username and passworrd were entered but username isnt found, tell user
  res.statusCode = 403;
  res.send('Wrong username or password');
  res.redirect('/urls');
});

// urls list page | home redirect when user is logged in
app.get('/urls', (req, res) => {
  const templateVars = {
    // calls helper function to serve filtered db
    urls: urlsForUser(req.session.user_id),
    user: req.session.user_id,
  };
  res.render('urls_index', templateVars);
});

// register a new user
app.get('/register', (req, res) => {
  const templateVars = {
    user: req.session.user_id,
  };
  res.render('register', templateVars);
});
app.post('/register', (req, res) => {
  // catches missing password or email
  if (!req.body.email || !req.body.password) {
    res.statusCode = 400;
    res.send('No email or password entered');
    return;
  }
  // catches already existing user (email)
  for (const account in users) {
    if (users[account].email === req.body.email) {
      res.statusCode = 400;
      res.send('That account already exists');
      return;
    }
  }
  // geneartes user ID and grabs password
  const userID = generateRandomString(8);
  const password = req.body.password;
  // creates new user object
  users[userID] = {
    id: userID,
    email: req.body.email,
    hashedPassword: bcrypt.hashSync(password, 10),
  };
  // logs in user automatically after registration
  req.session.user_id = users[userID];
  res.redirect('/urls');
});

// create new url link page. only available to
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: req.session.user_id,
  };
  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.statusCode = 403;
    res.redirect('/login?from%new');
  }
});
app.post('/urls/new', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString(6);
  const user = req.session.user_id.id;
  url_db[shortURL] = {
    creator: user,
    longURL: longURL,
  };
  console.log(users);
  console.log(url_db);
  res.redirect('/urls');
});

// single url edit page
app.get('/urls/:id', (req, res) => {
  if (!req.session.user_id) {
    res.statusCode = 403;
    res.send('please log in to edit your links');
  } else if (req.session.user_id.id !== url_db[req.params.id].creator) {
    res.statusCode = 403;
    res.send('this link does not belong to you');
  } else {
    const templateVars = {
      shortURL: req.params.id,
      urls: urlsForUser(req.session.user_id),
      user: req.session.user_id,
    };
    res.render('urls_show', templateVars);
  }
});
app.post('/urls/:id', (req, res) => {
  url_db[req.params.id].longURL = req.body.newURL;
  res.redirect('/urls');
});

// logs out the user (clears cookie)
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// redirects a short url to its real url
app.get('/u/:shortURL', (req, res) => {
  const longURL = url_db[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// deletes a url entry in db
app.post('/urls/:id/delete', (req, res) => {
  delete url_db[req.params.id];
  res.redirect('/urls');
});

// catch all for bad url
app.get('*', (req, res) => {
  res.statusCode = 404;
  res.send('Page not found');
});

app.listen(PORT, () => {
  console.log(`We're live on port ${PORT}!`);
});
