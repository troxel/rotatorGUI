var express = require('express');

var router = express.Router();

const { execSync } = require('child_process');

const mdl = require('../models/depth_mdl')

const _ = require('lodash');

var RAD2PI = 180 / Math.PI

const db = require('../models/depth_mdl');

var posDiffPrev = 0
var posDiffPrevPrev = 0

// -----------------------------------------------------------
//  GET System Data Paint Page
// -----------------------------------------------------------
router.get('/', async (req, res, next) => {

   res.render('index', {});

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

   // ------- Change highlighting if depth data is not current. -------    
   const ts_dpth_diff = (Date.now() - rst.ts0) / 1000;
   //console.log(">>>>>>>>",Date.now(), rst.ts0,ts_dpth_diff)

   if (ts_dpth_diff < 10) {
      classList.depth0 = { add: "text-success", remove: "text-danger" }
   } else {
      classList.depth0 = { add: "text-danger",  remove: "text-success" }
   }

   // ------- Rotation Data ------
   const rotSnip = await db.getLastRows("encoder", "ts", 4)

   if (rotSnip.error) {
      console.error("DB Error")
      res.json({
         error: rotSnip.error
      })
      return
   }

   innerHTML.position = rotSnip[0].position

   const ts_encoder_diff = (Date.now() - rotSnip[0].ts) / 1000
   
   // ------- Rotation active! -------
   if (ts_encoder_diff < Math.abs(2) ) {

      classList.position = { add: "text-success",  remove: "text-secondary" }
      classList.positionRate = { add: "text-success",  remove: "text-secondary" }

      //classList.position = { add: "text-success", remove: "text-warning" }
      classList['btn-gorotate'] = { add: "disabled" }
      classList['btn-gohome']   = { add: "disabled" }
      classList['btn-goload']   = { add: "disabled" }

      // ---- show stop and hide go ---
      // The div group doesn't seem to work
      style['btn-gorotate'] = { display: "none" }
      style['btn-gohome']   = { display: "none" }
      style['btn-goload']   = { display: "none" }

      style['btn-stop']    = { display:"inline"}
      style['rot-spinner'] = { display:"inline"}

      // ------- Calc rate if data is current -------
      let posDiff = ( rotSnip[0].position - rotSnip[1].position) / (rotSnip[0].ts - rotSnip[1].ts)
      posDiff = posDiff * 1000*60    // per minute

      // For small time diffs the rate can be really high. Don't know where the issue is but don't have time to chase it down
      // Do we really need rate? 
      if ( Math.abs(posDiff) < 30 ) {
         innerHTML.positionRate = (posDiff*0.4 + posDiffPrev*0.35 + posDiffPrevPrev*0.25).toFixed(1)  // Smooth
         posDiffPrev = posDiff
         posDiffPrevPrev = posDiffPrev
      }

   // ------- Rotation is NOT active-------
} else {
      classList['btn-gorotate'] = { remove: "disabled" }
      classList['btn-gohome']   = { remove: "disabled" }
      classList['btn-goload']  = { remove: "disabled" }

      style['btn-gorotate'] = { display: "inline" }
      style['btn-gohome']   = { display: "inline" }
      style['btn-goload']   = { display: "inline" }

      style['btn-stop']    = { display:"none"}
      style['rot-spinner'] = { display:"none"}

      classList.position = { add: "text-secondary",  remove: "text-success" }
      classList.positionRate = { add: "text-secondary",  remove: "text-success" }

      innerHTML.positionRate = 0
   }

   // ------- Active is based on if daemon is running. Probably best to base on data. TODO -------
   let dpthInstance = 0
   if (isActive('lsvsail_depth_attitude', 0)) {
      classList.dpth0 = {
         replace: ['text-danger', 'text-success']
      }
      dpthInstance++
   } else {
      classList.dpth0 = {
         replace: ['text-success', 'text-danger']
      }
   }

   if (isActive('lsvsail_depth_attitude', 1)) {
      classList.dpth1 = {
         replace: ['text-danger', 'text-success']
      }
      dpthInstance++
   } else {
      classList.dpth1 = {
         replace: ['text-success', 'text-danger']
      }
   }

   //console.log('dpthInstance',dpthInstance)

   setAttribute['angle'] = { value: req.cookies.angle }
   setAttribute['rate'] = { value: req.cookies.rate }

   if (dpthInstance > 0) {
      innerHTML['btn-acquire'] = 'Stop Acquisition'
      setAttribute['btn-acquire'] = {
         value: 1
      }
      style['btn-acquire'] = {
         visibility: "visible"
      }

   } else {
      innerHTML['btn-acquire'] = 'Start Acquisition'
      setAttribute['btn-acquire'] = {
         value: 0
      }
      style['btn-acquire'] = {
         visibility: "visible"
      }
   }

   // Prepare to return
   rtnObj.innerHTML = innerHTML
   rtnObj.style = style
   rtnObj.classList = classList
   rtnObj.setAttribute = setAttribute
   //rtnObj.fltAlm = fltAlm
   
   rtnObj.rosette = rotSnip[0].position - 90

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

         if ( typeof dObj[i] === "undefined" ) { 
            res.json({ 'error': `No Data traceLst ${PlotId}`})
            return;  
         }
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