var express = require('express');

var router = express.Router();

const { execSync } = require('child_process');

const _ = require('lodash');

var RAD2PI = 180 / Math.PI

const db = require('../models/depth_mdl');

var posDiffPrev = 0
var posDiffPrevPrev = 0

// -----------------------------------------------------------
//  GET System Data Paint Page
// -----------------------------------------------------------
router.get('/', async (req, res, next) => {

   res.render('status', {});

});

// -----------------------------------------------------------
//  XHR GET System Data 
// -----------------------------------------------------------
router.get('/xhr', async function(req, res, next) {

   let rtnObj = {}
   let innerHTML = {}
   let classList = {}
   let setAttribute = {}
   let style = {}

   const rst = await db.getLastDpthRow()
   innerHTML = rst

   let dt0Obj = new Date(rst.ts0)
   let dt1Obj = new Date(rst.ts1)

   innerHTML.tsFmt0 = dt0Obj.toLocaleDateString() + " " + dt0Obj.toLocaleTimeString() 
   innerHTML.tsFmt1 = dt1Obj.toLocaleDateString() + " " + dt1Obj.toLocaleTimeString() 

   // ------- Change highlighting if depth data is not current. -------    
   const ts0_dpth_diff = (Date.now() - rst.ts0) / 1000;
   const ts1_dpth_diff = (Date.now() - rst.ts1) / 1000;
   //console.log(">>>>>>>>",Date.now(), rst.ts0,ts_dpth_diff)

   if (ts0_dpth_diff < 10) {
      classList.botDpth = { add: "text-success", remove: "text-danger" }
   } else {
      classList.botDpth = { add: "text-danger",  remove: "text-success" }
   }

   if (ts1_dpth_diff < 10) {
      classList.topDpth = { add: "text-success", remove: "text-danger" }
   } else {
      classList.topDpth = { add: "text-danger",  remove: "text-success" }
   }

   // ------- Tracker Data ------
   for (let i = 1; i <= 7; i++ ) {
      let rslt = await db.getLastRows("tracker00" + i, "ts", 1)

      if (rslt.length === 0 ) { continue }

      for ( var k in rslt[0] ) {
         innerHTML[`${k}00${i}`] = rslt[0][k];
      }

      let dtObj = new Date(rslt[0].ts);
      innerHTML[`tsFmt00${i}`] = dtObj.toLocaleDateString() + " " + dtObj.toLocaleTimeString()

      // Set the status color
      let tsTrkDiff = (Date.now() - rslt[0].ts) / 1000;
      const idTrk = "T00" + i
      if (tsTrkDiff < 10) {
         classList[idTrk] = { add: "text-success", remove: "text-danger" }
      } else {
         classList[idTrk] = { add: "text-danger",  remove: "text-success" }
      }

      innerHTML["tsDiff00"+i] = tsTrkDiff.toFixed(1)
      if ( tsTrkDiff > 1000 ) { innerHTML["tsDiff00"+i] = "--"} 

   }

   // Prepare to return
   rtnObj.innerHTML = innerHTML
   rtnObj.style = style
   rtnObj.classList = classList
   rtnObj.setAttribute = setAttribute
   //rtnObj.fltAlm = fltAlm

   //rtnObj.innerHTML.fltBang = req.hdr.fltNum ? '!' : ''
   rtnObj.innerHTML.time = new Date()

   res.json(rtnObj)
})

// -----------------------------------------------------------
//  Plotting function 
// -----------------------------------------------------------
router.get('/subplot', async function(req, res, next) {

   let traceLst = []

   layout = {}
   layout.title = {}
   layout.xaxis = {}
   layout.yaxis = {}
   layout.xaxis = {}
   layout.yaxis.title = {}
   layout.xaxis.title = {}

   const Rng = req.query.rng * 3600; // default ?
   const PlotId = req.query.plot;    // default ?

   if ( ( PlotId == 'roll01') || ( PlotId == 'pitch01') || ( PlotId == 'yaw01') ) {
   
      const parts = decompose(PlotId)
      const rpy = parts.word
      const rpyLbl = _.upperFirst(rpy);

      let dObj = []
      for ( i = 0; i < 2; i++ ) {

         dObj[i] = await mdl.getRowsForPastSecs(Rng,'depth' + i,'ts' + i, rpy + i)

         //console.log(dObj[i])

         if ( dObj[i].error ) {
            console.error("DB Error ", dObj[i].error )
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

      layout.xaxis.title.text = 'Time'
      layout.yaxis.title.text = rpyLbl + ' deg'
      layout.yaxis.title.font = { size: 16, color: '#7f7f7f' }

      layout.height = 275
      layout.margin = {t:50,r:25,l:45,b:70}
   }

   res.json({
      'traceLst': traceLst,
      'layout': layout,
   })

})

// Route to stop the systemd units
router.get('/stop_acquire', async (req, res) => {
   const cmd = 'sudo systemctl stop lsvsail_depth_attitude@0 lsvsail_depth_attitude@1'
   const rtn = executeCmd(cmd)
   res.sendStatus(200)

});

// Route to start the systemd units
router.get('/start_acquire', async (req, res) => {
   const cmd = 'sudo systemctl restart lsvsail_depth_attitude@0 lsvsail_depth_attitude@1'
   const rtn = executeCmd(cmd)
   res.sendStatus(200)
});

// Route to start the systemd units
router.get('/set_rotation', async (req, res) => {

   const angle = req.query.angle
   const rate = req.query.rate

   if ( (angle > 190) || (angle < -190 ) ) { 
      console.error("Angle must be between 190 and -190 ",angle)
      return
    }

    if ( ( rate > 22 ) || (rate < 1 ) ) { 
      console.error("Rate must be between 22 and 1 ",rate)
      return
    }

   const cmd = `perl ./control/write_cmd.pl ${angle}@${rate}`
   console.log("\n",cmd,"\n")
   const rtn = executeCmd(cmd)

   // Make the numbers sticky
   const expiresDate = new Date(Date.now() + 3600000000); 
   res.cookie('angle', angle, {
      expires: expiresDate,
      httpOnly: true
   });
   res.cookie('rate', rate, {
      expires: expiresDate,
      httpOnly: true
   });

   res.sendStatus(200)
})


// Route to start the systemd units
router.get('/stop_rotation', async (req, res) => {
 
   // Add stop command here!!!!!!!!!!!!

})

// ----- Util functions ----- -

// -------------------------------------------------------------------
// Returns if instance active
// -------------------------------------------------------------------
function isActive(template, instance) {

   try {
      const output = execSync(`systemctl is-active ${template}@${instance}`, {
         encoding: 'utf-8'
      });
      if (output.trim() === 'active') {
         return true;
      }
   } catch (error) {
      // If an error is caught, it means the instance is not active or does not exist
      return false;
   }
}

// -------------------------------------------------------------------
// Execute command return true if success, false if not
// -------------------------------------------------------------------
function executeCmd(cmd) {

   console.log("running ", cmd)

   try {
      const stdout = execSync(cmd)
      console.log(`Command stdout: ${stdout}`)
      return true
   } catch (error) {
      console.error(`Error executing command: ${error.message}`)
      return false
   }
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
 

module.exports = router