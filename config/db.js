const mongoose = require('mongoose');

const uri = "mongodb+srv://paramesh:do7zSGvCunwKJORR@cluster0.e4oz0ms.mongodb.net/Sharvi_Invoice";

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Database Connected successfully");
    } catch (err) {
        console.error("Database connection error:", err);
    }
};

module.exports = connectDB;
