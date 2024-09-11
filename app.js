const express=require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const Mongoose = require("mongoose");
app.use(cors());
app.use(bodyParser.json({ extended: false }));

const User=require("./routes/user")
app.use(User);

Mongoose.connect(
    "mongodb+srv://veer001:XxHVM4Jg0iCP3HMY@cluster0.plav2.mongodb.net/jkta",
  ).then(() => {
    app.listen(3000);
    console.log("connect");
  });
  