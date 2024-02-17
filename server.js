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
    console.log("hey this request was redirected to account");
    //console.log(req.body.username);

    res.render("account", {user: LoggedInUser});
});

app.post("/login", (req, res)=>{
    //only took me an eon to figure out what's wrong
    //https://www.tutorialspoint.com/expressjs/expressjs_form_data.htm

    var uname = req.body.username;
    var pword = req.body.password;
    var action = req.body.loginbutton;

    //this is actually amazing
    //https://stackoverflow.com/questions/35737482/multiple-submit-buttons-html-express-node-js
    //mind blowing, really

    if(action == "Login"){
        //login
        if (validateLogin(uname, pword)){
            //the login was valid
            //res.render("account", {user: req.body.username});
            LoggedInUser = uname;
            res.redirect("account");
        }
        else{
            //the login was invalid
            //simply return the user to the homepage
            res.redirect("/");
        }
    }
    else{
        //create account
    }
});

function validateLogin(username, password){
    var query = "SELECT password FROM users WHERE username='"+username+"';";
    
    var login = queryDB(query);
    login.then(function(result){
        console.log(result);
        return false;
    });
}

function createUser(username, password){

}



app.listen(3000);