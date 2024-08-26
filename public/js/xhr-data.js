// This file contains the function that is used to request the xhr data
// and display that data via the data-xhr-hdlr.  Custom handlers may be 
// added for certain functions. 

// This is added function to data-xhr-hdlr to process the direction rosette
function rosette(angle) {
   const handle = document.getElementById('rotary-indicator');
   handle.style.transform = `rotate(${angle}deg)`;
}

var dh = dataXhrHdlr({rosette:rosette});

// Most pages will call this function
async function get_xhr_data(repeatVal = 1000, urlXhr) {

   try {

     console.log(urlXhr)
     const rsp = await fetch(urlXhr)

     if ( !rsp.ok ) {
       console.log("Error with fetch") 
       throw new Error(`Response status: ${rsp.status}`)
     }

     const data = await rsp.json();
     //console.log('data',data)

     dh.process(data)

     //- if (data) {

     //-   document.getElementById("fltBang").innerHTML = "";

     //- } else {

     //-   document.getElementById("fltBang").innerHTML = "No Data!";

     //- }

     toId = setTimeout(get_xhr_data, repeatVal, repeatVal, urlXhr);

   } catch (err) {

     document.getElementById("fltBang").innerHTML = "Web Server Down!";
     //- document.getElementById("gpsConnected").innerHTML = "-"
     //- document.getElementById("phinsConnected").innerHTML = "-"
     console.log("Error with connection",err)
   }

}  
