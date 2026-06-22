const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://acadmiaflow:acadmiaflowpass@cluster0.j5ln14h.mongodb.net/academiaflow?retryWrites=true&w=majority&appName=Cluster0';

async function checkAdmins() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.useDb('academiaflow');
    const User = db.collection('users');
    const admins = await User.find({ role: 'admin' }).toArray();
    console.log('Admin accounts:', admins);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAdmins();
