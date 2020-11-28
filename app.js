var express = require("express");
var app = express();
const flash = require('connect-flash');

//server port
var PORT=process.env.PORT||9000;

//JSON and URL Body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));// if there is an error at body parsing the change it to False
app.use(bodyParser.json());//body is represented in json format
app.use(express.static('public'));// for the use of html files

//EJS
app.set('view engine','ejs');

//configure database and mongoose schema
var mongoose=require('mongoose');
var dbConfig=require('./db');
mongoose
    .connect(
        dbConfig.url,
        { 
            useNewUrlParser: true ,
            useUnifiedTopology: true,
            useCreateIndex: true
        }
    )
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

//passport JS Middleware
var passport=require('passport');//passport.js for authentication
var session = require("express-session");
app.use(session({
     secret: "secret",
     resave: true,
     saveUninitialized: true 
}));
//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

require('./config/passport')(passport);

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//Express Router
app.use('/',require('./routes/index.js')(passport));
app.use('/users',require('./routes/users.js')(passport));
// app.use('/', routes);

var server=app.listen(PORT,function(){
    var host=server.address().address
    var port=server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
})