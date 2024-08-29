const User = require("../model/user");
exports.passGenerator = (req, res) => {
  const id = req.query.id;
  User.findOne({ _id: id }).then((result) => {
    res.status(200).json({ result });
  });
};
