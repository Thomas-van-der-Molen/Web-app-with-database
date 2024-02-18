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
var LoggedInUser;
//utterly insane

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
    
    var query = `SELECT asset, quantity FROM portfolios WHERE username='${LoggedInUser}';`
    var assets = queryDB(query);
    assets.then(function(result){
        res.render("account", {user: LoggedInUser, assets: result});
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
    listings.then(function(result){

        res.render("market", {listings : result});
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