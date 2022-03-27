const nodemailer = require('nodemailer');
require('dotenv').config();


const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_PASSWORD;


const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: user,
        pass: pass
    }
})

module.exports.sendEmail= ( email, subject , content )=>{
   return transport.sendMail({
        from: user,
        to: email,
        subject:subject,
        html: content,
      }).catch(err => console.log(err));
}



