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
    app.listen(process.env.PORT || 3000);
    console.log(`Database connected & Server is running on port ${process.env.PORT || 3000}`);
  }).catch((err) => {
    console.error("Error connecting to database:", err);
  }
  );