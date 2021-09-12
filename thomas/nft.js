async function fetchFloor() {

//https://api.opensea.io/api/v1/assets?token_ids=666251&asset_contract_address=0xd07dc4262bcdbf85190c01c996b4c06a461d2430
async function fetchItemData(collectionName, tokenId, assetContract, initialFees, ownedItems) {
    let url = "https://api.opensea.io/api/v1/asset/"+assetContract+"/"+tokenId;
    let settings = { 
    method: "GET",
    headers: {
    }
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

      let outputCollection = {collection: collectionName, 
          floorPrice: NaN, 
          oneDayAvgPrice: parseFloat(data.orders[0].current_price/1000000000000000000).toFixed(2),
          oneDayChangePrice: NaN,
          gains: parseFloat(parseFloat(data.orders[0].current_price/1000000000000000000)*ownedItems-initialFees).toFixed(2),
          invested: initialFees
      };
      return outputCollection;
  }

    async function fetchCollectionData(collectionName, initialFees, ownedItems) {
        let url = `https://api.opensea.io/api/v1/assets?order_direction=desc&offset=0&limit=1&collection=`+collectionName;
        let settings = { 
        method: "GET",
        headers: {
        }
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
            oneDayAvgPrice: parseFloat(metadata.collection.stats.one_day_average_price).toFixed(2),
            oneDayChangePrice: parseFloat(metadata.collection.stats.one_day_change).toFixed(2),
            gains: parseFloat(parseFloat(metadata.collection.stats.one_day_average_price)*ownedItems-initialFees).toFixed(2),
            invested: initialFees
        };
        return outputCollection;
    }

    var output = [
        await fetchCollectionData("luchadores-io", 0, 1),
        await fetchCollectionData("space-punks-club", 0.83+0.03507188770559437, 1),
        await fetchCollectionData("space-dinos-club", 0.014328735690514209, 1),
        await fetchCollectionData("colonists", 0.025+0.025+0.022373366781070899+0.024465028061784992, 2),
        await fetchCollectionData("more-loot", 0.012134669656268313, 1),
        await fetchCollectionData("roguesocietybot", 0.09+0.09+0.00548214541438788+0.008871448981470192, 2),
        await fetchCollectionData("tunesproject", 0.020182806903665604, 1)
    ];
    return output;
}

 function getFloor() {
  var div = document.getElementById("nft-content");
  div.innerText = "loading...";
    
    fetchFloor()
    .then(function(result){
        // Do something with the result
        div.innerHTML="";
        var totalGains = 0.00;
        var totalGainsEth = 0.00;
        var totalInvested = 0.00;
        var conversionPrice = 0.00;
        
        getEthPrice().then(function(ethPrice){
          conversionPrice = ethPrice;

        result.forEach(element => {
          
          var currentGainEth = parseFloat(element.gains);
          var currentGain = parseFloat(currentGainEth*ethPrice);
          var elementColor = (currentGain>=0) ? "green" : "red";
          totalGains += currentGain;
          totalGainsEth += currentGainEth;
          totalInvested += element.invested*ethPrice;

          var title = document.createElement("p");
          title.innerHTML = "<strong style='font-size:18px;opacity:0.8; color:"+ elementColor + "';>"+element.collection+": "+currentGain.toFixed(2)+ "EUR</strong><span style='color:"+elementColor+";'> ("+parseFloat((element.gains/element.invested)*100).toFixed(2)+"%, invested: "+parseFloat(element.invested*ethPrice).toFixed(2)+"EUR)</span>"+
            "<br />"+
            "<strong>1d avg: "+element.oneDayAvgPrice+ "</strong> <span style='color:gray;'>(floor: "+element.floorPrice+", 1d change: "+element.oneDayChangePrice+")</span>";

          div.appendChild(title);
        });

        var totalColor = (totalGains>=0) ? "green" : "red";
        var total = document.createElement("p");
        total.innerHTML = "<strong style='font-size: 24px; color:"+totalColor+";'>Gains based on day avg:<br /> "
          +parseFloat(totalGains).toFixed(2)+" EUR ("+parseFloat(totalGainsEth).toFixed(2)+" ETH)</strong><span style='color:"+totalColor+"';><br />"
          +" - Investment: " + parseFloat(totalInvested).toFixed(2)+" EUR <br/>"
          + " - Gains: " +parseFloat(totalGains/totalInvested*100).toFixed(2)+"%</span> <br/>"
          + "<span style='opacity:0.7;'> - 1 ETH: " +parseFloat(conversionPrice).toFixed(2)+" EUR</span>";
        div.appendChild(total);
    });
  }).catch(function (error){
        // Handle error
        console.log("error");
    });
  }
 

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

  window.onload = function() {
    getFloor();

    setInterval(getFloor, 30*60*1000);
  };
