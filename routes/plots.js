var express = require('express');

var router = express.Router();

const mdl = require('../models/depth_mdl')


var PltDb = {}

PltDb.depth0 = { tbl:["depth0"], key:["ts0"], col:["depth0"], lbl:["Lower Depth"], units:"Ft" , layout:{}}
PltDb.depth1 = { tbl:["depth1"], key:["ts1"], col:["depth1"], lbl:["Upper Depth"], units:"Ft"  }

PltDb.roll0  = { tbl:["depth0"], key:["ts0"], col:["roll0"], lbl:["Lower Roll"], units:"Degrees" }
PltDb.roll1  = { tbl:["depth1"], key:["ts1"], col:["roll1"], lbl:["Upper Roll"], units:"Degrees" }

PltDb.pitch0  = { tbl:["depth0"], key:["ts0"], col:["pitch0"], lbl:["Lower Pitch"], units:"Degrees" }
PltDb.pitch1  = { tbl:["depth1"], key:["ts1"], col:["pitch1"], lbl:["Upper Pitch"], units:"Degrees" }

PltDb.yaw0   = { tbl:["depth0"], key:["ts0"], col:["yaw0"], lbl:["Lower Yaw"], units:"Degrees"  }
PltDb.yaw1   = { tbl:["depth1"], key:["ts1"], col:["yaw1"], lbl:["Upper yaw"], units:"Degrees"  }

PltDb.depth2 = { tbl:["depth0","depth1"], key:["ts0","ts1"], col:["depth0","depth1"], lbl:["depth0","depth1"], units:"Ft" }
PltDb.roll2  = { tbl:["depth0","depth1"], key:["ts0","ts1"], col:["roll0","roll1"], lbl:["roll0","roll1"], units:"Degrees" }
PltDb.pitch2 = { tbl:["depth0","depth1"], key:["ts0","ts1"], col:["pitch0","pitch1"], lbl:["pitch0","pitch1"], units:"Degrees" }
PltDb.yaw2   = { tbl:["depth0","depth1"], key:["ts0","ts1"], col:["yaw0","yaw1"], lbl:["Yaw Lower","Yaw Upper"], units:"Degrees" }

PltDb.encoder = { tbl:["encoder"], key:["ts"], col:["position"], lbl:["Encoder"], units:"Degrees" }

// -----------------------------------------------------------
//  GET System Data Paint Page
// -----------------------------------------------------------
router.get('/plots', async (req, res, next) => {

   const Rng = req.query.rng * 3600;
   const PlotId = req.query.plot;

   traceLst = []

   layout = {}
   layout.title = {}
   layout.xaxis = {}
   layout.yaxis = {}
   layout.xaxis.title = {}
   layout.yaxis.title = {}
   
   const tbl = PltDb[PlotId].tbl
   const col = PltDb[PlotId].col
   const key = PltDb[PlotId].key
   const lbl = PltDb[PlotId].lbl
   const units = PltDb[PlotId].units
   
   var lblStr = ""
   var dObj = []

   for ( i=0; i<tbl.length; i++ ) {

      dObj[i] = await mdl.getRowsForPastSecs(Rng,tbl[i],key[i],col[i])

      // Getting occasional undefined. Not sure how this is happening
      if ( typeof dObj[i] === "undefined" ) {
         console.error("Returned Undefined DB Error")
         res.json({ error: "Returned Undefined DB Error" })
         return
      }

      if ( dObj[i].error ) {
         console.error("DB Error")
         res.json({ error: dObj[i].error} )
         return
      }

      traceLst[i] = {
         x: dObj[i].ts,
         y: dObj[i].vec,
         name: lbl[i],
         mode: 'lines+markers',
         type: 'scatter',
      }

   }

   layout.yaxis.title.text = "".concat(lbl, " ", units)
   layout.xaxis.title.text = 'Time'
 
   //layout.yaxis.title.font = { size: 12, color: '#7f7f7f' }

   layout.height = 400
   layout.margin = {t:50,r:25,l:55,b:70}

   res.json({
      'traceLst': traceLst,
      'layout': layout,
   })

});

module.exports = router