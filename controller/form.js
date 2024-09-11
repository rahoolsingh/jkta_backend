const User = require("../model/user");
const axios = require("axios");
const crypto = require("crypto");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const Razorpay = require("razorpay");
const path = require("path");
const { generateCard } = require("../controller/idcard");
const {
    sendMail,
    sendWithAttachment,
} = require("../controller/mailController");
const { use } = require("../routes/user");

dotenv.config();

const saltKey = process.env.SALT_KEY;
const merchantId = process.env.MERCHANT_ID;
const frontendURL = process.env.FRONTEND_URL;

// Initialize Razorpay instance using environment variables
const razorpayInstance = new Razorpay({
    key_id: process.env.key_id, // Use environment variables
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

        // Initialize file URLs
        let photoUrl,
            certificateUrl,
            residentCertificateUrl,
            adharFrontPhotoUrl,
            adharBackPhotoUrl;

        // Upload each file to Cloudinary
        if (files.photo) {
            const fileName = `download.png`;
            await saveFileToRoot(files.photo[0].path, fileName);
            photoUrl = await uploadToCloudinary(files.photo[0].path, "uploads");
            fs.unlinkSync(files.photo[0].path); // Remove file after upload
        }
        if (files.certificate) {
            certificateUrl = await uploadToCloudinary(
                files.certificate[0].path,
                "uploads"
            );
            fs.unlinkSync(files.certificate[0].path);
        }
        if (files.residentCertificate) {
            residentCertificateUrl = await uploadToCloudinary(
                files.residentCertificate[0].path,
                "uploads"
            );
            fs.unlinkSync(files.residentCertificate[0].path);
        }
        if (files.adharFrontPhoto) {
            adharFrontPhotoUrl = await uploadToCloudinary(
                files.adharFrontPhoto[0].path,
                "uploads"
            );
            fs.unlinkSync(files.adharFrontPhoto[0].path);
        }
        if (files.adharBackPhoto) {
            adharBackPhotoUrl = await uploadToCloudinary(
                files.adharBackPhoto[0].path,
                "uploads"
            );
            fs.unlinkSync(files.adharBackPhoto[0].path);
        }

        // Create a new user in the database
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
            photo: photoUrl,
            certificate: certificateUrl,
            residentCertificate: residentCertificateUrl,
            adharFrontPhoto: adharFrontPhotoUrl,
            adharBackPhoto: adharBackPhotoUrl,
        });

        // Prepare Razorpay order options
        const orderOptions = {
            amount: 6900, // amount in paise (69 * 100 = 6900 paise = ₹69)
            currency: "INR",
            receipt: `order_rcptid_${newUser._id}`,
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
            userId: newUser._id,
        });
    } catch (error) {
        console.error("Error in register function:", error);
        res.status(500).json({
            error: "An error occurred while registering the user.",
        });
    }
};

// Function to verify payment
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
            const userData = await User.findById(userId);
            //console.log(userData)
            // Payment verified successfully

            await generateCard({
                id: `${userData._id}`,
                type: "A",
                name: userData.athleteName,
                parentage: userData.fatherName,
                gender: userData.gender,
                valid: "ToDo",
                district: userData.district,
                dob: `${userData.dob}`,
            });

            await sendWithAttachment(
                userData.email,
                "Here is your ID card from JKTA",
                "Please find your id card attatched below",
                "<p>Please find your id card attatched below</p>",
                "Id-Card.pdf",
                "./Id-Card.pdf"
            );
            res.status(201).json({ message: "Email Sent successfully" });
        } else {
            // Payment verification failed
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }
    } catch (error) {
        console.error("Error in verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
