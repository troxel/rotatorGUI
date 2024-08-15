// ------------------------------------
// --- Data Handler -------------------
// automate displaying data
// ------------------------------------
function dataXhrHdlr(hdlrObj) {

   // Add non-standard handlers
   for (let k in hdlrObj) {
      this[k] = hdlrObj[k]
   }

   //---------------------------------   
   this.innerHTML = function(data)
   {
      for (let key in data) {

         if (typeof(data[key]) === 'object' ) {
            innerHTML(data[key])  // yep recursive
         } 
         else {
            let elid = document.getElementById(key) 
            if ( elid != null ) {
               elid.innerHTML = data[key]
            }
         }
      }
   }

   // ------------------------------
   // data[classList] = {elid:{add:myclass,remove:thatclass},replace:['foo','bar']... }
   // ------------------------------
   this.classList = function(data) {

      for (let key in data) {

         if (typeof(data[key]) === 'object' ) {
            classList(data[key])
         } 

         const elid = document.getElementById(key)
         if ( elid != null ) {
            for (let method in data[key]){
               if ( Array.isArray(data[key][method]) ) {
                  elid.classList[method](...data[key][method])
               }
               else {
                  elid.classList[method](data[key][method])
               }
            }
         }
      }
   }

   // ------------------------------
   // data[style] = {elid:{backgroundColor:'red'},  }
   // ------------------------------
   this.style = function(data) {

      for (let key in data) {
         //console.log(key)
  
         if (typeof(data[key]) === 'object' ) {
            style(data[key])
         } 

         const elid = document.getElementById(key)
         if ( elid != null ) {
            for (let attr in data[key]) {
               elid.style[attr] = data[key][attr]
            }
         }
      }
   }

   //--------------------------------- 
   // rtnObj['setAttribute']['time'] = {"style":"background-color: red"}
   // rtnObj['setAttribute']['buttonId'] = {disable:true}
   this.setAttribute = function(data) {
      for (let id in data) {

        // Recursive doesn't work for setAttribute! 
        // Value is an object

        const elid = document.getElementById(id)
        if ( elid != null ) {
           for (let attr in data[id]) {
              let rtn = elid.setAttribute(attr,data[id][attr])
              // console.log('set ',id,attr,data[id][attr])
           }
        }
     }
  }
   //--------------------------------- 
   // rtnObj['removeAttribute']['buttonId'] = ['disable','align',...]
   this.removeAttribute = function(data) {
      for (let id in data) {
        // Recursive doesn't work for removeAttribute! 
        // Value is an list

        const elid = document.getElementById(id)
        if ( elid != null ) {
           for (let attr of data[id]) {
              let rtn = elid.removeAttribute(attr)
              // console.log('rmv',id,attr)
           }
        }
     }
   }

   this.src = function() {}
 
   // --- The crux --- 
   // Routes data to the handler of the same name
   this.process = function(dataIn) {
      for (key in dataIn) {
         if ( typeof this[key] == 'function') {
            // Call the function with the data
            this[key](dataIn[key])
         }
      }  
   }

   return(this)
}
