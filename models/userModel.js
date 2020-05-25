const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// name, email, photo, password, password confirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
  },
  email: {
    type: String,
    required: [true, 'Provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Provid a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Confirm your password'],
    validate: {
      // this only works on CREATE and SAVE
      validator: function (pass) {
        return pass === this.password;
      },
      message: 'Passwords dont match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Document middleware to encript password before save it in DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next;
  this.password = await bcrypt.hash(this.password, 12);
  //   it's only used to run validation, we dont save it in DB
  this.passwordConfirm = undefined;
  next();
});

// Document Middleware to update passwordChangedAt when password is modified
userSchema.pre('save', function (next) {
  // if password is not modified don't do anything
  if (!this.isModified('password') || this.isNew) return next();

  //   1s before, so token date is after this date
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query Middleware, dont return users with active= false, for all queries using 'find'
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// checks if password provided by user is correct
userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// return true if password was changed after JWTTimestamp
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // if it doesnt exist it was never changed
  if (this.passwordChangedAt) {
    //   converting ...
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
