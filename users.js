/* Notast með 04.passport.js */

const bcrypt = require('bcrypt');
const { selectUser } = require('./db');
const { selectPass } = require('./db');
const { selectID } = require('./db');
const { select } = require('./db');

async function comparePasswords(password, user) {
  const pass = await selectPass(user);
  const ok = await bcrypt.compare(password, pass.rows[0].password);

  if (ok) {
    return user;
  }

  return false;
}

async function findByUsername(username) {
  const db = await selectUser(username);
  for (var i = 0; i < db.length; i++) {
    if (db[i].notendanafn === username) {
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(null);
}

async function findById(id) {
  const found = await selectID(id);

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

async function findAllUsers() {
  const found = await selectUser();

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

module.exports = {
  comparePasswords,
  findByUsername,
  findById,
  findAllUsers
};
