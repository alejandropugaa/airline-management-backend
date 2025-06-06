const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Customer = require('./Customer');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee', 'customer'], required: true },
  createdAt: { type: Date, default: Date.now },
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const userId = this._id;
  await Promise.all([
    Customer.deleteOne({ user: userId }),
    Employee.deleteOne({ user: userId }),
    Admin.deleteOne({ user: userId })
  ]);
  next();
});
module.exports = mongoose.model('User', userSchema);