/*
 *Name: Thomas van der Molen
 *File: server.js
 *
 *
 * The purpose of this js file is to function as the server's "back end" It contains the necessary server-side logic
 * It is also where the web server connects to the database and executes queries
 *
 */

//sources referenced during implementation
//
//https://www.youtube.com/watch?v=SccSCuHhOw0&t=779s 
//https://www.tutorialspoint.com/expressjs/expressjs_form_data.htm
//https://www.geeksforgeeks.org/http-cookies-in-node-js/
//https://stackoverflow.com/questions/38884522/why-is-my-asynchronous-function-returning-promise-pending-instead-of-a-val
//
//https://medium.com/swlh/dealing-with-multiple-promises-in-javascript-41d6c21f20ff
//https://www.tutorialspoint.com/expressjs/expressjs_form_data.htm
//https://stackoverflow.com/questions/35737482/multiple-submit-buttons-html-express-node-js
//https://mariadb.com/kb/en/getting-started-with-the-nodejs-connector/
//https://www.geeksforgeeks.org/node-js-hash-digest-method/

//dependencies
const express = require('express');
const maria = require('mariadb');
const bodyParser = require('body-parser');
const multer = require('multer');
const crypto = require('crypto');
var cookieParser = require('cookie-parser');

const app = express();
var upload = multer();


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());

app.set("view engine", "ejs");

//function which will accept a string formatted as a query as input
//The function will then connect to the local database and execute the query
async function queryDB(query){
    let conn;
    try{
        conn = await maria.createConnection({
            host : 'localhost',
            user : process.env.databaseUser,
            password : process.env.databasePass,
            database : 'awesomeassets'
        });

       var result = await conn.query(query);
       return result;

    } catch (err){
        console.log(err);
    } finally {
        if (conn) await conn.close();
    }
}

//The home page of the site
//Presented when the user logs out or visits for the first time
app.get('/', (req, res)=>{
    //clear the cookie in case the user was logged in
    res.clearCookie("loginDetails");

    //get the users in the database, to show available users to 
    var users = queryDB("select * from users;");
    users.then(function(result){
        res.render('index', {users:  result});
    })

});

app.post("/deletelisting", (req,res)=>{

    var listingToDelete = req.body.listing;
    var currentExchange = req.cookies["loginDetails"]["username"];

    //delete the appropriate asset
    var query = `DELETE FROM listings WHERE exchange='${currentExchange}' AND asset='${listingToDelete}';`;
    var deleteListing = queryDB(query);
    deleteListing.then(function(result){

        res.redirect("/exchangeaccount");
    });
});


//After the user has logged in, they can view the account page
app.get("/account", (req, res)=>{
   
    //use the user's cookie to get the user's username
    var LoggedInUser = req.cookies["loginDetails"]["username"];
        
    //get the user's assets from the database
    var query = `SELECT asset, quantity FROM portfolios WHERE username='${LoggedInUser}';`;
    var assets = queryDB(query);

    //get the user's balance
    query = `SELECT balance FROM users WHERE username='${LoggedInUser}';`;
    var balance = queryDB(query);
    Promise.all([assets, balance]).then(function(result){
        res.render("account", {user: LoggedInUser, assets:result[0], balance:result[1]});
    });
   
});

app.get("/exchangeaccount", (req, res)=>{

    var LoggedInExchange = req.cookies["loginDetails"]["username"];
    
    var query = `SELECT asset FROM listings WHERE exchange='${LoggedInExchange}';`;
    var listings = queryDB(query);

    Promise.all([listings]).then(function(result){

        res.render("exchangeAccount", {user: LoggedInExchange, listings: result[0]});
    });

});

//If the user requests to delete their account, this logic is triggered
app.get("/deleteAccount", (req, res)=>{
    //Use the user's cookie to get their username
    var LoggedInUser = req.cookies["loginDetails"]["username"];
    //clear the cookie, to end the user's session
    res.clearCookie("loginDetails");

    //delete the user from the database
    //NEED TO FIX THIS - only the user's entry in the users table is deleted
    //All the information about their portfolio will persist though
    var query = `DELETE FROM users WHERE username='${LoggedInUser}';`
    var deleteUser = queryDB(query);
    deleteUser.then(function(result){
        res.redirect("/");
    });
});

