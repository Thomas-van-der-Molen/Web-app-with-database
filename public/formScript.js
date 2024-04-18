/**
 * 
 * 
 * File: formScript.js
 * Name: Thomas van der Molen
 * 
 * This file contains client-side logic that is needed to change the appearance of the website
 * Speficically, when an asset exchange owner wants to create a new asset, they have to choose the asset class first
 * This file will change the form that the user has to fill in, so that it will match the needed information for that asset class
 * 
 */

function typeChanged(){
    console.log("the user changed their choice");
    var selector = document.getElementById("assetCategory");
    var assetType = (selector.options[selector.selectedIndex].value);

    //assetType will be either Stock, Cryptocurrency, or Commodity
    if(assetType == "Stock"){
        changeFormToStock();
    }
    else if(assetType == "Cryptocurrency"){
        changeFormToCryptocurrency();
    }
    else if(assetType == "Commodity"){
        changeFormToCommodity();
    }
}

function changeFormToStock(){
    document.getElementById("input1Label").innerHTML = "symbol";
    document.getElementById("input2Label").innerHTML = "price";
    
    document.getElementById("input3Label").innerHTML = "dividend";
    document.getElementById("input3").type = "number";

    document.getElementById("input4Label").innerHTML = "market_cap";
    document.getElementById("input5Label").innerHTML = "high_price";
    document.getElementById("input6Label").innerHTML = "low_price";

    document.getElementById("input6Label").style.visibility = "visible";
    document.getElementById("input6").style.visibility = "visible";
}

function changeFormToCryptocurrency(){
    document.getElementById("input1Label").innerHTML = "symbol";
    document.getElementById("input2Label").innerHTML = "price";
    
    document.getElementById("input3Label").innerHTML = "coin_type";
    document.getElementById("input3").type = "text";
    document.getElementById("input3").maxlength="3";

    document.getElementById("input4Label").innerHTML = "market_cap";
    document.getElementById("input5Label").innerHTML = "high_price";
    document.getElementById("input6Label").innerHTML = "low_price";

    document.getElementById("input6Label").style.visibility = "visible";
    document.getElementById("input6").style.visibility = "visible";
}

function changeFormToCommodity(){
    document.getElementById("input1Label").innerHTML = "name";
    document.getElementById("input2Label").innerHTML = "price";
    
    document.getElementById("input3Label").innerHTML = "commodity_type";
    document.getElementById("input3").type = "text";
    document.getElementById("input3").maxlength="3";

    document.getElementById("input4Label").innerHTML = "high_price";
    document.getElementById("input5Label").innerHTML = "low_price";

    //need to hide the last input for a new commodity, because commodities only have 5 fields
    //https://www.w3schools.com/jsref/prop_style_visibility.asp
    document.getElementById("input6Label").style.visibility = "hidden";
    document.getElementById("input6").style.visibility = "hidden";

}