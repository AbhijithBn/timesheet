//this schema is for VOTERS
var mongoose=require('mongoose');
module.exports = mongoose.model('users',
{
    name: {
        type: String,
        required: true
    },
    email:{
        type: String, 
        unique: true, 
        required: true
    },
    password: {
        type: String,
        required: true
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
    }]
})

