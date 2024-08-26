var express = require('express');

const mdl = require('../models/depth_mdl')

const _ = require('lodash');

const dr = require('datareduce')

const { resolve } = require('path');

var router = express.Router();

var RAD2PI = 180 / Math.PI

var IdRx = /([a-zA-Z]+)(\d+)/

// -----------------------------------------------------------
//  GET System Data Paint Page
// -----------------------------------------------------------
router.get('/', async (req, res, next) => {

   // rtnObj = {}
   // rtnObj.dataFiles = dataFiles

   res.render('plot', {});

});

// -----------------------------------------------------------
//  XHR GET System Data 
// -----------------------------------------------------------
router.get('/xhr', async function(req, res, next) {

   //console.log('query-->',req.query)

   traceLst = []

   layout = {}
   layout.title = {}
   layout.xaxis = {}
   layout.yaxis = {}
   layout.xaxis.title = {}
   layout.yaxis.title = {}

   var Rng = req.query.rng * 3600; // default ?
   var PlotId = req.query.plot;    // default ?

   // Plot Types
   if ( ( PlotId == 'depth0') || ( PlotId == 'depth1') ) {

      let tsCol = 'ts0'
      const match = PlotId.match(IdRx)
      if (match[2] == 1) { tsCol = 'ts1' } 
   
      dObj = await mdl.getRowsForPastSecs(Rng,PlotId,tsCol,PlotId)
      if ( dObj.error ) {
         console.error("DB Error")
         res.json({ error: dObj.error} )
         return
      }

      traceLst[0] = {
         x: dObj.ts,
         y: dObj.vec,
         name: 'Depth',
         mode: 'lines+markers',
         type: 'scatter',
      }

      layout.yaxis.title.text = 'Depth Sensor'
      layout.xaxis.title.text = 'Time'
      layout.yaxis.text = 'Depth'

   } else if ( ( PlotId == 'roll01') || ( PlotId == 'pitch01') || ( PlotId == 'yaw01') ) {
   
      const parts = decompose(PlotId)
      const rpy = parts.word
      const rpyLbl = _.upperFirst(rpy);

      let dObj = []
      for ( i = 0; i < 2; i++ ) {

         dObj[i] = await mdl.getRowsForPastSecs(Rng,'depth' + i,'ts' + i, rpy + i)

         //console.log(dObj[i])

         if (typeof dObj[i] == "undefined") {
            console.error("DB Error No object returned ",rpy+1)
            continue; 
         }

         if ( dObj[i].error ) {
            console.error("DB Error ", dObj[i].error, i )
            traceLst[i] = {}
         }
         else {

            traceLst[i] = {
               x: dObj[i].ts,
               y: dObj[i].vec,
               name: rpyLbl + i,
               mode: 'lines+markers',
               type: 'scatter',
            } 
         }
      }

      layout.title.text = rpyLbl 
      layout.xaxis.title.text = 'Time'
      layout.yaxis.text = rpyLbl + ' Deg'
      
   } else if ( ( PlotId == 'yaw02') || ( PlotId == 'yaw03') ) {

         let tsCol = 'ts0'
         let tbl = 'depth0'
         let col = 'yaw0'
         const match = PlotId.match(IdRx)
         if (match[2] == 3) { 
            tsCol = 'ts1'
            tbl = 'depth1' 
            col = 'yaw1'
         } 
      
         dObj = await mdl.getRowsForPastSecs(Rng,tbl,tsCol,col)
         if ( dObj.error ) {
            console.error("DB Error")
            res.json({ error: dObj.error} )
            return
         }
   
         traceLst[0] = {
            x: dObj.ts,
            y: dObj.vec,
            name: 'Yaw',
            mode: 'lines+markers',
            type: 'scatter',
         }
   
         layout.yaxis.title.text = 'Yaw'
         layout.xaxis.title.text = 'Time'
         layout.yaxis.text = 'Yaw'

   // --------- Encoder  ---------
   } else if ( PlotId == 'encoder' ) {

         let tsCol = 'ts'
      
         dObj = await mdl.getRowsForPastSecs(Rng,"encoder","ts","position")
         if ( dObj.error ) {
            console.error("DB Error")
            res.json({ error: dObj.error} )
            return
         }

         const now = Date.now(); // timestamp in milliseconds
         if ( dObj.ts.length > 0 ) {
            //console.log(now, dObj.ts[dObj.ts.length-1].getTime(),(now - dObj.ts[dObj.ts.length-1].getTime())/60/1000)
            // server time and browser time is off by 42 seconds? 
         }

         //if ( now > (dObj.ts[dObj.ts.length-1] + 1000) ) {
            dObj.ts.push(now)
            dObj.vec.push(dObj.vec[dObj.vec.length - 1]) // repeat last element of array since we don't update the table continuously
         //}

         traceLst[0] = {
            x: dObj.ts,
            y: dObj.vec,
            name: 'Encoder',
            mode: 'lines+markers',
            type: 'scatter',
         }
   
         layout.title.text = 'Encoder'
         layout.xaxis.title.text = 'Time'
         layout.yaxis.title.text = 'Encoder Angle'
   
   
   } else if (req.query.plot == 'depth_diff') {
      
      // tbd
      
   }

   res.json({
      'traceLst': traceLst,
      'layout': layout,
   })

})

//-----------------------------------------
// Util functions 
//-----------------------------------------

//-----------------------------------------------------------
// lat/lon are saved in rad per gnc spec add degress 
//-----------------------------------------------------------
function latlon2deg(phinsData) {

   phinsData['Lat'] = []
   phinsData['Lon'] = []

   for (let i = 0; i < phinsData.Lat_S.length; i++) {
      phinsData.Lat[i] = phinsData.Lat_S[i] * RAD2PI
      phinsData.Lon[i] = phinsData.Lon_S[i] * RAD2PI
   }
}

//-----------------------------------------------------------
// convert unix epoch time to data for plotting. 
// plotly really should support epoch time :()
//-----------------------------------------------------------
function epoch2date(time_epoch) {

   time_date = [];

   for (i = 0; i < time_epoch.length; i++) {
      time_date[i] = new Date(Number(time_epoch[i]))
   }

   return time_date;
}

//-----------------------------------------------------------
// Parse the plotId
//-----------------------------------------------------------
function decompose(str) {

   const match = str.match(/([a-zA-Z]+)(\d+)/);
   if (match) {
       return {
           word: match[1],
           number: match[2]
       };
   }
   return null;
}
 

module.exports = router;