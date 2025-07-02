const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  password: String,
  // For Firebase users
  firebaseUid: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true },
  name: String,
  provider: String, // e.g., 'google.com', 'facebook.com', 'password'
  accountType: {
    type: String,
    enum: ['manager', 'employee'],
    required: true
  }
});

userSchema.pre('save', async function(next) {
  // Only hash password if it's set and modified (for local users)
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);