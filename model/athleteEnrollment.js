const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AtheleteEnrollment = new Schema({
  enrollmentNumber: {
    type: String,
    require: true,
    index: true,
    unique: true,
  },
  regNo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Athlete",
  },
 
});
module.exports = mongoose.model("AtheleteEnrollment", AtheleteEnrollment);
