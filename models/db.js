require('dotenv').config()
require("./PaymentHistory");
require("./Contract");

const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL, 
    { 
        keepAlive: 1,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useNewUrlParser: true,
    }, (err) => {
    if (!err) { console.log('MongoDB connection succeeded using mongoose object modeling tool.') }
    else { console.log('Error in DB connection : ' + err) }
});
