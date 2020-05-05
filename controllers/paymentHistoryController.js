const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const PaymentHistory = mongoose.model('PaymentHistory');
const Contract = mongoose.model("Contract");

// GET request for main summary data structured of payment history items page.
router.get('/', payment_history_items_count); //payment_history_items_count

// GET request for creating Payment History.
router.get('/create', payment_history_create_get);

// POST request for creating Payment History.
router.post('/create', payment_history_create_update_post);

// GET request to update Payment History.
router.get('/update/:id', payment_history_update_get);

// POST request to update Payment History.
router.post('/update/:id', payment_history_create_update_post);

// GET request for list of all Payment History items.
router.get('/list', payment_history_list_get);

// post request for list of all Payment History items.
router.post('/list', payment_history_list_post);

// GET request to delete Payment History by _id.
router.get('/delete/:id', payment_history_delete_get);

function payment_history_create_get(req, res) {
    res.render("paymenthistory/addOrEdit", {
        title: "Add Payment History"
    });
}

function payment_history_create_update_post(req, res) {
    if (req.body.id == '')
        insertRecord(req, res);
    else
        updateRecord(req, res);
}

function payment_history_update_get(req, res) {
    PaymentHistory.findById(req.params.id, (err, doc) => {
        if (!err) {
            if(doc != null)
            {
                doc.time = convertDateToString(doc.time);
                res.render("paymenthistory/addOrEdit", {
                    title: "Update Payment History",
                    item: doc
                });
            }
            else
                return false;
        }
    });
}

function payment_history_list_manual_load(source, message, req, res) {
    PaymentHistory.find((err, docs) => {
        if (!err) {
            docs.forEach((element) => {
                element.time = convertDateToString(element.time);
                element.createdAt = convertDateToString(element.createdAt);
                element.updatedAt = convertDateToString(element.updatedAt);
            });
            if(source != null)
            {
                if(source == "searchwordempty") {
                    res.render("paymenthistory/list", {
                        list: docs,
                        searchDeleteError: message
                    });
                }
                else {
                    res.render("paymenthistory/list", {
                        list: docs,
                        success: message
                    });
                }
            }
            else {
                res.render("paymenthistory/list", {
                    list: docs,
                    success: message
                });
            }
        }
        else {
            console.log('Error in retrieving Payment History list :' + err);
        }
    });
}

function payment_history_list_get(req, res) {
    payment_history_list_manual_load(null, null, req, res);
}

function payment_history_list_post(req, res) {
    if(req.body.hasOwnProperty('startDate'))
    {
        if(req.body.startDate != "" && req.body.endDate != "" && req.body.contractId != "")
        {
            PaymentHistory.find({ time: { 
                                        $gte: setGMTHoursToDateTime(req.body.startDate, 2).toISOString(), 
                                        $lt: setGMTHoursToDateTime(req.body.endDate, 2).toISOString() 
                                    }, contractId: req.body.contractId}, (err, docs) => { 
                if (!err) {
                    docs.forEach((element) => {
                        element.time = convertDateToString(element.time);
                        element.createdAt = convertDateToString(element.createdAt);
                        element.updatedAt = convertDateToString(element.updatedAt);
                    });
                    res.render("paymenthistory/list", {
                        list: docs
                    });
                }
                else {
                    console.log('Error in retrieving Payment History list :' + err);
                }
            });   
        }
        else if(req.body.startDate != "" && req.body.endDate != "")
        {
            PaymentHistory.find({ time: { 
                                          $gte: setGMTHoursToDateTime(req.body.startDate, 2).toISOString(), 
                                          $lt: setGMTHoursToDateTime(req.body.endDate, 2).toISOString() }
                                        }, (err, docs) => { 
                if (!err) {
                    docs.forEach((element) => {
                        element.time = convertDateToString(element.time);
                        element.createdAt = convertDateToString(element.createdAt);
                        element.updatedAt = convertDateToString(element.updatedAt);
                    });
                    res.render("paymenthistory/list", {
                        list: docs
                    });
                }
                else {
                    console.log('Error in retrieving Payment History list :' + err);
                }
            });   
        }
        else if(req.body.contractId != "")
        {
            PaymentHistory.find({ contractId: req.body.contractId }, (err, docs) => { 
                if (!err) {
                    docs.forEach((element) => {
                        element.time = convertDateToString(element.time);
                        element.createdAt = convertDateToString(element.createdAt);
                        element.updatedAt = convertDateToString(element.updatedAt);
                    });
                    res.render("paymenthistory/list", {
                        list: docs
                    });
                }
                else {
                    console.log('Error in retrieving Payment History list :' + err);
                }
            });
        }
        else {
            payment_history_list_manual_load("searchwordempty", "Please enter Contract Id with or without both Start Date and End Date to search.", req, res)
        }
    }
}

