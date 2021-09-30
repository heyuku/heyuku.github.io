var dataTable;
var conversionPrice = 0.00;

async function getEthPrice() 
{
  var nullValue = 0;

  try 
  {
    let res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=EUR");
    if (res.status != 200)
      return nullValue;

    let metadata = await res.json();
    conversionPrice = parseFloat(metadata.EUR);
    return parseFloat(metadata.EUR);
  } 
  catch (error) 
  {
    console.log(error);
    return nullValue;
  }
}

function renderEuro(data, type, symbol, coloring=true, compute=false) 
{
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
      .column( 9 )
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

  $( api.column( 9 ).footer() ).html(
    '<span style="text-align:left; color:'+ colorCol10 + ';">'+ parseFloat(totalCol10).toFixed(2) +' &euro;</span>'
    + '<br /><span style="font-size:14px; text-align:left; color:'+ colorColPrct7d + ';">'+ parseFloat(perctGains7dAvg).toFixed(2) +' %</span>'
  );
}

async function fetchAssetEvents(assetContract, tokenId) 
{  
  var nullValue = null;

  try 
  {
    let fetchFloorUrl = 'https://api.opensea.io/api/v1/events?format=json&asset_contract_address='+assetContract+'&token_id='+tokenId+'&only_opensea=false&offset=0&limit=300&event_type=successful&format=json';
    let res = await fetch(fetchFloorUrl);

    if (res.status != 200)
      return nullValue;

    let metadata = await res.json();
    return metadata; 
  } 
  catch (error) 
  {
    console.log(error);
    return nullValue;
  }
  
}


