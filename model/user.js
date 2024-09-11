const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    regNo: String,
    athleteName: String,
    fatherName: String,
    motherName: String,
    dob: Date,
    gender: String,
    district: String,
    mob: String,
    email: String,
    adharNumber: String,
    address: String,
    pin: String,
    panNumber: String,
    academyName: String,
    coachName: String,
    photo: String,
    certificate: String,
    residentCertificate: String,
    adharFrontPhoto: String,
    adharBackPhoto: String,
    payment: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Athlete", userSchema);
