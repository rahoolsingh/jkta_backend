const Coach = require("../model/coach"); // Use the Coach model
const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const Razorpay = require("razorpay");

dotenv.config();

// Initialize Razorpay instance using environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Function to handle file uploads
const uploadFiles = (req, res) => {
  return new Promise((resolve, reject) => {
    const uploadSingle = upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "blackBeltCertificate", maxCount: 1 },
      { name: "birthCertificate", maxCount: 1 },
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

const saveFileToRoot = async (filePath, filename) => {
  const rootDir = path.join(__dirname, "..", filename); // Save in root directory
  const readStream = fs.createReadStream(filePath);
  const writeStream = fs.createWriteStream(rootDir);

  return new Promise((resolve, reject) => {
    readStream.pipe(writeStream);

    writeStream.on("finish", () => {
      console.log(`File saved to root as ${filename}`);
      resolve(rootDir);
    });

    writeStream.on("error", (error) => {
      reject(error);
    });
  });
};

// Register function
exports.register = async (req, res, next) => {
  try {
    // Upload files using Multer
    const files = await uploadFiles(req, res);

    const {
      playerName,
      fatherName,
      dob,
      gender,
      district,
      mob,
      email,
      adharNumber,
      address,
      pin,
      panNumber,
    } = req.body;

    // Initialize URLs for file uploads
    let photoUrl,
      blackBeltCertUrl,
      birthCertUrl,
      residentCertUrl,
      adharFrontUrl,
      adharBackUrl;

    // Upload photo to Cloudinary
    if (files.photo) {
      const fileName = `photo.png`;
      await saveFileToRoot(files.photo[0].path, fileName);

      photoUrl = await uploadToCloudinary(files.photo[0].path, "uploads");
      fs.unlinkSync(files.photo[0].path); // Remove file after upload
    }
    if (files.blackBeltCertificate) {
      blackBeltCertUrl = await uploadToCloudinary(
        files.blackBeltCertificate[0].path,
        "uploads"
      );
      fs.unlinkSync(files.blackBeltCertificate[0].path);
    }
    if (files.birthCertificate) {
      birthCertUrl = await uploadToCloudinary(
        files.birthCertificate[0].path,
        "uploads"
      );
      fs.unlinkSync(files.birthCertificate[0].path);
    }
    if (files.residentCertificate) {
      residentCertUrl = await uploadToCloudinary(
        files.residentCertificate[0].path,
        "uploads"
      );
      fs.unlinkSync(files.residentCertificate[0].path);
    }
    if (files.adharFrontPhoto) {
      adharFrontUrl = await uploadToCloudinary(
        files.adharFrontPhoto[0].path,
        "uploads"
      );
      fs.unlinkSync(files.adharFrontPhoto[0].path);
    }
    if (files.adharBackPhoto) {
      adharBackUrl = await uploadToCloudinary(
        files.adharBackPhoto[0].path,
        "uploads"
      );
      fs.unlinkSync(files.adharBackPhoto[0].path);
    }

    // Create a new coach in the database with the new fields
    const newCoach = await Coach.create({
      playerName,
      fatherName,
      dob,
      gender,
      district,
      mob,
      email,
      adharNumber,
      address,
      pin,
      panNumber,
      active: false,
      photo: photoUrl,
      blackBeltCertificate: blackBeltCertUrl,
      birthCertificate: birthCertUrl,
      residentCertificate: residentCertUrl,
      adharFrontPhoto: adharFrontUrl,
      adharBackPhoto: adharBackUrl,
    });

    // Prepare Razorpay order options
    const orderOptions = {
      amount: 6900, // amount in paise (69 * 100 = 6900 paise = ₹69)
      currency: "INR",
      receipt: `order_rcptid_${newCoach._id}`,
      payment_capture: 1, // Auto capture payment
    };

    // Create Razorpay order
    const order = await razorpayInstance.orders.create(orderOptions);

    // Send order details to the client for further processing
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      coachId: newCoach._id,
    });
  } catch (error) {
    console.error("Error in register function:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the coach." });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = req.body;

    // Generate the expected signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.key_secret) // Use Razorpay key_secret
      .update(razorpay_order_id + "|" + razorpay_payment_id) // Concatenate order_id and payment_id
      .digest("hex");

    // Compare the generated signature with the signature received from Razorpay
    if (generatedSignature === razorpay_signature) {
      // Payment verified successfully

      const coachData = await Coach.findById(userId);



      await sendWithAttachment(
        coachData.email,
        "Here is your ID card from JKTA",
        "Please find your id card attatched below",
        "<p>Please find your id card attatched below</p>",
        "test.txt",
        "./test.txt"
      );
      res.status(201).json({ message: "Email Sent successfully" });

      console.log(coachData);
    } else {
      // Payment verification failed
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error in verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
