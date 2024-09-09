const PDFDocument = require("pdfkit");
const fs = require("fs");
const PNG = require("pngjs").PNG;

const generateCertificate = async ({
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

  // Stream the PDF to a file
  doc.pipe(fs.createWriteStream("Id-Card.pdf"));

  // Add background image
  doc.image("athelete-front.png", 0, 0, { width: 1011 });

  // Add text fields
  doc
    .fontSize(22)
    .font("Times-Bold")
    .fillColor("white")
    .text(id, 243, 140);

  doc
    .fontSize(30)
    .font("Times-Bold")
    .fillColor("black")
    .text(name.toUpperCase(), 420, 200);

  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("blue")
    .text(parentage.toUpperCase(), 580, 302)
    .text(gender.toUpperCase(), 580, 344)
    .text(dob, 580, 386)
    .text(district.toUpperCase(), 580, 428)
    .text(valid.toUpperCase(), 580, 470);

  doc.image("avatar.png", 112, 218, { width: 220 });

  doc.addPage();

  doc.image("back.png", 0, 0, { width: 1011 });

  // Finalize the PDF file after all content is added
  doc.end();
  console.log("PDF created successfully with QR code");
};

const makeAvatar = async () => {
  fs.createReadStream("photo.png")
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
              Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2)) +
                radius ||
            y <=
              -Math.sqrt(Math.pow(radius, 2) - Math.pow(x - radius, 2)) + radius
          ) {
            this.data[idx + 3] = 0;
          }
        }
      }
      this.pack().pipe(fs.createWriteStream("avatar.png"));
    });
};



module.exports={generateCertificate,makeAvatar};