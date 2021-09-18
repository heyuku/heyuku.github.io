var dataTable;
var conversionPrice = 0.00;

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
  conversionPrice = parseFloat(metadata.EUR);
  return parseFloat(metadata.EUR);
}

function renderEuro(data, type, symbol, coloring=true, compute=false) {
  if (type == "sort" || type == 'type')
        return data;

  var number = $.fn.dataTable.render.number( '', ',', 2, '', ' '+symbol).display(data);  

  if (type === 'display') {

    let color = 'black';

    if(coloring)
    {
      color = (data<0) ? 'red' : 'green';
    }


    if (compute)
      return '<span style="color:'+ color +';">'+$.fn.dataTable.render.number( '', ',', 2, '', ' '+symbol).display(data*conversionPrice) + '<br /><span style="font-size:14px; opacity:0.7;">'+data+' ETH</span></span>';
    else
      return '<span style="color:'+ color +';">' +number+ '</span>';
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
      }, 0 )*conversionPrice;

  totalCol3 = api
      .column( 3 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 )*conversionPrice;

  totalCol5 = api
      .column( 5 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 )*conversionPrice;


  totalCol10 = api
      .column( 10 )
      .data()
      .reduce( function (a, b) {
          return intVal(a) + intVal(b);
      }, 0 )*conversionPrice;

  // Update footer
  var colorCol3 = (totalCol3<0) ? "red" : "green";
  var colorCol5 = (totalCol5<0) ? "red" : "green";
  var colorCol10 = (totalCol10<0) ? "red" : "green";
  var perctGainsAvg = (totalCol5/totalCol1)*100;
  var colorColPrctAvg = (perctGainsAvg<0) ? "red" : "green";
  var perctGainsFloor = (totalCol3/totalCol1)*100;
  var colorColPrctFloor = (perctGainsFloor<0) ? "red" : "green";
  var perctGains7dAvg = (totalCol10/totalCol1)*100;
  var colorColPrct7d = (perctGains7dAvg<0) ? "red" : "green";

  $( api.column( 1 ).footer() ).html(
    parseFloat(totalCol1).toFixed(2) +' &euro; '
  );

  $( api.column( 3 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol3 + ';">'+ parseFloat(totalCol3).toFixed(2) +' &euro;</span>'
    + '<br /><span style="font-size:14px; text-align:left; color:'+ colorColPrctFloor + ';">'+ parseFloat(perctGainsFloor).toFixed(2) +' %</span>'
  );
  $( api.column( 5 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol5 + ';">'+ parseFloat(totalCol5).toFixed(2) +' &euro;</span>'
    + '<br /><span style="font-size:14px; text-align:left; color:'+ colorColPrctAvg + ';">'+ parseFloat(perctGainsAvg).toFixed(2) +' %</span>'
  );

  $( api.column( 10 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol10 + ';">'+ parseFloat(totalCol10).toFixed(2) +' &euro;</span>'
    + '<br /><span style="font-size:14px; text-align:left; color:'+ colorColPrct7d + ';">'+ parseFloat(perctGains7dAvg).toFixed(2) +' %</span>'
  );
}

async function fetchCollectionDataClone(assetContract, tokenId, initialFees, ownedItems, collectionName) {  
  let fetchFloorUrl = `https://api.opensea.io/api/v1/asset/`+assetContract+"/"+tokenId;
  let res = await fetch(fetchFloorUrl);

  if (res.status == 404 || res.status == 400)
    throw new Error("Token id doesn't exist.");

  if (res.status != 200)
    throw new Error(`Couldn't retrieve metadata: ${res.statusText}`);

  let metadata = await res.json();

  if(collectionName == "Rarible")
  {
    let filteredData = metadata.orders.filter(function(a){ 
      if (a.side != 1 || a.cancelled || a.marked_invalid) 
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
  
    let outputCollection = {collection: "Frontier Luckywatcher", 
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
  else
  {
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
  
}


function getFloor(wallet) {
  var div = document.getElementById("nft-content");
  div.innerText = "loading...";
  dataTable.clear();

  fetchUserData(wallet)
  .then(function(result){
      
      getEthPrice().then(function(ethPrice){
        conversionPrice = ethPrice;

      result.forEach(element => {
        dataTable.row.add([
          element.collection,
          parseFloat(element.invested).toFixed(2),
          parseFloat(element.floorPrice).toFixed(2),
          parseFloat(element.gainsFloor).toFixed(2),
          parseFloat(element.oneDayAvgPrice).toFixed(2),
          parseFloat(element.gains1dAvg).toFixed(2),
          parseFloat((element.gains1dAvg/element.invested)*100).toFixed(2),
          parseFloat(element.oneDayVolume).toFixed(2),
          parseFloat(element.oneDaySales).toFixed(0),
          parseFloat(element.sevenDayAvgPrice).toFixed(2),
          parseFloat(element.gains7dAvg).toFixed(2),
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
    "order": [[ 3, "desc" ]],
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
          return renderEuro(data,type, '&euro;', false, true);
        }
      },
      {
        targets: 3,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;', true, true);
        }
      },
      {
        targets: 5,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;', true, true);
        }
      },
      {
        targets: 6,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '%');
        }
      },
      {
        targets: 10,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;', true, true);
        }
      }
    ]
 });
}

async function fetchUserData(wallet) {
  let moralisUrl = "https://deep-index.moralis.io/api/v2/"+wallet+"/nft?chain=eth&format=decimal";
  let moralisTransUrl = "https://deep-index.moralis.io/api/v2/"+wallet+"/nft/transfers/verbose?chain=eth"  ;
  let moralisSettings = { 
    "method": "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': "KYFpwj7uXc1mRVmeZnQxAnV4fZ5ba7Viieco1OOothTYmyPYXPa6ZOt3XivXTZDq"
    }
  };

  let walletRes = await fetch(moralisUrl,moralisSettings);
  let walletTransRes = await fetch(moralisTransUrl,moralisSettings);

  if (walletRes.status == 404 || walletRes.status == 400)
    throw new Error("Token id doesn't exist.");

  if (walletRes.status != 200)
    throw new Error(`Couldn't retrieve metadata: ${walletRes.statusText}`);

  let dataWallet = await walletRes.json();
  let dataWalletTrans = await walletTransRes.json();
  var groupedBy = groupBy(dataWallet.result, "name");
  var transGroupedBy = groupBy(dataWalletTrans.result, "address");
  
  var output = [];
  var transactions = new Map();

  for (let i = 0; i < groupedBy.length; i++) {
    var element = groupedBy[i];
    
    var contractAddress = element[0].token_address;
    var collectionName = element[0].name;
    
    var transactionTotal = 0;
    var tokensNumber = element.length;
    var firstTokenId = element[0].token_id;

    for (let j = 0; j < element.length; j++)
    {
      var tokenId = element[j].token_id;
      var filteredTransaction = dataWalletTrans.result.filter(el => 
        el.address == element[j].token_address 
        && el.token_id==element[j].token_id)
      //var transaction = dataWalletTrans.result.find(el => el.token_id[0] == tokenId);
      for (let h = 0; h < filteredTransaction.length; h++)
      {
        let dataTransaction = await fetchTransactionPrice(filteredTransaction[h].transaction_hash);
        if (!transactions.has(dataTransaction.transaction))
        {
          transactions.set(dataTransaction.transaction, dataTransaction);
          transactionTotal += dataTransaction.feesEth;
        }
      }
    }

    if (collectionName!="")
      output.push(await fetchCollectionDataClone(contractAddress,firstTokenId,transactionTotal,tokensNumber,collectionName));
  }

  return output;
}

async function fetchTransactionPrice(transactionHash) {
  let moralisUrl = "https://deep-index.moralis.io/api/v2/transaction/"+transactionHash+"?chain=eth";
  let moralisSettings = { 
    "method": "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': "KYFpwj7uXc1mRVmeZnQxAnV4fZ5ba7Viieco1OOothTYmyPYXPa6ZOt3XivXTZDq"
    }
  };

  let transRes = await fetch(moralisUrl,moralisSettings);
  if (transRes.status == 404 || transRes.status == 400)
  {
  throw new Error("Token id doesn't exist.");
  }
  if (transRes.status != 200)
  {
  throw new Error(`Couldn't retrieve metadata: ${transRes.statusText}`);
  }

  let dataTrans = await transRes.json();
  var transactionFee = dataTrans.receipt_gas_used * dataTrans.gas_price / 1000000000000000000;
  var value = dataTrans.value / 1000000000000000000;
  var transactationTotal = value+transactionFee;

  let output = {transaction: transactionHash, 
    feesEth: transactationTotal
  };

  return output;
}

function groupBy(collection, property) {
  var i = 0, val, index,
      values = [], result = [];
  for (; i < collection.length; i++) {
      val = collection[i][property];
      index = values.indexOf(val);
      if (index > -1)
          result[index].push(collection[i]);
      else {
          values.push(val);
          result.push([collection[i]]);
      }
  }
  return result;
}
