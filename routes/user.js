const express=require('express');
const Router =express.Router()
const UserControll=require("../controller/form");
const CoachController=require("../controller/coachForm");
Router.post('/register-user',UserControll.register);

Router.post('/verify-payment',UserControll.verifyPayment);

Router.post('/register-coach',CoachController.register);

Router.post('/verify-payment-coach',CoachController.verifyPayment);


module.exports=Router;