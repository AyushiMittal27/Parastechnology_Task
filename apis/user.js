const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const sendEmail = require('../utils/email');
require('dotenv').config();

console.log(process.env.MONGO_DB_URL)

// signin as a new user
router.post(
    "/signin",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter password").exists(),
    ],

    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        const { email, password } = req.body;

        try {
            const existingUser = User.find({ email: email });
            if (existingUser) {
                return res.status(400).json({ error: 'User Already Exists' });
            }
            const user = new User({ email, password, confirmationToken });
            await user.save();
            const confirmationToken = jwt.sign({ email: req.body.email }, process.env.SECRET_KEY);
            const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
            sendEmail(
                user.email,
                'Account Confirmation',
                `<h1>Email Confirmation</h1>
                <h2>Hello ${user.email}</h2>
                <p>Thank you for registring. Please confirm your email by clicking on the following link</p>
                <a href=http://localhost:5001/confirmation/${confirmationCode}> Click here</a>
                </div>`
            )
            res.json({ success: "User registered Successfully. Please check your mail", token, confirmationToken });

        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
);

// confirm email
router.get('/confirmation/:confirmationCode', async (req, res, next) => {
    try {
        const user = await User.findOne({ confirmationToken: req.params.confirmationCode });
        if (!user) {

            return res.status(400).json({ error: 'User Not Found' });
        }
        user.status = 'active';
        user.confirmationToken = undefined;
        await user.save();
        return res.status(200).json({ success: "Account verified" });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
})

// login
router.post(
    "/signup",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter password").exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return res.status(422).json({ error: "User with that email not found" });
            }
            await existingUser.comparePassword(password);
            const token = jwt.sign(
                { userId: existingUser._id },
                process.env.SECRET_KEY
            );
            if (existingUser.status !== 'active') {
                return res.status(401).json({ error: "Pending Account Verificatio.Please Verfify Your Email" });
            }
            return res.json({ token: token });
        } catch (err) {
            return res.status(422).json({ error: err });
        }
    }
);


// forgot password email
router.post("/forgot",
    [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter password").exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array() });
        }
        try {
            const buf = await crypto.randomBytes(20);
            const token = buf.toString("hex");

            const { email } = req.body;
            const user = await User.findOne({ email: email });
            if (!user) {
                console.log("No user with that email");
                return res
                    .status(400)
                    .json({ error: "No account with that email addresss exist" });
            }
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();
            await sendEmail(user.email, 'Password Reset Notification', "<h3>You are receiving this notifiation because you have requested the reset of the password. Please click on this url to complete the password reset process </h3>" +
                " \n" +
                "https://localhost:5001/api/user/reset" +
                token);
            return res.status(200).json({ success: "email for reset send", token })

        } catch (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
        }
    });

// confirm new  password
router.post("/reset/:token", async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({ error: "No such user exist" });
        }
        user.password = req.body.password;
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;
        await user.save();
        return res.json({ msg: "You pasword has been sucesfully reset" });
    } catch (err) {
        return res.status(400).json({ error: "Something went wrong" });
    }
});

module.exports = router;