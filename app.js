require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const passport = require('passport');

const sessionSecret = 'Leyndarmál';

const apply = require('./apply');
const admin = require('./admin');
const applications = require('./applications');
const signy = require('./signy');

const { Strategy } = require('passport-local');

const users = require('./users');
/* todo sækja stillingar úr env */

if (!sessionSecret) {
  console.error('Add SESSION_SECRET to .env');
  process.exit(1);
}

const app = express();

/* todo stilla session og passport */

app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;

/* todo setja upp login og logout virkni */

// Passport mun verða notað með session
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    maxAge: 20 * 1000 // 20 sek
  })
);

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function strat(username, password, done) {
  try {
    const user = await users.findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await users.comparePasswords(password, username);

    return done(null, result);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

// Notum local strategy með „strattinu“ okkar til að leita að notanda
passport.use(new Strategy(strat));

// Geymum id á notanda í session, það er nóg til að vita hvaða notandi þetta er
passport.serializeUser((user, done) => {
  done(null, user);
});

// Sækir notanda út frá id
passport.deserializeUser(async (id, done) => {
  try {
    const user = await users.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Látum express nota passport með session
app.use(passport.initialize());
app.use(passport.session());

// Gott að skilgreina eitthvað svona til að gera user hlut aðgengilegan í
// viewum ef við erum að nota þannig
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    // getum núna notað user í viewum
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.isAdmin = req.user[0].admin;
    res.locals.userName = req.user[0].notendanafn;
    res.locals.name = req.user[0].name;
  }

  next();
});

// þá áfram, annars sendir á /login
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

/*app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.render('loggedIn', {
      title: 'Innskráning tókst',
      user: data
    });
  }
  
  return res.render('login');
});*/

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/admin ');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('./login', {
    title: 'Innskráning',
    message: message
  });
});

app.post(
  '/login',

  // Þetta notar strat að ofan til að skrá notanda inn
  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/login'
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

app.use('/', apply);
app.use('/applications', ensureLoggedIn, applications);
app.use('/signup', signy);
app.use('/admin', ensureLoggedIn, admin);

// Hjálpar middleware sem athugar hvort notandi sé innskráður og hleypir okkur
function notFoundHandler(req, res, next) {
  // eslint-disable-line
  res
    .status(404)
    .render('error', { page: 'error', title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) {
  // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { page: 'error', title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
