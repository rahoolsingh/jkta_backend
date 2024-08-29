const User = require("../model/user");
const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");

dotenv.config();

const saltKey = process.env.SALT_KEY;
const merchantId = process.env.MERCHANT_ID;
const frontendURL = process.env.FRONTEND_URL;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to handle file uploads
const upload = multer({ dest: "uploads/" }); // Temporary folder to store files before uploading to Cloudinary

// Function to handle file uploads with Multer
const uploadFiles = (req, res) => {
  return new Promise((resolve, reject) => {
    const uploadSingle = upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "certificate", maxCount: 1 },
      { name: "residentCertificate", maxCount: 1 },
      { name: "adharFrontPhoto", maxCount: 1 },
      { name: "adharBackPhoto", maxCount: 1 },
    ]);

    uploadSingle(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(req.files);
    });
  });
};

// Function to upload files to Cloudinary
const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
    });
    return result.secure_url; // Return the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

exports.register = async (req, res, next) => {
  try {
    const files = await uploadFiles(req, res);

    const {
      athleteName,
      fatherName,
      motherName,
      dob,
      gender,
      district,
      mob,
      email,
      adharNumber,
      address,
      pin,
      panNumber,
      academyName,
      coachName,
    } = req.body;

    // Initialize file URLs to be stored in the database
    let photoUrl,
      certificateUrl,
      residentCertificateUrl,
      adharFrontPhotoUrl,
      adharBackPhotoUrl;

    // Upload each file to Cloudinary and get the URL
    if (files.photo) {
      photoUrl = await uploadToCloudinary(files.photo[0].path, "uploads");
      fs.unlinkSync(files.photo[0].path); // Delete the file after uploading
    }
    if (files.certificate) {
      certificateUrl = await uploadToCloudinary(
        files.certificate[0].path,
        "uploads"
      );
      fs.unlinkSync(files.certificate[0].path); // Delete the file after uploading
    }
    if (files.residentCertificate) {
      residentCertificateUrl = await uploadToCloudinary(
        files.residentCertificate[0].path,
        "uploads"
      );
      fs.unlinkSync(files.residentCertificate[0].path); // Delete the file after uploading
    }
    if (files.adharFrontPhoto) {
      adharFrontPhotoUrl = await uploadToCloudinary(
        files.adharFrontPhoto[0].path,
        "uploads"
      );
      fs.unlinkSync(files.adharFrontPhoto[0].path); // Delete the file after uploading
    }
    if (files.adharBackPhoto) {
      adharBackPhotoUrl = await uploadToCloudinary(
        files.adharBackPhoto[0].path,
        "uploads"
      );
      fs.unlinkSync(files.adharBackPhoto[0].path); // Delete the file after uploading
    }

    // Create a new user record
    const newUser = await User.create({
      athleteName,
      fatherName,
      motherName,
      dob,
      gender,
      district,
      mob,
      email,
      adharNumber,
      address,
      pin,
      panNumber,
      academyName,
      coachName,
      active: false,
      photo: photoUrl,
      certificate: certificateUrl,
      residentCertificate: residentCertificateUrl,
      adharFrontPhoto: adharFrontPhotoUrl,
      adharBackPhoto: adharBackPhotoUrl,
    });

    // Prepare data for payment request
    const data = {
      merchantId,
      merchantTransactionId: newUser._id,
      name: newUser.athleteName,
      amount: 69 * 100, // Convert to smallest currency unit
      redirectUrl: `${frontendURL}/status?id=${newUser._id}`,
      redirectMode: "POST",
      mobileNumber: newUser.mob,
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

    const prodURL = `${process.env.PROD_URL}/pg/v1/pay`;

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

    // Send payment request
    const response = await axios(options);
    res.json(response.data);
  } catch (error) {
    console.error("Error in register function:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the user." });
  }
};

exports.checkStatus = async (req, res) => {
  const transactionId = req.query.id;
  try {
    const keyIndex = 1;
    const stringToHash = `/pg/v1/status/${merchantId}/${transactionId}${saltKey}`;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    const options = {
      method: "GET",
      url: `${process.env.PROD_URL}/pg/v1/status/${merchantId}/${transactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
    };

    const response = await axios(options);
    if (response.data.success) {
      User.findByIdAndUpdate(transactionId, { active: true });
    }

    return res.json(response.data);
  } catch (error) {
    console.error("Error in /status:", error);
    return res.status(500).json({
      error: "An error occurred while checking the payment status.",
    });
  }
};
