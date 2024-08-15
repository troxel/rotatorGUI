  // -------------------------------------------
  function get_plot_data(repeatVal = 1000, urlBase ) {

    // large default on repeat rate repeatVal ie static. 

    const plot = $("#selPlot").val()
    const rng = $("#selRng").val()

    const url = urlBase + "?plot=" + plot + "&rng=" + rng
    //console.log('url----------------->',url);

    var xhr = $.ajax({
       url: url,
       success: function(data) {

          if (data['error']) {
             //this.error(this.xhr,this.textStatus,data['error'])
             alert('Error : ' + data['error']); // alert stops processing 
             return
          }

          let nodata_id = document.getElementById("nodata")
          if (typeof data.traceLst[0].x !== "undefined") {
             nodata_id.innerHTML = ""
             plotData(data)
          } else {
             nodata_id.innerHTML = "No Data"
             console.error('No Data')
             plotData(null)
          }

          //dh.process(data)
       },
       complete: function() {
          if (typeof timeoutId !== 'undefined') {
             clearTimeout(timeoutId)
          }
          timeoutId = setTimeout(get_plot_data, repeatVal, repeatVal, urlBase)
       },
       error: function(jqXhr, textStatus, errorMessage) {
          console.error('Ajax Error! ' + errorMessage);
       },
       timeout: repeatVal,
       dataType: 'json',
    }) // end ajax
 }

 // ------------------------
 // -- Plot functions ----- 
 // ------------------------
 function plotData(data) {

    //console.log(data)

    traceLst = []
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

 // Actions.
 $("#selPlot").change((event) => {
    get_plot_data()
 })

 $("#selRng").change((event) => {
    get_plot_data()
 })

 $("#stopUpdate").change((event) => {

    if ($('#stopUpdate').is(':checked')) {
       get_plot_data(10000000)
    } else {
       get_plot_data()
    }

 })

