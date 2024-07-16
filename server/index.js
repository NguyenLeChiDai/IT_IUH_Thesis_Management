const express = require('express')
const mongoose = require("mongoose");
require("dotenv").config();


const authRouter = require('./routes/auth')
//------- Kết nối CSDL
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewURLParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
}
connectDB();


const app = express()
app.use(express.json())

app.use('/api/auth', authRouter)


const PORT = process.env.PORT || 5000; // Sử dụng PORT từ môi trường hoặc mặc định là 5000


app.listen(PORT, () => console.log(`Server started on port ${process.env.PORT}`))