var express = require("express");
var router = express.Router();
router.use(express.static('public'));

//accessing the database
var User = require('../models/user');
var Admin = require('../models/admin');

//encryption of registration data
var bcrypt=require('bcryptjs');

//JSON and URL Body parser
var bodyParser=require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var body_parse=bodyParser.json()

//passport middleware
const { ensureAuthenticated,forwardAuthenticated } = require('../config/auth');
const { json } = require("body-parser");
const e = require("express");

module.exports =  function(passport){
    //welcome page get request
    router.get('/',forwardAuthenticated,(req,res) =>{
        res.render("welcome");
    })

    // dashboard get request
    router.get('/dashboard',ensureAuthenticated ,(req, res) => { 
            Admin.findOne({_id:"5fe04578c7b3e807b0256337"},(err,admin)=>{
                if(admin){
                    // console.log(admin);
                    res.render('dashboard', {
                        user: req.user,
                        projectList:admin.projectList,
                        categoryList:admin.categoryList,
                        isAdmin:req.user.isAdmin
                    })
                }
                else{
                    console.log(err);
                }
            })
        }
    );

    //data posted from Dashboard after clicking on submit
    router.post('/timeSheetData',(req,res) =>{
        // console.log(req.body);
        User.findOne({email:req.body.user.userEmail},(err,user)=>{
            if(user){
                // console.log("User found in database");
                User.findOne({"timesheetObj":{$elemMatch:{"dateValue" :req.body.user.dateValue}},email:req.body.user.userEmail},(err,timeExist)=>{
                    if(timeExist){
                        // The selected time is already there in the database
                        // console.log("Time exists in db");
                        let timeArray = timeExist.timesheetObj;
                        let _id="";
                        for(let i=0;i<timeArray.length;i++){
                            if(timeArray[i].dateValue == req.body.user.dateValue){
                                for(let j=0;j<req.body.user.timeData.length;j++){
                                    timeArray[i].timeData.push(req.body.user.timeData[j]);
                                }
                                timeExist.save(function (err) {
                                    if(err) {
                                        console.error('ERROR!',err);
                                    }
                                });
                            }
                        }
                    }
                    else{
                        // console.log("Time does not exists in db");
                        //Selected time is not there in the database
                        let newObj  = {
                            dateValue : req.body.user.dateValue,
                            timeData : req.body.user.timeData
                        }
                        user.timesheetObj.push(newObj);
        
                        user.save(function (err) {
                            if(err) {
                                console.error('ERROR!',err);
                            }
                        });
                    }
                })
            }
            else{
                console.log("User Does not exist",err);
            }

        })
    })

    //Admin console GET Request
    router.get('/admin',ensureAuthenticated,(req,res)=>{
        Admin.findOne({_id:"5fe04578c7b3e807b0256337"},(err,admin)=>{
            if(admin){
                if(req.user.isAdmin){
                    // console.log(admin.emailList,admin.projectList,admin.categoryList);
                    res.render('admin',
                    {
                        emailList: admin.emailList,
                        projectList: admin.projectList,
                        categoryList: admin.categoryList
                    });
                }
                else{
                    res.redirect('/dashboard');
                }
            }
            else{
                console.log(err);
            }
        })
    })

    //post request when changes are made and submit button is clicked in Admin page
    router.post('/adminpost',(req,res)=>{   
        let adminList = req.body.adminList;
        User.find({},(err,user)=>{
            // console.log(user,user.length);
            for(let i=0;i<user.length;i++){
                // console.log(adminList.indexOf(user[i].email));
                if(adminList.indexOf(user[i].email)!=-1){
                    user[i].isAdmin = true;
                }
                else{
                    user[i].isAdmin = false;
                }
                user[i].save((err)=>{
                    if(err){
                        console.log("Error in saving :",err );
                    }
                })
            }
            
        })

        Admin.findOne({_id:"5fe04578c7b3e807b0256337"},(err,user)=>{
            if(user){
                user.emailList = req.body.adminList;
                user.projectList = req.body.projectList;
                user.categoryList = req.body.categoryList;
                user.save((err)=>{
                    if(err){
                        console.log("Error in saving :",err );
                    }
                })
            }
            else{
                let newadmin = new Admin();
                newadmin.emailList = req.body.adminList;
                newadmin.projectList = req.body.projectList;
                newadmin.categoryList = req.body.categoryList;
                newadmin.save()
                .then(user => {
                    console.log("user after saving data",user);
                })
                .catch(err => console.log(err));
            }
        })
    });

    

    router.get('/listview',ensureAuthenticated,(req,res) =>{
        let objArray = req.user.timesheetObj;
        // console.log(objArray);
        let newTimeArr = [];
        let newDataArr = [];
        for(let i=0;i<objArray.length;i++){
            newTimeArr.push(objArray[i].dateValue);
            newDataArr.push(objArray[i].timeData);
        }
        // console.log(newTimeArr,newDataArr);
        res.render('listview',{
            email:req.user.email,
            newTimeArr:newTimeArr,
            newDataArr:newDataArr,
            isAdmin:req.user.isAdmin
        });
    })

    router.get('/export',ensureAuthenticated,(req,res)=>{
        const projection = { name: 1 , timesheetObj:1};
        if(req.user.isAdmin){
            let UserTimesheetData;
            User.find({},projection)
            .then(value =>{
                // console.log(value,typeof(value));
                res.render('export',{data:value});
            })
            .catch(err => console.log("Error is :",err))
        }
        else{
            res.redirect("/dashboard");
        }
    })
    return router;
}