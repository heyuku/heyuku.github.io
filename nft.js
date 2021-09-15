var dataTable;

async function getEthPrice() {
  let res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=EUR");
  if (res.status == 404 || res.status == 400)
  {
    throw new Error("Token id doesn't exist.");
  }
  if (res.status != 200)
  {
    throw new Error(`Couldn't retrieve metadata: ${res.statusText}`);
  }

  let metadata = await res.json();
  return parseFloat(metadata.EUR);
}

function renderEuro(data, type, symbol, coloring=true) {
  var number = $.fn.dataTable.render.number( '', ',', 2, '', ' '+symbol). display(data);
  if (type == "sort" || type == 'type')
        return data;

  if (type === 'display') {
    if(coloring) {
      let color = 'green';
      if (data < 0) {
          color = 'red';
      }

      return '<span style="color:' + color + '">' + number + '</span>';
    }

    return number;
  }
   
  return number;
}

function totalCallback (obj, row, data, start, end, display ) {
  var api = obj.api(), data;

  // Remove the formatting to get integer data for summation
  var intVal = function ( i ) {
      return typeof i === 'string' ?
          i.replace(/[\$,]/g, '')*1 :
          typeof i === 'number' ?
              i : 0;
  };

  // Total over all pages
  totalCol1 = api
      .column( 1 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 );

  totalCol3 = api
      .column( 3 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 );

  totalCol5 = api
      .column( 5 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 );

  totalCol6 = api
      .column( 6 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 );

  totalCol11 = api
      .column( 11 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 );

  // Update footer
  var colorCol3 = (totalCol3<0) ? "red" : "green";
  var colorCol5 = (totalCol5<0) ? "red" : "green";
  var colorCol6 = (totalCol6<0) ? "red" : "green";
  var colorCol11 = (totalCol11<0) ? "red" : "green";
  var perctGainsAvg = (totalCol5/totalCol1)*100;
  var colorColPrctAvg = (perctGainsAvg<0) ? "red" : "green";
  var perctGainsFloor = (totalCol3/totalCol1)*100;
  var colorColPrctFloor = (perctGainsFloor<0) ? "red" : "green";
  var perctGains7dAvg = (totalCol11/totalCol1)*100;
  var colorColPrct7d = (perctGains7dAvg<0) ? "red" : "green";

  $( api.column( 1 ).footer() ).html(
    parseFloat(totalCol1).toFixed(2) +' &euro; '
  );

  $( api.column( 3 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol3 + ';">'+ parseFloat(totalCol3).toFixed(2) +' &euro;</span>'
    + '<br /><span style="text-align:left; color:'+ colorColPrctFloor + ';">'+ parseFloat(perctGainsFloor).toFixed(2) +' %</span>'
  );
  $( api.column( 5 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol5 + ';">'+ parseFloat(totalCol5).toFixed(2) +' &euro;</span>'
    + '<br /><span style="text-align:left; color:'+ colorColPrctAvg + ';">'+ parseFloat(perctGainsAvg).toFixed(2) +' %</span>'
  );
  $( api.column( 6 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol6 + ';">'+ parseFloat(totalCol6).toFixed(2) +' ETH</span>'
  );
  $( api.column( 11 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol11 + ';">'+ parseFloat(totalCol11).toFixed(2) +' &euro;</span>'
    + '<br /><span style="text-align:left; color:'+ colorColPrct7d + ';">'+ parseFloat(perctGains7dAvg).toFixed(2) +' %</span>'
  );
}
  


async function fetchItemData(collectionName, tokenId, assetContract, initialFees, ownedItems) {
  let url = "https://api.opensea.io/api/v1/asset/"+assetContract+"/"+tokenId;
  let settings = { 
    method: "GET"
  };

  let res = await fetch(url, settings);
  if (res.status == 404 || res.status == 400)
  {
  throw new Error("Token id doesn't exist.");
  }
  if (res.status != 200)
  {
  throw new Error(`Couldn't retrieve metadata: ${res.statusText}`);
  }

  let data = await res.json();
  let filteredData = data.orders.filter(function(a){ 
    if (a.side != 1)
      return false;

    if (a.cancelled)
      return false;



    if (a.marked_invalid)
      return false;



    return true;
  });

  filteredData.sort(function(a,b){ 
    var aFloat = parseFloat(a.current_price);
    var bFloat = parseFloat(b.current_price);

    if (aFloat<bFloat)
      return -1;

    if (aFloat>bFloat)
      return 1;

    return 0;
  });

  let outputCollection = {collection: collectionName, 
      floorPrice: parseFloat(filteredData[0].current_price/1000000000000000000).toFixed(2), 
      numOwners: NaN, 
      oneDayAvgPrice: parseFloat(filteredData[0].current_price/1000000000000000000).toFixed(2),
      oneDayVolume: NaN,
      oneDaySales: NaN,
      sevenDayAvgPrice: parseFloat(filteredData[0].current_price/1000000000000000000).toFixed(2),
      sevenDayVolume: NaN,
      sevenDaySales: NaN,
      gains1dAvg: parseFloat(parseFloat(filteredData[0].current_price/1000000000000000000)*ownedItems-initialFees).toFixed(2),
      gains7dAvg: parseFloat(parseFloat(filteredData[0].current_price/1000000000000000000)*ownedItems-initialFees).toFixed(2),
      gainsFloor: parseFloat(parseFloat(filteredData[0].current_price/1000000000000000000)*ownedItems-initialFees).toFixed(2),
      invested: initialFees
  };
  return outputCollection;
}

async function fetchCollectionData(collectionName, initialFees, ownedItems) {
  let url = `https://api.opensea.io/api/v1/assets?order_direction=desc&offset=0&limit=1&collection=`+collectionName;
  let settings = { 
    method: "GET"
  };

let res = await fetch(url, settings);
if (res.status == 404 || res.status == 400)
{
  throw new Error("Token id doesn't exist.");
}
if (res.status != 200)
{
  throw new Error(`Couldn't retrieve metadata: ${res.statusText}`);
}

let data = await res.json();
let tokenId=data.assets[0].token_id;
let contractAddress = data.assets[0].asset_contract.address
  
let fetchFloorUrl = `https://api.opensea.io/api/v1/asset/`+contractAddress+"/"+tokenId;

  res = await fetch(fetchFloorUrl, settings);
if (res.status == 404 || res.status == 400)
{
  throw new Error("Token id doesn't exist.");
}
if (res.status != 200)
{
  throw new Error(`Couldn't retrieve metadata: ${res.statusText}`);
}

let metadata = await res.json();
let outputCollection = {collection: collectionName, 
    floorPrice: parseFloat(metadata.collection.stats.floor_price).toFixed(2), 
    numOwners: parseFloat(metadata.collection.stats.num_owners).toFixed(2), 
    oneDayAvgPrice: parseFloat(metadata.collection.stats.one_day_average_price).toFixed(2),
    oneDayVolume: parseFloat(metadata.collection.stats.one_day_volume).toFixed(2),
    oneDaySales: parseFloat(metadata.collection.stats.one_day_sales).toFixed(2),
    sevenDayAvgPrice: parseFloat(metadata.collection.stats.seven_day_average_price).toFixed(2),
    sevenDayVolume: parseFloat(metadata.collection.stats.seven_day_volume).toFixed(2),
    sevenDaySales: parseFloat(metadata.collection.stats.seven_day_sales).toFixed(2),
    gains1dAvg: parseFloat(parseFloat(metadata.collection.stats.one_day_average_price)*ownedItems-initialFees).toFixed(2),
    gains7dAvg: parseFloat(parseFloat(metadata.collection.stats.seven_day_average_price)*ownedItems-initialFees).toFixed(2),
    gainsFloor: parseFloat(parseFloat(metadata.collection.stats.floor_price)*ownedItems-initialFees).toFixed(2),
    invested: initialFees
};
return outputCollection;
}


function getFloor() {
  var div = document.getElementById("nft-content");
  div.innerText = "loading...";
  dataTable.clear();

  fetchFloor()
  .then(function(result){
      // Do something with the result
    
      //var totalGains = 0.00;
      //var totalGainsEth = 0.00;
      //var totalInvested = 0.00;
      //var conversionPrice = 0.00;
      
      getEthPrice().then(function(ethPrice){
        conversionPrice = ethPrice;

      result.forEach(element => {
                
        dataTable.row.add([
          element.collection,
          parseFloat(element.invested*ethPrice).toFixed(2),

          parseFloat(element.floorPrice).toFixed(2),
          parseFloat(element.gainsFloor*ethPrice).toFixed(2),

          parseFloat(element.oneDayAvgPrice).toFixed(2),
          parseFloat(element.gains1dAvg*ethPrice).toFixed(2),
          parseFloat(element.gains1dAvg).toFixed(2),
          parseFloat((element.gains1dAvg/element.invested)*100).toFixed(2),
          parseFloat(element.oneDayVolume).toFixed(2),
          parseFloat(element.oneDaySales).toFixed(0),
          parseFloat(element.sevenDayAvgPrice).toFixed(2),
          parseFloat(element.gains7dAvg*ethPrice).toFixed(2),
          parseFloat(element.sevenDayVolume).toFixed(2),
          parseFloat(element.sevenDaySales).toFixed(0),
          parseFloat(element.numOwners).toFixed(0)
        ]);

      });

      div.innerHTML="";
      var total = document.createElement("p");
      total.innerHTML = "<span style='opacity:0.5;'>1 ETH: " +parseFloat(conversionPrice).toFixed(2)+" EUR</span>";
      div.appendChild(total);

      $('#table_id').DataTable().draw(true);
    });
  }).catch(function (error){
      // Handle error
      console.log("error");
  });
}



function InitDatatable() {
  dataTable = $('#table_id').DataTable({
    "order": [[ 5, "desc" ]],
    "paging":   false,
    "searching": false,
    "info": false,
    footerCallback: function ( row, data, start, end, display ) {
      return totalCallback(this, row, data, start, end, display);
    },
    columnDefs: [ 
      
      {
        targets: 1,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;', false);
        }
      },
      {
        targets: 3,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;');
        }
      },
      {
        targets: 5,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;');
        }
      },
      {
        targets: 6,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, 'ETH');
        }
      },
      {
        targets: 7,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '%');
        }
      },
      {
        targets: 11,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;');
        }
      }
    ]
 });
}