const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// Login Page
router.get("/login", adminController.loadLogin);

// Login Submit
router.post("/login", adminController.loginAdmin);

// Logout
router.get("/logout", adminController.logoutAdmin);

module.exports = router;