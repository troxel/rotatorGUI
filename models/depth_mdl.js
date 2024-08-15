const mysql = require('mysql2/promise');
const async = require('async');

// Create a connection pool to the database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'webdev',
    database: 'lsvsail',
    password: 'webdev1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to get rows from table for the specified length of time past now
const getRowsForPastSecs = async (timeSec, tbl, tsCol, dataCol) => {

    const timeMSec = timeSec * 1000

    const query = `SELECT ${tsCol},${dataCol} FROM ${tbl} WHERE ${tsCol} >= UNIX_TIMESTAMP(NOW())*1000 - ${timeMSec}`;

    try {
        const rst = await pool.query({sql:query, rowsAsArray: true})

        const ts = [];
        const vec = [];
    
        for(let i = 0; i < rst[0].length; i++ ) {
            ts[i] = new Date(rst[0][i][0] - 25200000)  // Todo need to find better solution for TZ
            vec[i] = rst[0][i][1]
        }    

        // if ( ts.length > 1000 ) {
        //     [ts,vec] = datareduce.lt3b(rst[0][ts, vec, 700)
        // }

        return({ts:ts,vec:vec})    
    
    } catch (error) {
        console.error("ERROR ERROR ERROR ERROR ERROR",error)
        return({error:error.message})
    }

}

// Function to get the most current row 
const getLastRows = async (tbl,key,rows) => {
    
    const query = `SELECT * FROM ${tbl} ORDER BY ${key} DESC LIMIT ${rows}`
    const rst = await pool.query(query)

    return(rst[0])
}

// Function to get the most current row 
const getLastDpthRow = async () => {
    
    const query0 = `SELECT * FROM depth0 ORDER BY ts0 DESC LIMIT 1`
    const query1 = `SELECT * FROM depth1 ORDER BY ts1 DESC LIMIT 1`
    
    rst0 = await pool.query(query0)
    rst1 = await pool.query(query1)

    //console.log(rst0); console.log(rst1)
    rstMerged = { ...rst0[0][0], ...rst1[0][0] }
    
    rstMerged.depth0 = rstMerged.depth0.toFixed(2)
    rstMerged.depth1 = rstMerged.depth1.toFixed(2)

    return(rstMerged)
}

module.exports = {
    getRowsForPastSecs,
    getLastDpthRow,
    getLastRows
};