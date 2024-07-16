require("dotenv").config();
const express = require('express')
const router = express.Router()
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')

const User = require('../models/User')



// @route POST api/auth/register
//@desc Register user
// @access Piblic
router.post('/register', async (req, res) => {
    const { username, password } = req.body

    //simple validation
    if (!username || !password)
        return res.status(400).json({ success: false, message: 'thieu mat user name hoac password' })

    try {
        //check for existing user
        const user = await User.findOne({ username })

        if (user)
            return res.status(400).json({ success: false, message: 'Ten nguoi dung da duoc su dung ' })

        //All good

        const hasdedPassword = await argon2.hash(password)
        const newUser = new User({ username, password: hasdedPassword })

        await newUser.save()

        // return token (kiem tra dung user da regster truoc do khong de lay du lieu)
        const accessToken = jwt.sign(
            { userId: newUser._id }
            , process.env.ACCESS_TOKEN_SECRET
        )
        
        res.json({success: true, message: 'user create successfuly', accessToken})

    } catch (error) {

    }
})

module.exports = router