const express=require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const Mongoose = require("mongoose");
app.use(cors());
app.use(bodyParser.json({ extended: false }));

const User=require("../jkta_backend/routes/user")
app.use(User);

Mongoose.connect(
    "mongodb+srv://suryanshdwivedi615:GT7J8FxgWGXDnwDq@cluster0.q8wfrdt.mongodb.net/jkta?retryWrites=true&w=majority&appName=Cluster0"
  ).then(() => {
    app.listen(3000);
    console.log("connect");
  });
  