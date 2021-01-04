//this schema is for VOTERS
var mongoose=require('mongoose');
module.exports = mongoose.model('admins',
{
    emailList:{
        type:Array,
    },
    projectList:{
        type:Array,
    },
    categoryList:{
        type:Array,
    }
});

