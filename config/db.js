const mongoose = require('mongoose');

// const uri = "mongodb+srv://paramesh:do7zSGvCunwKJORR@cluster0.e4oz0ms.mongodb.net/Sharvi_Invoice";
const uri = "mongodb://SharviDb:Sharvi%401234@192.168.1.4:27017/Invoice?authSource=admin&ssl=false";

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
