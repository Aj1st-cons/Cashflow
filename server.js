import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.json({ limit: "5mb" }));

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate PDF from entries
function generatePDF(entries, closedDays) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc.fontSize(18).text("Transaction Report", { align: "center" });
      doc.moveDown();

      doc.fontSize(14).text("Entries:", { underline: true });
      entries.forEach(e => {
        doc.fontSize(12).text(
          `${e.date} ${e.time} | ${e.description} | ${e.amount.toFixed(2)}`
        );
      });

      doc.moveDown();
      doc.fontSize(14).text("Closed Days:", { underline: true });
      Object.keys(closedDays).forEach(day => {
        doc.fontSize(12).text(day);
        closedDays[day].forEach(e => {
          doc.text(`   ${e.date} ${e.time} | ${e.description} | ${e.amount.toFixed(2)}`);
        });
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Route for sending PDF via email
app.post("/share", async (req, res) => {
  try {
    const { entries, closedDays } = req.body;

    const pdfBuffer = await generatePDF(entries, closedDays);

    await transporter.sendMail({
      from: `"Transaction Logger" <${process.env.SMTP_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: "Transaction Report",
      text: "Attached is the transaction report PDF.",
      attachments: [
        {
          filename: "transactions.pdf",
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true, message: "Report sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
