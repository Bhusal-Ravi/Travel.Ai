import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({}, { strict: false });


export default mongoose.model('User', UserSchema, 'user');