async function fetchCollectionDataClone(assetContract, tokenId, initialFees, ownedItems, collectionName, isCollectionMultiItems=false) 
{
  try 
  {
    let fetchFloorUrl = `https://api.opensea.io/api/v1/asset/`+assetContract+"/"+tokenId+"?format=json";
    let res = await fetch(fetchFloorUrl);
    
    if (res.status != 200)
      return null;

    let metadata = await res.json();

    if(isCollectionMultiItems)
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

      function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }

      var nbSales1d = 0, nbSales7d = 0, totalSales1d = 0, totalSales7d = 0;
      var oneDay = addDays(Date.now(),-1);
      var sevenDay = addDays(Date.now(),-7);
      var events = await fetchAssetEvents(assetContract, tokenId);
      if(events==null)
        return;

      for (let i = 0; i< events.asset_events.length; i++)
      { 
        var currentOrder = events.asset_events[i];
        var currentOrderDate = new Date(currentOrder.created_date);
        if (currentOrderDate >= oneDay)
        { 
          nbSales1d += parseFloat(1);
          totalSales1d += parseFloat(currentOrder.total_price/1000000000000000000);
        }
        if (currentOrderDate >= sevenDay)
        { 
          nbSales7d += parseFloat(1);
          totalSales7d += parseFloat(currentOrder.total_price/1000000000000000000);
        }
      }

      var avgSalePrice1d = totalSales1d/nbSales1d;
      var avgSalePrice7d = totalSales7d/nbSales7d;
    
      let outputCollection = {collection: collectionName + ' ' + metadata.name, 
          floorPrice: parseFloat(filteredData[0].current_price/1000000000000000000).toFixed(2), 
          numOwners: NaN, 
          oneDayAvgPrice: parseFloat(avgSalePrice1d).toFixed(2),
          oneDayVolume: parseFloat(totalSales1d).toFixed(2),
          oneDaySales: parseFloat(nbSales1d).toFixed(0),
          sevenDayAvgPrice: parseFloat(avgSalePrice7d).toFixed(2),
          sevenDayVolume: parseFloat(totalSales7d).toFixed(2),
          sevenDaySales: parseFloat(nbSales7d).toFixed(0),
          gains1dAvg: parseFloat(parseFloat(avgSalePrice1d)*ownedItems-initialFees).toFixed(2),
          gains7dAvg: parseFloat(parseFloat(avgSalePrice7d)*ownedItems-initialFees).toFixed(2),
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
  catch (error) 
  {
    console.log(error);
    return null;
  }  
}


function getFloor(wallet, override) {
  var div = document.getElementById("nft-content");
  div.innerText = "loading...";
  dataTable.clear();

  fetchUserData(wallet, override)
  .then(function(result){
      
      getEthPrice().then(function(ethPrice){
        conversionPrice = ethPrice;

      result.forEach(element => {
         if(element==null)
          return;

        dataTable.row.add([
          element.collection,
          parseFloat(element.invested).toFixed(2),
          parseFloat(element.floorPrice).toFixed(2),
          parseFloat(element.gainsFloor).toFixed(2),
          parseFloat(element.oneDayAvgPrice).toFixed(2),
          parseFloat(element.gains1dAvg).toFixed(2),

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
        targets: 9,
        sort: 'datasort',
        render: function(data, type) {
          return renderEuro(data,type, '&euro;', true, true);
        }
      }
    ]
 });
}

async function fetchUserData(wallet, override) 
{
  try 
  {
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

    if (walletRes.status != 200)
      return null;

    let dataWallet = await walletRes.json();
    let dataWalletTrans = await walletTransRes.json();
    var groupedBy = groupBy(dataWallet.result, "token_address");
    
    var output = [];
    var transactions = new Map();


    for (let i = 0; i < groupedBy.length; i++) 
    {
      var element = groupedBy[i];
      
      var contractAddress = element[0].token_address;
      var collectionName = element[0].name;

      var isCollectionMultiItems = false;
      if(override.has(collectionName))
        if (override.get(collectionName).isCollectionMultiItems)
          isCollectionMultiItems = override.get(collectionName).isCollectionMultiItems;
      
      var transactionTotal = 0;
      var tokensNumber = element.length;
      var currentTokenId = element[0].token_id;

      if (isCollectionMultiItems)
      {
        for (let j = 0; j < element.length; j++)
        {
          transactionTotal = 0;
          currentTokenId = element[j].token_id;
          tokensNumber = parseFloat(element[j].amount);

          var filteredTransaction = dataWalletTrans.result.filter(el => 
            el.address == element[j].token_address 
            && el.token_id==element[j].token_id)
          //var transaction = dataWalletTrans.result.find(el => el.token_id[0] == tokenId);
          for (let h = 0; h < filteredTransaction.length; h++)
          {
            let dataTransaction = await fetchTransactionPrice(filteredTransaction[h].transaction_hash, wallet);
            if(dataTransaction ==null)
              continue;

            if (!transactions.has(dataTransaction.transaction))
            {
              transactions.set(dataTransaction.transaction, dataTransaction);
              transactionTotal += dataTransaction.feesEth;
            }
          }

          if(override.has(collectionName))
            if (override.get(collectionName).invested)  
              transactionTotal = override.get(collectionName).invested;

          if (wallet == "0xc558c54fc1da2ba94a984d14e6e409252293458d" & currentTokenId== 4 & element[j].token_address == "0x236672ed575e1e479b8e101aeeb920f32361f6f9")
            transactionTotal = transactionTotal/2;

          var realCollectionName = collectionName;
          if (override.has(collectionName))
            realCollectionName = (override.get(collectionName).collectionName) ? override.get(collectionName).collectionName : collectionName;
      
      
          if (collectionName!="")
          {
            var info = await fetchCollectionDataClone(contractAddress,currentTokenId,transactionTotal,tokensNumber,realCollectionName, isCollectionMultiItems);
            if(info!=null)
              output.push(info);
          } 
        }
      }
      else
      {
        for (let j = 0; j < element.length; j++)
        {
          var filteredTransaction = dataWalletTrans.result.filter(el => 
            el.address == element[j].token_address 
            && el.token_id==element[j].token_id)
          //var transaction = dataWalletTrans.result.find(el => el.token_id[0] == tokenId);
          for (let h = 0; h < filteredTransaction.length; h++)
          {
            let dataTransaction = await fetchTransactionPrice(filteredTransaction[h].transaction_hash, wallet);
            if(dataTransaction==null)
              continue;

            if (!transactions.has(dataTransaction.transaction))
            {
              transactions.set(dataTransaction.transaction, dataTransaction);
              transactionTotal += dataTransaction.feesEth;
            }
          }

          if(override.has(collectionName))
            if (override.get(collectionName).invested)  
              transactionTotal = override.get(collectionName).invested;
        }

        var realCollectionName = collectionName;
        if (override.has(collectionName))
          realCollectionName = (override.get(collectionName).collectionName) ? override.get(collectionName).collectionName : collectionName;
    
    
        if (collectionName!="")
        {
          var info = await fetchCollectionDataClone(contractAddress,currentTokenId,transactionTotal,tokensNumber,realCollectionName, isCollectionMultiItems);
          if(info!=null)
            output.push(info);
        }
      } 
    }

    return output;
  } 
  catch (error) 
  {
    console.log(error);
    return null;
  }
}

async function fetchTransactionPrice(transactionHash, wallet) {
  let moralisUrl = "https://deep-index.moralis.io/api/v2/transaction/"+transactionHash+"?chain=eth";
  let moralisSettings = { 
    "method": "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': "KYFpwj7uXc1mRVmeZnQxAnV4fZ5ba7Viieco1OOothTYmyPYXPa6ZOt3XivXTZDq"
    }
  };

  try 
  {
    let transRes = await fetch(moralisUrl,moralisSettings);
    if (transRes.status != 200)
      return null;

    let dataTrans = await transRes.json();
    var transactionFee = dataTrans.receipt_gas_used * dataTrans.gas_price / 1000000000000000000;
    var value = dataTrans.value / 1000000000000000000;
    var transactationTotal =  (dataTrans.from_address == wallet) ? value+transactionFee : 0;

    let output = {transaction: transactionHash, 
      feesEth: transactationTotal
    };

    return output;
  } 
  catch (error) 
  {
    console.log(error);
    return null;
  }

  
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
