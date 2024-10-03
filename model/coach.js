const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const coachSchema = new Schema(
    {
        regNo: String,
        playerName: String,
        fatherName: String,
        motherName: String,
        dob: String,
        gender: String,
        district: String,
        mob: String,
        email: String,
        adharNumber: String,
        address: String,
        pin: String,
        panNumber: String,
        photo: String,
        blackBeltCertificate: String,
        birthCertificate: String,
        residentCertificate: String,
        adharFrontPhoto: String,
        adharBackPhoto: String,
        status: {
            enum: ["pending", "approved", "rejected"],
            type: String,
            default: "pending",
        },
        payment: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Coach", coachSchema);
