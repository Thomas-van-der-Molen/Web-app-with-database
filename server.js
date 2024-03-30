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
//
//
const express = require('express');

const maria = require('mariadb');
const app = express();

const bodyParser = require('body-parser');
const multer = require('multer');
var upload = multer();


app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true })); 

app.set("view engine", "ejs");

var cookieParser = require('cookie-parser');
app.use(cookieParser());


async function queryDB(query){
    let conn;
    try{
        conn = await maria.createConnection({
            host : 'localhost',
            user : 'root',
            password : 'root',
            database : 'awesomeassets'
        });

       var users = await conn.query(query);
       return users;

    } catch (err){
        console.log(err);
    } finally {
        if (conn) await conn.close();
    }
}

//Vulnerable to client-side cookie manipulation
app.get('/', (req, res)=>{
    res.clearCookie("loginDetails");
    var users = queryDB("select * from users;");
    users.then(function(result){
        res.render('index', {users:  result});
    })

});

app.get("/account", (req, res)=>{
   

    var LoggedInUser = req.cookies["loginDetails"]["username"];
        
    var query = `SELECT asset, quantity FROM portfolios WHERE username='${LoggedInUser}';`;
    var assets = queryDB(query);
    query = `SELECT balance FROM users WHERE username='${LoggedInUser}';`;
    var balance = queryDB(query);
    Promise.all([assets, balance]).then(function(result){
        res.render("account", {user: LoggedInUser, assets:result[0], balance:result[1]});
    });
   
});

app.get("/deleteAccount", (req, res)=>{
    var LoggedInUser = req.cookies["loginDetails"]["username"];
    res.clearCookie("loginDetails");
    var query = `DELETE FROM users WHERE username='${LoggedInUser}';`
    
    var deleteUser = queryDB(query);
    deleteUser.then(function(result){
        res.redirect("/");
    });
});

app.get("/market", (req,res)=>{
    //the first time the user visits the market, they see this
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

app.post("/trade", (req, res)=>{
    //the user desires to make a trade.
    //Find out if the trade was a buy or sell.
    //If it was a purchase, determine if they have enough money to make the purchase
    //if so, add the appropriate stocks to their account and show their account. and subtract the correct balance
    //if not, do nothing and return them to their account
    //if it was a sale, determine if they have the stocks needed to sell
    //if so, add the correct balance to their account and remove the correct stocks from their account
    //then return them to their account
    //if they did not have enough stocks for the sale, do nothing and return them to their account
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
    
    if(quantity <= numberOwned){
        //user has the assets to sell
        //update their portfolio to remove the stock
        //increase their balance
        //if they already owned the stock, update the value
        var query;
        query = `UPDATE portfolios SET quantity=${Number(numberOwned)-Number(quantity)} WHERE username='${LoggedInUser}' and asset='${asset}';`;
        //otherwise, make a new entry in portfolios
        var updatePortfolio = queryDB(query);
        //update the user's balance
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

function validateLogin(username, password, res){

    var query = "SELECT password FROM users WHERE username='"+username+"';";
    
    var login = queryDB(query);
    login.then(function(result){
        if (password == result[0].password){
            //login was valid
	    //give the user a cookie containing their username, security issue
            var login = {"username" : username}
	    res.cookie("loginDetails", login);

	    res.redirect("account");
        }
        else{
            //login was invalid
            res.redirect("/");
        }
    });
}

function createUser(username, password, res){

    //first, check if the user already exists

    var users = queryDB("SELECT username FROM users;");
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
            var query = `insert into users (username, password) values ('${username}', '${password}');`
            var insertUser = queryDB(query);
            
        }

        res.redirect("/");
    });
}



app.listen(3000);
