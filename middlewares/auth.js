const jwt = require("jsonwebtoken");

exports.auth = (req,res,next) => {
    const token = req.header("x-api-key");
    if (!token) {
        return res.status(401).json({ err: "You need to send a token in the x-api-key header" })
    }
    try {
        const decodeToken = jwt.verify(token,process.env.TOKEN_SECRET )
        req.tokenData = decodeToken
        next()
    }
    catch (err) {
        if (err.name == "TokenExpiredError") {
            return res.status(401).json({ err: "Token expired, please login again" })
        }
        res.status(401).json({err:"Token invalid"})
    }
}

exports.authAdmin = (req,res,next) => {
    const token = req.header("x-api-key");
    if (!token) {
        return res.status(401).json({ err: "You need to send a token in the x-api-key header" })
    }
    try {
        const decodeToken = jwt.verify(token,process.env.TOKEN_SECRET )
        if(decodeToken.role != "admin"){
            return res.status(401).json({ err: "You need to be admin at this endpoint" })
        }
        req.tokenData = decodeToken
        next()
    }
    catch (err) {
        if (err.name == "TokenExpiredError") {
            return res.status(401).json({ err: "Token expired, please login again" })
        }
        res.status(401).json({err:"Token invalid"})
    }
}
