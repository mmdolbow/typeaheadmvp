/* ****Typeahead and Bloodhound Demo**** 
Author: Mike Dolbow
*/

//base URL of a service that contains a lot of records with addresses
baseURL = "https://services.arcgis.com/GXwOsvnLQI6EDOp7/arcgis/rest/services/"

/* **** CONFIGURE: Establish the overlay services you require for the query and table load **** */
var lookupServiceUrl = baseURL + "Minnesota_School_Program_Locations_2020/FeatureServer/0"; //use to establish the sample lookup service

/* ***** Load the auto-complete for lookups, etc  ***** */
function loadfindJS() {
    //Bloodhound objects and initializations for Typeahead.

    //Bloodhound for other / alt / fake data
    var otherBH = new Bloodhound({
      name: "other",
      datumTokenizer: function (o) {
        var addr= Bloodhound.tokenizers.whitespace(o.addr);
        return addr;
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      identify: function(other) {return other.addr; },
      local: function() {
        var list = [];
        $.each(altdata,function(rec,val){
          list.push({addr: val.fakeaddr, source: "other"});
        });
        return list;
      }
    })
    otherBH.initialize();

    //Bloodhound for lookup service matching suggestions
    var lookupServiceBH = new Bloodhound({
      name:"lookupSvc",
      datumTokenizer: function (d) {
          var lookupAdr = Bloodhound.tokenizers.whitespace(d.lookupSvc);
          return lookupAdr;
      },
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      identify: function(sugg) { return sugg.lookupSvc; },
      remote: {
        url: lookupServiceUrl + '/query?f=json&returnGeometry=false&outFields=GISADDR&where=GISADDR+LIKE+%27%QUERY%%25%27',
        rateLimitWait: 30,
        wildcard: '%QUERY%',
        transform: function (response) {
            return $.map(response.features, function(suggestObj) {
              return {
                lookupSvc: suggestObj.attributes.GISADDR,
                source: "lookupSvc"
              };
            });
        }
      }
    });
    lookupServiceBH.initialize();
  
    //Typeahead configurations for each Bloodhound source
    $('#searchbox .typeahead').typeahead({
      hint: true, //hint needs to remain if you're going to see the drop-down of suggestions.
      highlight: true,
      autoselect: true,
      minLength: 2
    },
    {
      name: 'lookupSvc',
      display: 'lookupSvc',
      source: lookupServiceBH,
      templates: {
        header: "<span class='typeahead-header'>AJAX</span>"
      }
    },
    {
      name: 'other',
      display: 'addr',
      source: otherBH,
      templates: {
        header: "<span class='typeahead-header'>Static</span>"
      }
    }
   )
    .on("typeahead:select", function (obj, datum) { //function handling various selections out of the typeahead
      console.log(datum.source);
      switch(datum.source) {
        case "lookupSvc":
          $("#addressEm").html("Address found: <b>"+datum.lookupSvc+"<\/b>. This comes from the AJAX service lookup.");
          break;
        case "other":
          $("#addressEm").html("Fake Address found from static data: <b>"+datum.addr+"<\/b>.");
          break;
        default:
          console.log("Something went wrong picking the typeahead choice.")
      }
    });
  
  }//end function loadfindJS  

  //launch the main function for finding/searching stuff:
  loadfindJS();