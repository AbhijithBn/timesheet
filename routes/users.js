var express = require("express");
var router = express.Router();
router.use(express.static('public'));

var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//accessing the database
var User=require('../models/user');
var Admin = require('../models/admin');

//encryption of registration data
var bcrypt=require('bcryptjs');

//JSON and URL Body parser
var bodyParser=require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var body_parse=bodyParser.json()

//passport middleware
const { ensureAuthenticated,forwardAuthenticated } = require('../config/auth');
const admin = require("../models/admin");

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
            res.render('signup', {
              errors,
              email,
              password,
            })
        }
        else{
            User.findOne({'email':email}).then(user =>{
                // console.log("User :",user);
                if(user){
                    console.log("User already exists");
                    errors.push({ msg: 'Email already exists' });
                    res.render('signup', {
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
                    newUser.isAdmin = false;
                    
                    // let adminFlag;
                    // Admin.findOne({_id:"5fe04578c7b3e807b0256337"},(err,admin)=>{
                    //     if(admin){
                    //         console.log("email list",admin.emailList," type of email ", typeof(admin.emailList));
                    //         console.log("Email exists",admin.emailList.indexOf(req.body.email));
                    //         if(admin.emailList.indexOf(req.body.email)!=-1){
                    //             adminFlag = true;

                    //             console.log(adminFlag,newUser);
                    //         }
                    //         else{
                    //             adminFlag = false;
                    //         }
                    //     }
                    //     else{
                    //         console.log(err);
                    //     }
                    // })

                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) 
                                throw err;
                        newUser.password = hash;
                        console.log("User is ",newUser);
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

    router.get('/forgot',(req,res)=>{
        res.render("forgot");
    })

    router.post('/forgot',(req,res)=>{
        let errors = [];
        console.log(req.body);
        async.waterfall([  //array of functions that get called one after the other
            //generate a 20bit Hexadecimal token
            function(done){ //done is a callback function 
                crypto.randomBytes(20,(err,buf)=>{
                    var token = buf.toString('hex');
                    done(err,token);
                })
            },
            //check if the entered email address is there in db, update database flags for that user if present
            function(token,done){
                User.findOne({email:req.body.email},(err,user)=>{
                    if(!user){
                        // req.flash('error', 'No account with that email address exists.');
                        errors.push({msg:'No account with that email address exists.'});
                        return res.render('forgot',{errors});
                    }
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now()+3600000; //expires after 1 hour
                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token,user,done){
                var smtpTransport = nodemailer.createTransport({
                    service:'Gmail',
                    auth:{
                        user:'abhijith.bn@whatfix.com',
                        pass: 'utuyddvuzltfutld'
                    }
                });
                var mailOptions = {
                    to:user.email,
                    from:'abhijithspam97@gmail.com',
                    subject: 'TimeSheet Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    console.log('mail sent');
                    req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    res.redirect('/users/login');
                    done(err, 'done');
                });
            }
        ],function(err){
            if(err){
                console.log("error in forgot push");
                return next(err);
            }
            res.redirect('/users/forgot');
        })
    })

    router.get('/reset/:token',(req,res)=>{
        let errors = [];
        User.findOne({ resetPasswordToken :req.params.token  ,resetPasswordExpires:{$gt:Date.now()}},(err,user)=>{
            if(!user){
                // req.flash('error', 'Password reset token is invalid or has expired.')
                errors.push({msg:'Password reset token is invalid or has expired.'});
                return res.render('forgot',{errors});
            }
            res.render('reset',{token:req.params.token});
        })
    })

    router.post('/reset/:token',(req,res)=>{
        let errors = [];
        async.waterfall([
            function(done){
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },(err,user)=>{
                    if(!user){
                        errors.push({msg:'Password reset token is invalid or has expired.'})
                        return res.render('forgot',{errors});
                    }
                    if(req.body.password === req.body.confirm){
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        console.log("New password is ",req.body.password);

                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(req.body.password, salt, (err, hash) => {
                                if (err) 
                                    throw err;
                                user.password = hash;
                                console.log("User is ",user);
                                user.save().then(user => {
                                    done(err, user);
                                });
                            });
                        })
                    }
                    else{
                        req.flash('error_msg', 'Passwords do not match.');
                        return res.redirect('back');
                    }
                })
            },
            function(user,done){
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail', 
                    auth: {
                      user: 'abhijith.bn@whatfix.com',
                      pass: 'utuyddvuzltfutld'
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'learntocodeinfo@mail.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                      'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success_msg', 'Success! Your password has been changed.');
                    res.redirect('/users/login');
                    done(err);
                });
            }
        ],function(err) {
            res.redirect('/users/login');
        });
    });

    return router;
}