function payment_history_delete_get(req, res) {
    PaymentHistory.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            payment_history_list_manual_load("deleteone", "One payment history has been deleted successfully!", req, res);
        }
        else { console.log('Error in payment history delete :' + err); }
    });
}

function insertRecord(req, res) {
    let payments = preparePaymentDocuments(req, res);
    if(payments.length > 0)
    {
        if(payments[0].contractId != "" && payments[0].contractId != null)
        {
            Contract.findById(payments[0].contractId, (err, doc) => {
                if (!err) {
                    let contractId = "";
                    if(doc != null)
                    {
                        contractId = doc;
                    }
                    if(contractId != "" && contractId != null)
                    {
                        paymentInsertionCall(req, res, payments, true);
                    }
                    else
                    {
                        handleValidationError("contractId", "Contract Id is invalid and not available in our database!", err, req.body);
                        res.render("paymenthistory/addOrEdit", {
                            title: "Add Payment History",
                            item: req.body
                        });
                    }
                }
                else
                    console.log("There is an error in retrieving Contract :" + err)
            });
        }
        else
            paymentInsertionCall(req, res, payments, false);
    }
}

function paymentInsertionCall(req, res, payments, isContractAvailable) {
    try {
        PaymentHistory.collection.insert(payments, function (err, docs) {
            if (err){
                if (err.name == 'ValidationError') {
                    handleValidationError(null, null, err, req.body);
                    res.render("paymenthistory/addOrEdit", {
                        title: "Add Payment History",
                        item: req.body
                    });
                }
                else if(err.message.indexOf('duplicate') > -1) {
                    console.log('Error during record insertion : ' + err);
                    res.render("paymenthistory/addOrEdit", {
                        title: "Add Payment History",
                        insertUpdateError: "Duplicate Payment Id is not allowed to insert record."
                    });
                }
            } else {
                console.log("Single document inserted to Collection");
                if(!isContractAvailable)
                    payment_history_list_manual_load("insertone", "One payment history without Contract ID has been inserted successfully!", req, res);
                else
                    payment_history_list_manual_load("insertone", "One payment history with Contract ID has been inserted successfully!", req, res);
            }
        })
    }
    catch (exc) {
        console.log(exc);
    }
}

function preparePaymentDocuments(req, res) {
    var payments = [];
    let payment = {   
        _id: req.body._id != "" ? req.body._id : handleValidationError("_id", "Payment Id is required.", null, req.body), 
        contractId: req.body.contractId != "" ? req.body.contractId : "", 
        description: req.body.description != "" ? req.body.description : handleValidationError("description", "Description is required.", null, req.body), 
        value: req.body.value != "" ? parseInt(req.body.value) : handleValidationError("value", "Value is required.", null, req.body), 
        time: req.body.time != "" ? (req.body.time.indexOf(' ') > -1 ? setGMTHoursToDateTime(req.body.time, 2).toISOString() : setGMTHoursToDateTime(req.body.time, 0).toISOString()) : handleValidationError("time", "Time is required.", null, req.body),
        isImported: false,
        createdAt: setGMTHoursToDateTime(Date.now(), 2).toISOString(),
        updatedAt: setGMTHoursToDateTime(Date.now(), 2).toISOString(),
        isDeleted: false
    }
    
    if (req.body._id == "" || req.body.description == "" || req.body.value == "" || req.body.time == "")
    {
        res.render("paymenthistory/addOrEdit", {
            title: "Add Payment History",
            item: req.body
        });
    }
    else {
        payments.push(payment);
    }
    return payments;
}

