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
    isAdmin:{
        type:Boolean,
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpires:{
        type:String
    },
    timesheetObj: [{
        dateValue : {
            type: String
        },
        timeData : {
            type: Array
        }
    }],
})

