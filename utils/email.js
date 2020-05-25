const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Lyang <${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //   send real emails
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: env.process.SENDGRID_USERNAME,
          pass: env.process.SENDGRID_PASSWORD,
        },
      });
    }

    // otherwise use mailtraper
    // Create a transporter
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        subject,
        url: this.url,
      }
    );

    //  define email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Reset Password');
  }
};
