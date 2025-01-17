const mongoose = require('mongoose'); // import the mongoose 
// we write schema in which the data need to stored in data base
const MessageSchema = new mongoose.Schema({
    sender:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    recipient:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    text:String, 
},{timestamps:true}); // created at and updated at

// now we can create the model 
// const MessageModel = mongoose.model('name of the model', 'schema of the model')
const MessageModel = mongoose.model('Message', MessageSchema);
module.exports = MessageModel;