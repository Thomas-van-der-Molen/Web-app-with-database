const express = require('express');

const maria = require('mariadb');
const app = express();

//https://www.tutorialspoint.com/expressjs/expressjs_form_data.htm
const bodyParser = require('body-parser');
const multer = require('multer');
var upload = multer();

// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 

app.set("view engine", "ejs");

//credit also goes to 
//https://www.youtube.com/watch?v=SccSCuHhOw0&t=779s

//this is insane
var LoggedInUser = 'ernie';;
//utterly insane
//the currently logged in user is tracked via a server-side variable. 
//if the server is reset, the user will be logged out

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

app.get('/', (req, res)=>{

    var users = queryDB("select * from users;");
    //wowie this is pretty cool
    //https://stackoverflow.com/questions/38884522/why-is-my-asynchronous-function-returning-promise-pending-instead-of-a-val
    users.then(function(result){
        res.render('index', {users:  result});
    })

});

app.get("/account", (req, res)=>{
    
    var query = `SELECT asset, quantity FROM portfolios WHERE username='${LoggedInUser}';`;
    var assets = queryDB(query);
    query = `SELECT balance FROM users WHERE username='${LoggedInUser}';`;
    var balance = queryDB(query);
    Promise.all([assets, balance]).then(function(result){
        //console.log(result[1]);
        res.render("account", {user: LoggedInUser, assets:result[0], balance:result[1]});
    });
   
});

app.get("/deleteAccount", (req, res)=>{
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

    //https://medium.com/swlh/dealing-with-multiple-promises-in-javascript-41d6c21f20ff
    Promise.all([listings, exchanges, stocks, cryptos, commodities]).then(function(result){
        //console.log(result[1]);
        res.render("market", {listings: result[0], exchanges: result[1],
                            stocks: result[2], cryptos: result[3],
                            commodities: result[4]
                            });
    });

})

app.post("/login", (req, res)=>{
    //only took me an eon to figure out what's wrong
    //https://www.tutorialspoint.com/expressjs/expressjs_form_data.htm

    var inputUsername = req.body.username;
    var inputPassword = req.body.password;
    var action = req.body.loginbutton;

    //this is actually amazing
    //https://stackoverflow.com/questions/35737482/multiple-submit-buttons-html-express-node-js
    //mind blowing, really

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

    //just keep this for now

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
            //console.log(`number owned ${numberOwned}`);
        }
        else{
            numberOwned = 0;
        }

        if(buyOrSell == "buy"){
            buyStock(asset, quantity, totalPrice, balance, numberOwned);
        }
        else{
            sellStock(asset, quantity, totalPrice, balance, numberOwned);
        }
    });
    
    res.redirect("/market");

});

//helper functions for the /trade post request
function buyStock(asset, quantity, cost, balance, numberOwned){
    
    if(cost <= balance){
        //user can afford to buy
        
        //update their portfolio to include the stock
        //first check if they already owned the asset
        //if so, increase the quantity
        //else, insert a new value into portfolios
        //subtract from their balance
        if(cost < balance){
            //the user can make the purchase
            
            var query;
            if(numberOwned > 0){
                //if they already owned the stock, update the value
                query = `UPDATE portfolios SET quantity=${Number(quantity)+Number(numberOwned)} WHERE username='${LoggedInUser}' and asset='${asset}';`;
            }
            else{
                //otherwise, make a new entry in portfolios
                query = `INSERT INTO portfolios values ('${LoggedInUser}', '${asset}', ${quantity});`;
            }
            var updateTable = queryDB(query);
            //update the user's balance
            query = `UPDATE users SET balance=${Number(balance)-Number(cost)} WHERE username='${LoggedInUser}';`;
            updateTable = queryDB(query);
           //possibility for a race condition exists here?
        }
        
    }

}
function sellStock(asset, quantity, cost, balance, numberOwned){
    
    if(quantity <= numberOwned){
        //user has the assets to sell
        //update their portfolio to remove the stock
        //increase their balance
        //if they already owned the stock, update the value
        var query;
        query = `UPDATE portfolios SET quantity=${Number(numberOwned)-Number(quantity)} WHERE username='${LoggedInUser}' and asset='${asset}';`;
        //otherwise, make a new entry in portfolios
        var updateTable = queryDB(query);
        //update the user's balance
        query = `UPDATE users SET balance=${Number(balance)+Number(cost)} WHERE username='${LoggedInUser}';`;
        updateTable = queryDB(query);

        //just do some housekeeping work - delete all portfolio entries if the quantity is zero.
        if(Number(numberOwned) - Number(quantity) == 0){
            query = `DELETE FROM portfolios WHERE quantity=0;`;
            queryDB(query);
        }
    }

}

function validateLogin(username, password, res){

    var query = "SELECT password FROM users WHERE username='"+username+"';";
    
    var login = queryDB(query);
    login.then(function(result){
        if (password == result[0].password){
            //login was valid
            LoggedInUser = username;
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