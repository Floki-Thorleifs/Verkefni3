/* eslint-disable comma-dangle */
const express = require('express');

const { updateAdmin } = require('./db');
const users = require('./users');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const router = express.Router();

async function update(req, res) {
  ('halló');
  const { id } = req.body;
  if (id) {
    await id.forEach(userId => {
      updateAdmin(userId);
    });
  }
  return res.redirect('/admin');
}

/**
 * Route handler fyrir form umsóknar.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 *
 */
async function admin(req, res) {
  const list = await users.findAllUsers();
  const data = {
    title: 'Innskráning tókst',
    list: list
  };
  return res.render('loggedIn', data);
}

router.get('/', catchErrors(admin));
router.post('/update', catchErrors(update));

module.exports = router;
