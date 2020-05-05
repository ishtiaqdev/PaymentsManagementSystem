const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')
require('./models/db');
const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyparser = require('body-parser');
const port = 3000;

const paymentHistoryController = require('./controllers/paymentHistoryController');
const contractController = require('./controllers/contractController');

var app = express();
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());
app.set('views', path.join(__dirname, '/views/'));
app.engine('hbs', exphbs({ extname: 'hbs', defaultLayout: 'mainLayout', handlebars: allowInsecurePrototypeAccess(Handlebars), layoutsDir: __dirname + '/views/layouts/' }));
app.set('view engine', 'hbs');

app.listen(port, () => {
    console.log('Express server started at port : ' + port);
});

app.use('/paymenthistory', paymentHistoryController);
app.use('/contract', contractController);

app.get('*', function(req, res) {
    res.redirect('/paymenthistory');
});