//When the user navigates to the market page, this logic will trigger
app.get("/market", (req,res)=>{

    var query = `select * from listings;`
    var listings = queryDB(query);

    query = `select distinct exchange from listings;`
    var exchanges = queryDB(query);

    query = `select * from stocks;`
    var stocks = queryDB(query);

    query = `select * from cryptocurrencies;`
    var cryptos = queryDB(query);

    query = `select * from commodities;`
    var commodities = queryDB(query);

    Promise.all([listings, exchanges, stocks, cryptos, commodities]).then(function(result){
        res.render("market", {listings: result[0], exchanges: result[1],
                            stocks: result[2], cryptos: result[3],
                            commodities: result[4]
                            });
    });

})

//When the user submits the login form on the login page, this logic triggers
app.post("/login", (req, res)=>{
    var inputUsername = req.body.username;
    var inputPassword = req.body.password;
    var action = req.body.loginbutton;

    if(inputUsername == "" || inputPassword==""){
        //invalid input
        res.redirect("/");
        return;
    }

    if(action == "Login"){
        //login
        validateLogin(inputUsername, inputPassword, res);
    }
    else{
        //create account
        createUser(inputUsername, inputPassword, res);
    }
});

app.post("/searchAsset", (req,res)=>{
    var searchValue = req.body.searchValue;
    //console.log(searchValue);

    //problem: the user is searching for an asset, but there is no way to search all assets simply
    //maybe not a problem?
    //just do the query 3 times
    var query = `SELECT * FROM stocks WHERE symbol like '%${searchValue}%';`;
    var stockResults = queryDB(query);

    query = `SELECT * FROM cryptocurrencies WHERE symbol like '%${searchValue}%';`;
    var cryptoResults = queryDB(query);

    query = `SELECT * FROM commodities WHERE name like '%${searchValue}%';`;
    var commodityResults = queryDB(query);

    Promise.all([stockResults, cryptoResults, commodityResults]).then(function(result){
        res.render("market", {stocks:result[0], cryptos:result[1], 
                            commodities:result[2]});
    });
});

//When the user submits the form for a trade, this logic triggers
app.post("/trade", (req, res)=>{
    //the user desires to make a trade.
    //Find out if the trade was a buy or sell.
    //If it was a purchase, determine if they have enough money to make the purchase
    //if so, add the appropriate stocks to their account and subtract the correct balance
    //if not, do nothing
    //if it was a sale, determine if they have the stocks needed to sell
    //if so, add the correct balance to their account and remove the correct stocks from their account
    //if they did not have enough stocks for the sale, do nothing 
    var buyOrSell = req.body.buyOrSell;
    var asset = req.body.asset;
    var quantity = req.body.quantity;
    var LoggedInUser = req.cookies["loginDetails"]["username"];
   
    //find the user's balance
    var balance = queryDB(`SELECT balance FROM users WHERE username='${LoggedInUser}';`);
    //then calculate the total price of the purchase
    var query = 
    `select r1.price from
    (select symbol, price from stocks
    union
    select symbol, price from cryptocurrencies
    union
    select name, price from commodities) r1
    where r1.symbol='${asset}';`;
    var price = queryDB(query);

    //find how much of the stock the user owns
    query = `SELECT quantity FROM portfolios WHERE username='${LoggedInUser}' and asset='${asset}';`
    var numberOwned = queryDB(query);

    //wait for queries to return
    Promise.all([balance, price, numberOwned]).then(function(result){
        var totalPrice = quantity * result[1][0].price;
        balance = result[0][0].balance;

        //check if the "numberOwned" query returned a result
        if(result[2][0]){
            numberOwned = result[2][0].quantity;
        }
        else{
            numberOwned = 0;
        }

        if(buyOrSell == "buy"){
            buyStock(asset, quantity, totalPrice, balance, numberOwned, LoggedInUser);
        }
        else{
            sellStock(asset, quantity, totalPrice, balance, numberOwned, LoggedInUser);
        }
    });
    
    res.redirect("/market");

});

