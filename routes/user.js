const express=require('express');
const Router =express.Router()
const UserControll=require("../controller/form");
const FormController=require("../controller/pass");
Router.post('/register-user',UserControll.register);
Router.get('/generatePass',FormController.passGenerator);
module.exports=Router;