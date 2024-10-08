const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const multer = require("multer");
const csvWriter = require("csv-writer").createObjectCsvWriter;
const User = require("../model/User");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// User Registration
router.post("/register", upload.single("image"), async (req, res) => {
  const { firstname, lastname, email, number, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstname,
    lastname,
    email,
    number,
    image: req.file.path,
    password: hashedPassword,
  });

  await newUser.save();
  res.status(201).json({ message: "User registered successfully" });
});

router.get("/download-users", async (req, res) => {
  const users = await User.find().select("-password"); // exclude password
  const csvWriterInstance = csvWriter({
    path: "users.csv",
    header: [
      { id: "firstname", title: "First Name" },
      { id: "lastname", title: "Last Name" },
      { id: "email", title: "Email" },
      { id: "number", title: "Number" },
      { id: "role", title: "Role" },
    ],
  });

  csvWriterInstance.writeRecords(users).then(() => {
    res.download("users.csv"); // trigger download
  });
});

// Middleware for Role-Based Permissions
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
router.get("/admin", authorize(["admin"]), (req, res) => {
  res.send("Welcome Admin!");
});

module.exports = router;
