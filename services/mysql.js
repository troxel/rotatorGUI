const mysql = require('mysql2');
const config = require('../config');

const pool = mysql.createPool(config.db)
const poolPms = pool.promise()

async function query(sql, params) {

  try {

    const [results, ] = await poolPms.query(sql, params)
    return results;

  } catch(err) {

    console.error('DB Error :', err.sqlMessage)
    console.error(sql)
    console.error(err.code)
    return false

  }
}

module.exports = {
  query
}

