const express=require('express');
const Router =express.Router()
const UserControll=require("../controller/form");

Router.post('/register-user',UserControll.register);
module.exports=Router;