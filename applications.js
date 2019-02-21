/* eslint-disable prefer-destructuring */
/* eslint-disable comma-dangle */
const express = require('express');
const { Client } = require('pg');
const { getData } = require('./db');
const { runQuery } = require('./db');

const connectionString = process.env.DATABASE_URL;

const router = express.Router();

router.use(express.urlencoded({ extended: true }));

async function removeFromDB(name) {
  const client = new Client({ connectionString });
  await client.connect();
  let selection;
  try {
    await client.query('DELETE FROM applications WHERE name = ($1)', [name]);
    selection = await client.query('SELECT * FROM applications');
  } catch (error) {
    console.error('Gat ekki eytt', error);
  } finally {
    await client.end();
  }
  return selection.rows;
}
// eslint-disable-next-line arrow-parens
removeFromDB().catch(err => {
  console.error(err);
});

async function renderApples(res) {
  const selection = await getData();
  res.render('apples', {
    title: 'Umsóknir',
    appList: selection
  });
}

router.post('/vinna', async (req, res) => {
  // eslint-disable-next-line prefer-destructuring
  const id = req.body.id;
  await runQuery(id, 'UPDATE applications SET processed = TRUE WHERE id =');

  renderApples(res);
});

router.get('/applications', async (req, res) => {
  await renderApples(res);
});
router.post('/delete', async (req, res) => {
  const id = req.body.id;
  await runQuery(id, 'DELETE FROM applications WHERE id =');
  renderApples(res);
});

module.exports = router;
