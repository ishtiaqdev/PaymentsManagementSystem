const express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Contract = mongoose.model("Contract");


// GET request for default contracts list page.
router.get('/', contract_list_get);

// GET request for creating Contract.
router.get('/create', contract_create_get);

// POST request for creating Contract.
router.post('/create', contract_create_update_post);

// GET request to update Contract.
router.get('/update/:id', contract_update_get);

// POST request to update Contract.
router.post('/update/:id', contract_create_update_post);

// GET request for list of all Contracts.
router.get('/list', contract_list_get);

// post request for list of all Contracts.
router.post('/list', contract_list_post);

// GET request to delete Contract by _id.
router.get('/delete/:id', contract_delete_get);

function contract_create_get(req, res) {
    res.render("contract/addOrEdit", {
        title: "Add Contract"
    });
}

function contract_create_update_post(req, res) {
    if (req.body.id == '')
        insertRecord(req, res);
    else
        updateRecord(req, res);
}

function contract_update_get(req, res) {
    Contract.findById(req.params.id, (err, doc) => {
        if (!err) {
            if(doc != null)
            {
                res.render("contract/addOrEdit", {
                    title: "Update Contract",
                    contract: doc
                });
            }
            else
                return false;
        }
    });
}

function contract_list_manual_load(source, message, req, res) {
    Contract.find((err, docs) => {
        if (!err) {
            if(source != null)
            {
                if(source == "searchwordempty") {
                    res.render("contract/list", {
                        list: docs,
                        searchDeleteError: message
                    });
                }
                else {
                    res.render("contract/list", {
                        list: docs,
                        success: message
                    });
                }
            }
            else {
                res.render("contract/list", {
                    list: docs,
                    success: message
                });
            }
        }
        else {
            console.log('Error in retrieving Contract list :' + err);
        }
    });
}

function contract_list_get(req, res) {
    contract_list_manual_load(null, null, req, res);
}

function contract_list_post(req, res) {
    if(req.body.hasOwnProperty('contractId'))
    {
        if(req.body.contractId != "")
        {
            Contract.find({ _id: req.body.contractId }, (err, docs) => { 
                if (!err) {
                    res.render("contract/list", {
                        list: docs
                    });
                }
                else {
                    console.log('Error in retrieving Contract list :' + err);
                }
            });   
        }
        else {
            contract_list_manual_load("searchwordempty", "Please enter both Start Date and End Date to search.", req, res)
        }
    }
}

function contract_delete_get(req, res) {
    Contract.findByIdAndRemove(req.params.id, (err, doc) => {
        if (!err) {
            contract_list_manual_load("deleteone", "One contract has been deleted successfully!", req, res);
        }
        else { console.log('Error in contract delete :' + err); }
    });
}

function insertRecord(req, res) {
    let contracts = prepareContractDocuments(req, res);
    if(contracts.length > 0)
    {
        try {
            Contract.collection.insert(contracts, function (err, docs) {
                if (err){
                    if (err.name == 'ValidationError') {
                        handleValidationError(null, null, err, req.body);
                        res.render("contract/addOrEdit", {
                            title: "Add Contract",
                            contract: req.body
                        });
                    }
                    else
                        console.log('Error during record insertion : ' + err);
                } else {
                    console.log("Single document inserted to Collection");
                    contract_list_manual_load("insertone", "One contract has been inserted successfully!", req, res);                  
                }
            })
        }
        catch (exc) {
            console.log(exc);
        }
        
    }
}

function prepareContractDocuments(req, res) {
    var contracts = [];
    let contract = {   
        _id: req.body._id != "" ? req.body._id : handleValidationError("_id", "Contract Id is required.", null, req.body), 
        name: req.body.name != "" ? req.body.name : handleValidationError("name", "Name is required.", null, req.body), 
        description: req.body.description != "" ? req.body.description : handleValidationError("description", "Description is required.", null, req.body)
    }
    
    if (req.body._id == "" || req.body.name == "" || req.body.description == "")
    {
        res.render("contract/addOrEdit", {
            title: "Add Contract",
            contract: req.body
        });
    }
    else {
        contracts.push(contract);
    }
    return contracts;
}

function updateRecord(req, res) {
    try {
        Contract.findOneAndUpdate({ _id: req.body.id }, req.body, { new: false }, (err, doc) => {
            if (!err) { 
                contract_list_manual_load("updateone", "Contract has been updated successfully!", req, res); 
            }
            else {
                if (err.name == 'ValidationError') {
                    handleValidationError(null, null, err, req.body);
                    res.render("contract/addOrEdit", {
                        title: 'Update Contract',
                        contract: req.body
                    });
                }
                else if (err.name == 'MongoError')
                {
                    res.render("contract/addOrEdit", {
                        title: 'Update Contract',
                        insertUpdateError: 'There is a problem in updating this record!'
                    })
                    console.log('Record update error: ' + err);
                }
                else
                    console.log('Error during record update : ' + err);
            }
        });
    }
    catch (err)
    {
        res.render("contract/addOrEdit", {
            title: 'Update Contract',
            insertUpdateError: 'There is an exception in updating this record!'
        })
        console.log('Record update error: ' + err);
    }
}

function handleValidationError(fieldName, fieldMessage, err, body) {
    if(err != null)
    {
        for (field in err.errors) {
            switch (err.errors[field].path) {
                case '_id':
                    body['idError'] = err.errors[field].message;
                    break;
                case 'name':
                    body['nameError'] = err.errors[field].message;
                    break;
                case 'description':
                    body['descriptionError'] = err.errors[field].message;
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
            case 'name':
                body['nameError'] = fieldMessage;
                break;
            case 'description':
                body['descriptionError'] = fieldMessage;
                break;
            default:
                break;
        }
    }
}

module.exports = router;