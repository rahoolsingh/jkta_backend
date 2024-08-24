const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const userSchema=new Schema({
    playerName: String,
    fatherName: String,
    dob: String,
    gender: String,
    district: String,
    mob: String,
    email: String,
    adharNumber: String,
    address: String,
    pin: String,
    panNumber: String,
    photo: String,
});

module.exports=mongoose.model("Coach",userSchema);