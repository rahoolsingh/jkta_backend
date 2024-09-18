const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AtheleteEnrollment = new Schema({
  enrollmentNumber: {
    type: String,
  },
 
});
module.exports = mongoose.model("AtheleteEnrollment", AtheleteEnrollment);
