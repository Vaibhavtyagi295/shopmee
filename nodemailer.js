const nodemailer = require("nodemailer");
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `435177554066-hfhnbo07oeiojrl6kflg7emplkdppog2.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//04hbc3GhtVHh5CgYIARAAGAQSNwF-L9IrreNax4MUXCv5LrxjYYrvOwGJoFgSvtibdmhvChn8Jn9GIjGu5mklarjbHSf9pSfiSZQ`;
const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, 
REDIRECT_URI);
authClient.setCredentials({refresh_token: REFRESH_TOKEN});
async function mailer(email,otp, userid){
 try{
 const ACCESS_TOKEN = await authClient.getAccessToken();
 const transport = nodemailer.createTransport({
 service: "gmail",
 auth: {
 type: "OAuth2",
 user: "vaibhavtyagi295@gmail.com",
 clientId: CLIENT_ID,
 clientSecret: CLIENT_SECRET,
 refreshToken: REFRESH_TOKEN,
 accessToken: ACCESS_TOKEN
 }
 })
 const details = {
 from: "<vaibhavtyagi295@gmail.com>",
 
 to:email,
 subject: "hacker",
 text: "jay hind dosto",
 html: `<a href="http://localhost:3000/forgot/${userid}/otp/${otp}">reset password</a>`

 }
 const result = await transport.sendMail(details);
 return result;
 }
 catch(err){
 return err;
 }
}
mailer().then(res => {
 console.log("sentmail!",/*res*/);
})

module.exports = mailer;
