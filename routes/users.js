var express = require("express");
var router = express.Router();
router.use(express.static('public'));

//accessing the database
var User=require('../models/user');
// var Admin = require('../models/admin');


//encryption of registration data
var bcrypt=require('bcryptjs');

//JSON and URL Body parser
var bodyParser=require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var body_parse=bodyParser.json()

//passport middleware
const { ensureAuthenticated,forwardAuthenticated } = require('../config/auth');

module.exports =  function(passport){
    router.get('/login',forwardAuthenticated,function(req,res){
        res.render('login');
    });

    router.get('/register',forwardAuthenticated,function(req,res){
        res.render('signup');
    });

    router.post('/login',(req,res,next)=>{
        passport.authenticate('local', {
            successRedirect: '/dashboard',
            failureRedirect: '/users/login',
            failureFlash: true
        })(req, res, next);
    });

    router.post('/register',function(req,res){
        // console.log("Register request",req.body);
        let errors = [];
        const {name,email,password} = req.body
        // console.log("Login request",req.body);
        if (!name || !email || !password ) {
            console.log( 'Please enter all fields' );
            errors.push({msg: 'Please enter all fields'});
        }
        if(password.length<6){
            console.log("Password must be atleast 6 characters long");
            errors.push({msg: 'Password must be atleast 6 characters'});
        }
        if (errors.length > 0) {
            res.render('register', {
              errors,
              email,
              password,
            })
        }
        else{
            User.findOne({'email':email}).then(user =>{
                console.log("User :",user);
                if(user){
                    console.log("User already exists");
                    errors.push({ msg: 'Email already exists' });
                    res.render('register', {
                        errors,
                        email,
                        password,
                    });
                }
                else{
                    var newUser = new User();
                    newUser.name = req.body.name;
                    newUser.email = req.body.email;
                    newUser.password=req.body.password;
                    
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) 
                                throw err;
                        newUser.password = hash;
                        // console.log(hash);
                        newUser.save().then(user => {
                            req.flash(
                                'success_msg',
                                'You are now registered and can log in'
                            );
                            res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                        });
                    });
                }
            })
        }
    })

    router.get('/logout', (req, res) => {
        req.logout();
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });

    return router;
}