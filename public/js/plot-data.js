class plot_data {

   constructor(repeatVal,urlBase) {
      this.repeatVal = repeatVal
      this.urlBase = urlBase
   }
 
   test() {
     console.log(`Hi! I'm ${this.urlBase}  ${this.repeatVal}`);
   }

   // ----------------------------------------------------------
   async get_plot_data(repeatVal = 1000, urlBase = "/" ) {

      // large default on repeat rate repeatVal ie static. 
      const plot = $("#selPlot").val()
      const rng = $("#selRng").val()
 
      const url = this.urlBase + "?plot=" + plot + "&rng=" + rng
      //console.log('url----------------->',url);
  
      const response = await fetch(url);
    
      if (!response.ok) {
         throw new Error(`Response status: ${response.status}`);
      }

      const data = await response.json();
    
      if (data['error']) {
         //this.error(this.xhr,this.textStatus,data['error'])
         nodata_id.innerHTML = "No Data"
         //alert('Error : ' + data['error']); // alert stops processing 
         return
      }
  
      let nodata_id = document.getElementById("nodata")
      try {
         if (typeof data.traceLst[0].x == "undefined") {
            nodata_id.innerHTML = "No Data"
            console.error('No Data')
            this.plotData(null)
            return
         }
      } catch ( err ) {
         console.log(data.traceLst, typeof data.traceLst, typeof data.traceLst[0])
         console.error('Error:', err)
         this.plotData(null)
         return
      }
     
      nodata_id.innerHTML = ""
      this.plotData(data)
  
      if (typeof this.timeoutId !== 'undefined') {
         clearTimeout(this.timeoutId)
      }
      
      this.timeoutId = setTimeout(this.get_plot_data.bind(this), this.repeatVal, this.urlBase)
      
   }
  
   //---------------------------------------------
   plotData(data) {
  
      let traceLst = []
      if (data) {
  
         traceLst = data.traceLst
  
          var layout = {
            height: 500,
            showlegend: true,
            title: {
               text: data.layout.title.text,
               font: {
                  size: 18
               },
               xref: 'paper',
               x: 0.05,
            },
            xaxis: {
               title: {
                  text: data.layout.xaxis.title.text,
                  font: {
                     size: 18,
                     color: '#7f7f7f'
                  }
               },
               autorange: true,
               automargin: true
            },
            yaxis: {
               title: {
                text: data.layout.yaxis.title.text,
                font: {
                     size: 18,
                     color: '#7f7f7f',
                  }
               },
               autorange: true,
               automargin: true
            }
          }
  
          if ( typeof data.layout != "undefined" ) {
            // Shallow merge.
            layout = { ...layout, ...data.layout }          
          } 
  
         //          layout = {...layout, ...data.layout}
         //layout = Object.assign({},layout,data.layout)
  
         //console.log(layout)
         //console.log(traceLst)
  
      }
  
      Plotly.newPlot('plot', traceLst, layout);
  
   }
}
// End plot_data class

 // Actions.
 $("#selPlot").change((event) => {
    get_plot_data()
 })

//  $("#selRng").change((event) => {

//    alert("Yo")
//    console.log("inrange")

//     //get_plot_data()
//  })
// $( document ).ready( () => {

//    document.getElementById('stopUpdate').addEventListener('change', function() {
//       if (this.checked) {
//          alert('checked')
//       } else { alert("not checked")}

//    })
// })
//  $("#stopUpdate").change((event) => {

//    alert('hllo')

//     if ($('#stopUpdate').is(':checked')) {
//        get_plot_data(10000000)
//     } else {
//        get_plot_data()
//     }

//  })