//helper functions for the /trade post request
function buyStock(asset, quantity, cost, balance, numberOwned, LoggedInUser){

    //check that the amout to buy was not negative
    if(quantity <= 0){
        return;
    }
    
    if(cost < balance){
        //user can afford to buy
            
        var query;
        if(numberOwned > 0){
            //if they already owned the stock, update the value
            query = `UPDATE portfolios SET quantity=${Number(quantity)+Number(numberOwned)} WHERE username='${LoggedInUser}' and asset='${asset}';`;
        }
        else{
           //otherwise, make a new entry in portfolios
            query = `INSERT INTO portfolios values ('${LoggedInUser}', '${asset}', ${quantity});`;
        }

        var updatePortfolio = queryDB(query);
        //update the user's balance
        query = `UPDATE users SET balance=${Number(balance)-Number(cost)} WHERE username='${LoggedInUser}';`;
        var updateBalance = queryDB(query);
           
	    Promise.all([updatePortfolio, updateBalance]).then(function(result){
                return;
	    });
        
    }

}
function sellStock(asset, quantity, cost, balance, numberOwned, LoggedInUser){

    //check that the quantity was not negative
    if(quantity <=0){
        return;
    }
    
    if(quantity <= numberOwned){
        //user has the assets to sell
        //update their portfolio to remove the stock
        //increase their balance
        //if they already owned the stock, update the value
        var query;
        query = `UPDATE portfolios SET quantity=${Number(numberOwned)-Number(quantity)} WHERE username='${LoggedInUser}' and asset='${asset}';`;
        
        var updatePortfolio = queryDB(query);
   
        query = `UPDATE users SET balance=${Number(balance)+Number(cost)} WHERE username='${LoggedInUser}';`;
        var updateBalance = queryDB(query);
        var removeIfZero;

        //just do some housekeeping work - delete all portfolio entries if the quantity is zero.
        if(Number(numberOwned) - Number(quantity) == 0){
            query = `DELETE FROM portfolios WHERE quantity=0;`;
            removeIfZero = queryDB(query);
        }
        
        Promise.all([updatePortfolio, updateBalance, removeIfZero]).then(function(result){
            return;
	    });	

    }

}

//Helper function to make sure that the user has submitted valid login details
function validateLogin(username, password, res){

    var query = "SELECT password FROM users WHERE username='"+username+"';";
    var login = queryDB(query);
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    
    query = `SELECT isExchange FROM users WHERE username='${username}';`;
    var isExchange = queryDB(query);
	
    Promise.all([login, isExchange]).then(function(result){
        //need to check if the entered username was valid, otherwise the server will crash
        if(result[0][0]){
            if (hash  == result[0][0].password){
                //login was valid
                //give the user a cookie containing their username, security issue
                var login = {"username" : username}
                res.cookie("loginDetails", login);

                //if the user is an exchange owner or a regular user, server them the appropriate page
                if(result[1][0].isExchange == 1){
                    //give exchange page
                    
                    res.redirect("/exchangeaccount");
                }
                else{
                    //user is regular user, give regular account page
                    res.redirect("account");
                }
            }
            else{
                //login was invalid
                res.redirect("/");
            }
        }
        else{
            //the username that was entered is not valid
            res.redirect("/");
        }
    });
}

//Helper function to create a user if the user wants to make a new account
function createUser(username, password, res){

    //first, check if the user already exists

    var users = queryDB("SELECT username FROM users;");
    var hash = crypto.createHash("sha256").update(password).digest("hex");
    users.then(function(result){
        var exists = false;

        result.forEach(element => {
            if (element.username == username){
                //the user already exists, do nothing
                console.log("the user already exists!");
                exists = true;
            }
        });


        //the user does not exist, create a new user
        if(!exists){
            var query = `insert into users (username, password, balance, isExchange) values ('${username}', '${hash}', 10000, false);`
            var insertUser = queryDB(query);
        }

        res.redirect("/");
    });
}


//start the app - boilerplate
app.listen(3000);
