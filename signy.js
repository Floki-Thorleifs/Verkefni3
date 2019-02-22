/* eslint-disable comma-dangle */
const xss = require('xss');
const express = require('express');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const { insertUser } = require('./db');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

const router = express.Router();

// Fylki af öllum validations fyrir umsókn
const validations = [
  check('userName')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),

  check('email')
    .isEmail()
    .withMessage('Netfang verður að vera netfang'),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera lengra en 8 stafir'),

  check('re_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Lykilorðin verða að vera það sama')
];

// Fylki af öllum hreinsunum fyrir umsókn
const sanitazions = [
  sanitize('name')
    .trim()
    .escape(),
  sanitizeXss('name'),

  sanitizeXss('email'),
  sanitize('email')
    .trim()
    .normalizeEmail()
];

/**
 * Route handler fyrir form umsóknar.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir umsókn
 */
function form(req, res) {
  const data = {
    title: 'Nýskráning',
    userName: '',
    name: '',
    email: '',
    password: '',
    re_password: '',
    errors: []
  };
  res.render('signup', data);
}

/**
 * Route handler sem athugar stöðu á umsókn og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
function showErrors(req, res, next) {
  const {
    body: {
      userName = '',
      name = '',
      email = '',
      password = '',
      re_password = ''
    } = {}
  } = req;

  const data = {
    userName,
    name,
    email,
    password,
    re_password
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.title = 'Nýskráning – vandræði';

    return res.render('signup', data);
  }

  return next();
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * á þakkarsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
  const {
    body: {
      userName = '',
      name = '',
      email = '',
      password = '',
      re_password = ''
    } = {}
  } = req;

  const data = {
    userName,
    name,
    email,
    password,
    re_password
  };

  data.password = await bcrypt.hash(data.password, 11);
  await insertUser(data);

  return res.redirect('/signupComplete');
}

/**
 * Route handler fyrir þakkarsíðu.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
function thanks(req, res) {
  return res.render('signupComplete', { title: 'Það tókst!' });
}

router.get('/', form);
router.get('/signupComplete', thanks);

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(formPost)
);

module.exports = router;

/*const express = require('express');

const router = express.Router();
/**
 * Route handler fyrir form umsóknar.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Formi fyrir umsókn
 *
function form(req, res) {
  const data = {
    title: 'Atvinnuumsókn',
    name: '',
    email: '',
    phone: '',
    text: '',
    job: '',
    errors: [],
    page: 'apply',
  };
  res.render('form', data);
}

/* todo færa og stilla aðra virkni úr v2 *

router.get('/', form);

module.exports = router;*/
