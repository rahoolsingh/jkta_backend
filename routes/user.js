const express=require('express');
const Router =express.Router()
const UserControll=require("../controller/form");
const CoachController=require("../controller/coachForm");


Router.get('/',(req,res)=>{
    res.send("Khamma Ghani Sa");
})

Router.post('/register-user',UserControll.register);

Router.post('/verify-payment',UserControll.verifyPayment);

Router.post('/register-coach',CoachController.register);

Router.post('/verify-payment-coach',CoachController.verifyPayment);

// Health check endpoint
Router.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  


module.exports=Router;