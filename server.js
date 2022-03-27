const express = require('express');
const mongoose = require('mongoose');
const app = express();
const routes = require('./apis/index');
require('dotenv').config();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api',routes );


mongoose.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


mongoose.connection.on("connected", () => {
    console.log("MongoDB succesfully connected");
});

mongoose.connection.on("error", (err) => {
    console.log("Error connecting on mongo  -", err);
});


app.listen(process.env.PORT, () => {
    console.log(`server  listening on port ${process.env.PORT}`);
})