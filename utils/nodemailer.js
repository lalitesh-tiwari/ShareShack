const nodemailer = require("nodemailer");

const sendmail = async function (res, user, url) {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: "laliteshtiwari00@gmail.com",
        pass: "nufesbmkqxgaoomc",
      },
    });

    const mailOptions = {
      from: "ShareShack Pvt. Ltd. <ShareShack@Social.app>",
      to: user.email,
      subject: "Reset Your Password",
      text: "Do Not Share This Link With Anyone",
      html: `<h2>Hey, ${user.fullname}</h2> </br>
        <p>Your One-Time Password Reset Link is Here.</p> </br>
        <a href=${url}>Click Here!</a>`,
    };

    transport.sendMail(mailOptions, async (err, info) => {
      if (err) return res.send(err);
      console.log(info);

      user.resetPasswordToken = 1;
      await user.save();

      res.send(`<p>Check Your Email Inbox!</p>`);
    });
  } catch (error) {
    res.send(error);
  }
};

module.exports = sendmail;
