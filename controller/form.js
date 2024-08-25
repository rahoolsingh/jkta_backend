const User = require("../model/user");
const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const saltKey = process.env.SALT_KEY;
const merchantId = process.env.MERCHANT_ID;
const frontendURL = process.env.FRONTEND_URL;

exports.register = (req, res, next) => {
  const athleteName = req.body.athleteName;
  const fatherName = req.body.fatherName;
  const motherName = req.body.motherName;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const district = req.body.district;
  const mob = req.body.mob;
  const email = req.body.email;
  const adharNumber = req.body.adharNumber;
  const address = req.body.address;
  const pin = req.body.pin;
  const panNumber = req.body.panNumber;
  const academyName = req.body.academyName;
  const coachName = req.body.coachName;
  User.create({
    athleteName: athleteName,
    fatherName: fatherName,
    motherName: motherName,
    dob: dob,
    gender: gender,
    district: district,
    mob: mob,
    email: email,
    adharNumber: adharNumber,
    address: address,
    pin: pin,
    panNumber: panNumber,
    academyName: academyName,
    coachName: coachName,
  })
    .then(async (data1) => {
      
        try {
          
          const data = {
            merchantId,
            merchantTransactionId: data1._id,
            name:data1.athleteName,
            amount: 69 * 100, // Convert to smallest currency unit
            redirectUrl: `${frontendURL}/status?id=${data1._id}`,
            redirectMode: "POST",
            mobileNumber: data1.mob,
            paymentInstrument: {
              type: "PAY_PAGE",
            },
          };

          const payload = JSON.stringify(data);
          const payloadMain = Buffer.from(payload).toString("base64");
          const keyIndex = 1;
          const stringToHash = `${payloadMain}/pg/v1/pay${saltKey}`;
          const sha256 = crypto
            .createHash("sha256")
            .update(stringToHash)
            .digest("hex");
          const checksum = `${sha256}###${keyIndex}`;

          const prodURL =
            "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

          const options = {
            method: "POST",
            url: prodURL,
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              "X-VERIFY": checksum,
            },
            data: {
              request: payloadMain,
            },
          };

          const response =  await axios(options);
          console.log(response.data);
          return res.json(response.data);
        } catch (error) {
          console.error("Error in /order:", error);
          return res
            .status(500)
            .json({ error: "An error occurred while processing the order." });
        }
    }).then((res1)=>{
      console.log(res1);
    })
    .catch((err) => console.log(err));
};
