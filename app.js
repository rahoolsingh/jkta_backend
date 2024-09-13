const express=require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const Mongoose = require("mongoose");
app.use(cors({
  origin:"*"
}));
app.use(bodyParser.json({ extended: false }));

const User=require("./routes/user")
app.use(User);

Mongoose.connect(
    process.env.DB_URL
  ).then(() => {
    app.listen(3000);
    console.log("connect");
  });
  