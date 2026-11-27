const Admin = require("../models/Admin");

// Load Login Page
exports.loadLogin = (req, res) => {
    res.render("adminLogin");
};

// Login Admin
exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.send("❌ Admin not found");
        }

        if (admin.password !== password) {
            return res.send("❌ Invalid Password");
        }

        // Session create
        req.session.admin = admin._id;

        res.redirect("/admin");

    } catch (error) {
        console.log(error);
        res.send("Server Error");
    }
};

// Logout
exports.logoutAdmin = (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
};