function updateRecord(req, res) {
    try {
        if(req.body.time != "" && req.body.time != null)
        {
            if(req.body.time.indexOf(' ') > -1)
                req.body.time = setGMTHoursToDateTime(req.body.time, 1).toISOString();
            else
                req.body.time = setGMTHoursToDateTime(req.body.time, 0).toISOString();
        }

        req.body.updatedAt = setGMTHoursToDateTime(Date.now(), 2).toISOString();

        if(req.body.contractId != "" && req.body.contractId != null)
        {
            Contract.findById(req.body.contractId, (err, doc) => {
                if (!err) 
                {
                    let contractId = "";
                    if(doc != null)
                    {
                        contractId = doc;
                    }
                    if(contractId != "" && contractId != null)
                    {
                        PaymentHistory.findOneAndUpdate({ _id: req.body.id }, req.body, { new: false, useFindAndModify: true }, (err, doc) => {
                            if (!err) { 
                                payment_history_list_manual_load("updateone", "Payment history has been updated successfully!", req, res); 
                            }
                            else {
                                if (err.name == 'ValidationError') {
                                    handleValidationError(null, null, err, req.body);
                                    res.render("paymenthistory/addOrEdit", {
                                        title: 'Update Payment History',
                                        item: req.body
                                    });
                                }
                                else if (err.name == 'MongoError')
                                {
                                    res.render("paymenthistory/addOrEdit", {
                                        title: 'Update Payment History',
                                        insertUpdateError: 'There is a problem in updating this record!'
                                    })
                                    console.log('Record update error: ' + err);
                                }
                                else
                                    console.log('Error during record update : ' + err);
                            }
                        });
                    }
                }
                else
                    console.log('Contract record fetching error: ' + err);
            });
        }
    }
    catch (err)
    {
        res.render("paymenthistory/addOrEdit", {
            title: 'Update Payment History',
            item: req.body,
            insertUpdateError: 'There is an exception in updating this record!'
        })
        console.log('Record update error: ' + err);
    }
}

function setGMTHoursToDateTime(date, hoursToAdd) {
    if(date != null && date != "") {
        return new Date(new Date(date).setHours(new Date(date).getHours() + hoursToAdd))
    }
}

function convertDateToString(date) {
    if(date != null || date != "")
    {
        return new Date(date).toISOString().replace('T', ' ').substring(0, new Date(date).toISOString().length - 5);
    }
}

Date.prototype.addHours= function(h){
    this.setHours(this.getHours() + h);
    return this;
}

async function payment_history_items_count(req, res) {
    let count = await PaymentHistory.aggregate([
        {
            "$group" : {
                _id: null,
                sum: { $sum: "$value" },
                items: { $push: //"$$ROOT"
                        {
                            id: "$_id",
                            contractId: "$contractId",
                            description: "$description",
                            value: "$value",
                            time: "$time",
                            isImported: "$isImported",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            isDeleted: "$isDeleted"
                        }
                    }
            }
        }, { $sort: { "value": 1 } }
    ])
    let jsonData;
    if(count.length > 0)
    {
        delete count[0]._id; //deleting _id field as it's not required in final data.
        jsonData = JSON.stringify(count[0]);
    }
    res.render("paymenthistory/structuredData", {
        title: "Payment Histories",
        data: jsonData
    });
}

function handleValidationError(fieldName, fieldMessage, err, body) {
    if(err != null)
    {
        for (field in err.errors) {
            switch (err.errors[field].path) {
                case '_id':
                    body['idError'] = err.errors[field].message;
                    break;
                case 'description':
                    body['descriptionError'] = err.errors[field].message;
                    break;
                case 'value':
                    body['valueError'] = err.errors[field].message;
                    break;
                case 'time':
                    body['timeError'] = err.errors[field].message;
                    break;
                default:
                    break;
            }
        }
    }
    else if(fieldName != null && fieldName != "")
    {
        switch (fieldName) {
            case '_id':
                body['idError'] = fieldMessage;
                break;
            case 'contractId':
                body['contractIdError'] = fieldMessage;
                break;
            case 'description':
                body['descriptionError'] = fieldMessage;
                break;
            case 'value':
                body['valueError'] = fieldMessage;
                break;
            case 'time':
                body['timeError'] = fieldMessage;
                break;
            default:
                break;
        }
    }
}

module.exports = router;