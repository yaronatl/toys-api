const express = require("express")
const bcrypt = require("bcrypt");
const { UserModel, validUser, validLogin, createToken } = require("../models/userModel")
const router = express.Router();

router.get("/", async (req, res) => {
    res.json({ msg: "users endpoint work" })
})

router.post("/", async (req, res) => {
    const validBody = validUser(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        const user = new UserModel(req.body);
        user.email = user.email.trim().toLowerCase()
        // the role is never taken from the body
        user.role = "user"
        user.password = await bcrypt.hash(user.password, 10)
        await user.save();
        user.password = "*****"
        res.status(201).json(user)
    }
    catch (err) {
        // 11000 -> duplicate email
        if (err.code == 11000) {
            return res.status(400).json({ err: "Email already in system", code: 11000 })
        }
        console.log(err);
        res.status(502).json({ err })
    }
})

router.post("/login", async (req, res) => {
    const validBody = validLogin(req.body);
    if (validBody.error) {
        return res.status(400).json(validBody.error.details);
    }
    try {
        const user = await UserModel.findOne({ email: req.body.email.trim().toLowerCase() })
        if (!user) {
            return res.status(401).json({ err: "Email not found" })
        }
        const passValid = await bcrypt.compare(req.body.password, user.password)
        if (!passValid) {
            return res.status(401).json({ err: "Password not match" })
        }
        const newToken = createToken(user._id, user.role)
        res.json({ token: newToken })
    }
    catch (err) {
        console.log(err);
        res.status(502).json({ err })
    }
})

module.exports = router;
