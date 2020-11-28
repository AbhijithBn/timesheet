//this schema is for VOTERS
var mongoose=require('mongoose');
module.exports = mongoose.model('users',
{
    name: {
        type: String,
    },
    email:{
        type: String, 
        unique: true, 
    },
    password: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
    timesheetObj: [{
        dateValue : {
            type: String
        },
        timeData : {
            type: Array
        }
    }],
    isAdmin:{
        type:Boolean,
    },
    emailList:{
        type:Array,
    },
    projectList:{
        type:Array,
    },
    categoryList:{
        type:Array,
    }
})

