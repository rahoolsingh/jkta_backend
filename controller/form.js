const User = require("../model/user");

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
    .then((data) => {
      //console.log(data);
      res.status(201).json({ User: data });
    })
    .catch((err) => console.log(err));
};
