const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const supportUploadDir = path.join(__dirname, "../../uploads/support");

if (!fs.existsSync(supportUploadDir)) {
  fs.mkdirSync(supportUploadDir, { recursive: true });
}

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, supportUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const uploadScreenshot = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG, and WEBP files are allowed."));
    }

    cb(null, true);
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function getLoggedInUser(req) {
  return {
    id: req.user?.id || req.user?.userId || "N/A",
    name:
      req.user?.name ||
      req.user?.full_name ||
      req.user?.username ||
      "Logged-in Staff",
    email: req.user?.email || "N/A",
    role: req.user?.role || "N/A",
  };
}

function escapeHtml(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

router.post("/feedback-email", authenticateToken, async (req, res) => {
  try {
    const { module, feedback_type, rating, message } = req.body;

    if (!module || !feedback_type || !message) {
      return res.status(400).json({
        success: false,
        message: "Module, feedback type, and message are required.",
      });
    }

    const user = getLoggedInUser(req);

    const dateSubmitted = new Date().toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
    });

    await transporter.sendMail({
      from: `"Spartan BTY MIS" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_FEEDBACK_EMAIL,
      subject: `New Staff Feedback - ${module}`,
      html: `
        <h2>New Staff Feedback</h2>

        <p><strong>Submitted By:</strong> ${escapeHtml(user.name)}</p>
        <p><strong>Employee Email:</strong> ${escapeHtml(user.email)}</p>
        <p><strong>Role:</strong> ${escapeHtml(user.role)}</p>
        <p><strong>User ID:</strong> ${escapeHtml(user.id)}</p>

        <hr />

        <p><strong>Module:</strong> ${escapeHtml(module)}</p>
        <p><strong>Feedback Type:</strong> ${escapeHtml(feedback_type)}</p>
        <p><strong>Rating:</strong> ${escapeHtml(rating || "N/A")}</p>

        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>

        <hr />

        <p><strong>Date Submitted:</strong> ${escapeHtml(dateSubmitted)}</p>
      `,
    });

    return res.json({
      success: true,
      message: "Feedback sent successfully.",
    });
  } catch (error) {
    console.error("Feedback email error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email.",
    });
  }
});

router.post(
  "/support-email",
  authenticateToken,
  uploadScreenshot.single("screenshot"),
  async (req, res) => {
    try {
      const { module, issue_type, priority, description } = req.body;

      if (!module || !issue_type || !priority || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Module, issue type, priority, and description are required.",
        });
      }

      const user = getLoggedInUser(req);

      const dateSubmitted = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      });

      const attachments = [];

      if (req.file) {
        attachments.push({
          filename: req.file.originalname,
          path: req.file.path,
        });
      }

      await transporter.sendMail({
        from: `"Spartan BTY MIS" <${process.env.EMAIL_USER}>`,
        to: process.env.IT_SUPPORT_EMAIL,
        subject: `New Support Ticket - ${priority} - ${module}`,
        html: `
          <h2>New Support Ticket</h2>

          <p><strong>Submitted By:</strong> ${escapeHtml(user.name)}</p>
          <p><strong>Employee Email:</strong> ${escapeHtml(user.email)}</p>
          <p><strong>Role:</strong> ${escapeHtml(user.role)}</p>
          <p><strong>User ID:</strong> ${escapeHtml(user.id)}</p>

          <hr />

          <p><strong>Module:</strong> ${escapeHtml(module)}</p>
          <p><strong>Issue Type:</strong> ${escapeHtml(issue_type)}</p>
          <p><strong>Priority:</strong> ${escapeHtml(priority)}</p>

          <p><strong>Description:</strong></p>
          <p>${escapeHtml(description).replace(/\n/g, "<br />")}</p>

          <hr />

          <p><strong>Date Submitted:</strong> ${escapeHtml(dateSubmitted)}</p>
          <p><strong>Screenshot:</strong> ${
            req.file ? "Attached" : "No screenshot provided"
          }</p>
        `,
        attachments,
      });

      return res.json({
        success: true,
        message: "Support ticket sent successfully.",
      });
    } catch (error) {
      console.error("Support email error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send email.",
      });
    }
  }
);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Screenshot must not exceed 5MB.",
      });
    }
  }

  if (error.message === "Only JPG, JPEG, PNG, and WEBP files are allowed.") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Failed to send email.",
  });
});

module.exports = router;