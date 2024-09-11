const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const sharp = require("sharp");

const formatDate = (dateString) => {
    // Convert the input string to a Date object
    const date = new Date(dateString);

    // Get day, month, and year
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = date.getFullYear();

    // Return in DD-MM-YYYY format
    return `${day}-${month}-${year}`;
};

// Convert an image to PNG
const convertToPNG = async (inputPath, outputPath) => {
    await sharp(inputPath).png().toFile(outputPath);
    console.log("Image converted to PNG successfully.");
};

const makeAvatar = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const inputImage = path.resolve(__dirname, "../download.png");
            const outputImage = path.resolve(__dirname, "../photo.png");

            await convertToPNG(inputImage, outputImage);

            const photoPath = path.resolve(__dirname, "../photo.png");
            const avatarPath = path.resolve(__dirname, "../avatar.png");

            fs.createReadStream(photoPath)
                .pipe(
                    new PNG({
                        filterType: 4,
                    })
                )
                .on("parsed", function () {
                    for (var y = 0; y < this.height; y++) {
                        for (var x = 0; x < this.width; x++) {
                            var idx = (this.width * y + x) << 2;
                            var radius = this.height / 2;
                            if (
                                y >=
                                    Math.sqrt(
                                        Math.pow(radius, 2) -
                                            Math.pow(x - radius, 2)
                                    ) +
                                        radius ||
                                y <=
                                    -Math.sqrt(
                                        Math.pow(radius, 2) -
                                            Math.pow(x - radius, 2)
                                    ) +
                                        radius
                            ) {
                                this.data[idx + 3] = 0;
                            }
                        }
                    }
                    this.pack()
                        .pipe(fs.createWriteStream(avatarPath))
                        .on("finish", () => {
                            console.log("Avatar created successfully");
                            resolve();
                        })
                        .on("error", reject);
                });
        } catch (error) {
            reject(error);
        }
    });
};

const generateCard = async ({
    id,
    type,
    name,
    parentage,
    gender,
    dob,
    district,
    valid,
}) => {
    // Create a new PDF document
    const doc = new PDFDocument({
        layout: "landscape",
        size: [639, 1011],
        margin: 60,
    });

    await makeAvatar();

    // Stream the PDF to a file
    const outputPath = path.resolve(__dirname, "../Id-Card.pdf");
    doc.pipe(fs.createWriteStream(outputPath));

    // Paths for background and avatar images
    let frontImagePath = "";
    let backImagePath = "";
    if (type === "A") {
        frontImagePath = path.resolve(__dirname, "../athelete-front.png");
        backImagePath = path.resolve(__dirname, "../athelete-back.png");
    } else if (type === "C") {
        frontImagePath = path.resolve(__dirname, "../coach-front.png");
        backImagePath = path.resolve(__dirname, "../coach-back.png");
    }

    const avatarImagePath = path.resolve(__dirname, "../avatar.png");

    // Add background image
    doc.image(frontImagePath, 0, 0, { width: 1011 });

    // Add text fields
    doc.fontSize(22)
        .font("Helvetica-Bold")
        .fillColor("red")
        .text(id.toUpperCase(), 243, 136);

    doc.fontSize(30)
        .font("Times-Bold")
        .fillColor("black")
        .text(name.toUpperCase(), 420, 178);

    doc.fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text(parentage.toUpperCase(), 580, 302)
        .text(gender.toUpperCase(), 580, 365)
        .text(formatDate(dob), 580, 407)
        .text(district.toUpperCase(), 580, 449)
        .text(valid.toUpperCase(), 580, 491);

    // Add the avatar image
    doc.image(avatarImagePath, 112, 218, { width: 220 });

    // Add a new page for the back side
    doc.addPage();

    // Add the back image
    doc.image(backImagePath, 0, 0, { width: 1011 });

    // Finalize the PDF file after all content is added
    await doc.end();
    console.log("PDF created successfully");
};

module.exports = { generateCard };
