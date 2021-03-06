var express = require('express');
var path = require('path');
var fs = require("fs");
var md5File = require('md5-file');
var bodyParser = require('body-parser');
var port = process.env.PORT || process.env.VCAP_APP_PORT || '8080';
var nano = require('nano')('http://localhost:' + port);
var app = express();
var multer = require('multer');
var axios = require("axios");
var nodemailer = require('nodemailer');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var Cloudant = require('@cloudant/cloudant');
var upload = multer({
    dest: __dirname + '/upload'
});
var type = upload.single('file');
const rp = require('request-promise');

app.use('/', express.static(__dirname + '/'));
app.use('/', express.static(__dirname + '/Images'));

var cloudantUserName = "adfc60ec-fa4a-46a9-bcf9-e554de84b30b-bluemix";
var cloudantPassword = "0f130af356c2fcfc117f121fa37673bf41c604165888b98399dfd6bcf62dacaa";
var cloudant_url = "https://" + cloudantUserName + ":" + cloudantPassword + "@" + cloudantUserName + ".cloudant.com";

//Initialize the library with my account
var cloudant = Cloudant(cloudant_url);

var dbForLogin = cloudant.db.use("logindb");
var dbForApplicantData = cloudant.db.use("digitalid");
var dbForAdminRequestTable = cloudant.db.use("adminrequesttable");
var dbForApplicantDocs = cloudant.db.use("applicantdocs");


//create index on login db if not existing
var user = {
    name: 'userId',
    type: 'json',
    index: {
        fields: ['userId']
    }
};
dbForLogin.index(user, function(er, response) {
    if (er) {
        console.log("Error creating index on user ID:" + er);
    } else {
        console.log('Index creation result on user ID :' + response.result);
    }
});

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    console.log("Open LoginPage.html page");
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Check Login Details
app.post('/verifyLogin', function(req, res) {
    console.log('Inside Express api check for login');
    console.log('Received login details : ' + JSON.stringify(req.body));
    verifyCredentialsFromCloudant(req.body.username, req.body.password).then(function(data) {
        if (data.success) {
            res.json({
                success: true,
                message: 'User name verified with password successfully !'
            });
        } else
            res.json({
                success: false,
                message: 'User name not found !'
            });
    });
});

//Get all digital Ids with digital Id status as 'PENDING'
app.get('/getDigitalIdRequests', function(req, res) {
    console.log('Inside Express api check to get all applicants details for digital Id');
    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/User?filter[where][digitalIdStatus]=Pending" ; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    getData(headers, url).then(function(data) {
		console.log("Data is : " + JSON.stringify(data.response));
        if (data.success) {
            res.json({
                success: true,
                message: 'Data found successfully ! ',
                result: data.response
            });
        } else
            res.json({
                success: false,
                message: 'Blockchain connectivity issue !'
            });
    });
});

//Get all digital Ids with university application status  as 'PENDING'
app.get('/getUniversityApplicantRequests', function(req, res) {
    console.log('Inside Express api check to get all applicants details for digital Id');
    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/User?filter[where][universityAdmissionStatus]=Pending" ; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    getData(headers, url).then(function(data) {
		console.log("Data is : " + JSON.stringify(data.response));
        if (data.success) {
            res.json({
                success: true,
                message: 'Data found successfully ! ',
                result: data.response
            });
        } else
            res.json({
                success: false,
                message: 'Blockchain connectivity issue !'
            });
    });
});

//Get all digital Ids with employee application status  as 'PENDING'
app.get('/getEmployeeApplicantRequests', function(req, res) {
    console.log('Inside Express api check to get all applicants details for employee applications');
    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/User?filter[where][employeeApplicationStatus]=Pending" ; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    getData(headers, url).then(function(data) {
		console.log("Data is : " + JSON.stringify(data.response));
        if (data.success) {
            res.json({
                success: true,
                message: 'Data found successfully ! ',
                result: data.response
            });
        } else
            res.json({
                success: false,
                message: 'Blockchain connectivity issue !'
            });
    });
});
//Get all digital Ids with Visa application status  as 'PENDING'
app.get('/getVisaApplicantRequests', function(req, res) {
    console.log('Inside Express api check to get all applicants details for visa applications');
    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/User?filter[where][visaApplicationStatus]=Pending" ; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    getData(headers, url).then(function(data) {
		console.log("Data is : " + JSON.stringify(data.response));
        if (data.success) {
            res.json({
                success: true,
                message: 'Data found successfully ! ',
                result: data.response
            });
        } else
            res.json({
                success: false,
                message: 'Blockchain connectivity issue !'
            });
    });
});


var submitTxn = async (txnDetails, headers, url) => {
  
  if(txnDetails){
	try{
	var response = await axios.post(url, txnDetails, headers);
	console.log("Record inserted successfully");
	return ({success : true, message:"Record inserted successfully", response:response.data});
	} catch (error){
		console.log("Issue inserting record into ledger");
		return ({success : false, message:"Issue inserting record into ledger"});
	}
  }else{
	console.log("Issue while txn");
	return ({success : false, message:"Issue while txn"});	  
  }
}

var getData = async (headers, url) => {
  
  if(url){
	try{
	var response = await axios.get(url, headers);
	console.log("Record fetched successfully");
	return ({success : true, message:"Record fetched successfully", response:response.data});
	} catch (error){
		console.log("Issue fetching records ");
		return ({success : false, message:"Issue fetching record "});
	}
  }else{
	console.log("Issue in URL");
	return ({success : false, message:"Issue in URL"});	  
  }
}


app.post('/applicantData', type, function(req, res) {
    console.log('Inside Express api to insert data for applicant');

    var reqdata = JSON.parse(req.body.data); 

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/RegisterUser"; 		    	
			
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
});

//Get selected _id details from DB

app.post('/getDigitalIdData', function(req, res) {
	console.log('Inside Express api check to get digital Id data : ' + req.body._id);
	var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/User/"+req.body._id;
	var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
	getDigitalIdData(url,headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				message: 'Applicant data found successfully ! ',
				result: data.response
			});
		} else
			res.json({
				success: false,
				message: 'Cloudant db connectivity issue !'
			});
	});
});





//Update digital Id from Read only page details to DB
app.post('/updateDigitalIdData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
         var reqdata = req.body; 

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/RegisterStudentInfo"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});
//Update digital Id applicant digitaal id status to User asset
app.post('/updateReadOnlyDigitalIdData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; //JSON.stringify(req.body);

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/digitalIdStatus"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});

//Update university admission status to User asset
app.post('/updateReadOnlyUniversityData', function(req, res) {
    console.log('Inside updateReadOnlyUniversityData Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; //JSON.stringify(req.body);

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/universityAdmissionStatus"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});	
	

//Update Employee Application status to User asset
app.post('/updateReadOnlyEmployeeData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; //JSON.stringify(req.body);

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/employeeApplicationStatus"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});	
	
//Update Visa application status to User asset
app.post('/updateReadOnlyVisaData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; //JSON.stringify(req.body);

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/visaApplicationStatus"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});	
	
//Update digital Id applicant details to DB
app.post('/updateEmployeeDigitalIdData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; 

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/RegisterEmployeeInfo"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});

//Update digital Id applicant details to DB
app.post('/updateVisaDigitalIdData', function(req, res) {
    console.log('Inside Express api check to update digital Id data ! ');
	console.log("Req.body : "+JSON.stringify(req.body));
        var reqdata = req.body; 

    console.log(reqdata);

    var url = "http://ec2-3-87-238-243.compute-1.amazonaws.com:3001/api/RegisterVisaInfo"; 
    var headers = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };

	applicantData(url,reqdata, headers).then(function(data) {
		if (data.success) {
			res.json({
				success: true,
				deathRecordDetails: data.response
			});
		} else res.json({
			success: false,
			message: data
		});
	});
	});

app.post('/employeeData', function(req, res) {
    var response = "";
    console.log("Got a POST request for apply_for_digital_id.html page");
    var applicantData = JSON.parse(JSON.stringify(req.body));
    dbForApplicantData.insert(applicantData, function(err, body) {
		
        if (!err) {
            response = {
                status: 200,
                message: 'Data inserted successfully in applicant data table.',
                id: body.id,
                revid: body.rev
            }
        } else {
            response = {
                status: 300,
                message: 'Data not inserted successfully in applicant data table.'
            }
        }
        res.send(JSON.stringify(response));
    });
});
app.post('/userData', function(req, res) {
    var response = "";
    console.log("Got a POST request for StudentDetails.html page");
    var applicantData = JSON.parse(JSON.stringify(req.body));
    dbForApplicantData.insert(applicantData, function(err, body) {
        if (!err) {
            response = {
                status: 200,
                message: 'Data inserted successfully in applicant data table.',
                id: body.id,
                revid: body.rev
            }
        } else {
            response = {
                status: 300,
                message: 'Data not inserted successfully in applicant data table.'
            }
        }
        res.send(JSON.stringify(response));
    });
});

app.post('/applicantDoc', type, function(req, res) {
    console.log("File :" + JSON.stringify(req.body));
    fs.readFile(__dirname + '/upload/' + req.file.filename, function(err, data) {
        if (!err) {
            dbForApplicantData.attachment.insert(req.body.id, req.file.originalname, data, req.file.mimetype, {
                rev: req.body.rev
            }, function(err, body) {
                if (!err) {
                    fs.unlink(__dirname + '/upload/' + req.file.filename, function(err) {
                        if (!err)
                            console.log('File deleted!');
                        else
                            console.log(err);
                    });
                    var response = {
                        status: 200,
                        message: 'Document uploaded successfully in applicant data table.'
                    }
                    res.send(JSON.stringify(response));
                } else {
                    var response = {
                        status: 300,
                        message: 'Document not uploaded successfully in applicant data table.'
                    }
                    res.send(JSON.stringify(response));
                }
            });
        }
    });
});

// Fetch all digital Ids with pending digitalId status from cloudant DB
var digitalIdWithPendingStatus = async() => {
    try {
        var response = await dbForApplicantData.find({
            selector: {
                digitalIdStatus: 'Pending'
            }
        });
        if (response && response.docs && response.docs.length > 0) {
            console.log('Data found !');
            return ({
                success: true,
                message: 'Data found !',
                result: response
            });
        } else {
            console.log('Data not found !');
            return ({
                success: false,
                message: 'Data not found !'
            });
        }
    } catch (err) {
        console.log('Error finding details from db !' + err);
        return ({
            success: false,
            message: 'Error finding details from db !'
        });
    }
}

// Verify admin login credentials from cloudant DB
var verifyCredentialsFromCloudant = async(username, password) => {
    console.log("Username :" + username + "Password :" + password);
    try {
        var response = await dbForLogin.get(username);
        console.log('Data found in db for the requested username');
        console.log('DB Login Response' + JSON.stringify(response));
        if (response.password == password) {
            console.log('User verification successful');
            return ({
                success: true,
                message: 'User Authentication Successful !'
            });
        } else {
            console.log('Invalid User name/Password ');
            return ({
                success: false,
                message: 'Invalid User name/Password !'
            });
        }
    } catch (err) {
        console.log('Data not found in db for the requested username !' + err);
        return ({
            success: false,
            message: 'Data not found in db for the requested username !'
        });
    }
}

//Post Call
var applicantData = async(url, data, headers) => {
    try {
		console.log("Data is:" + JSON.stringify(data));
        var deathRecord = await axios.post(url,data);
        console.log("Data post succesfully" + deathRecord);
        return ({
            success: true,
            response: deathRecord.data
        });
    } catch (error) {
	    console.log("Error is:" + error);
        return ({
	    success: false,
            message: error	  
        });
    }
}

//Fetch specific digitalId record from cloudant DB
var getDigitalIdData = async(url,headers) => {
   console.log(url);
   try {
        var Record = await axios.get(url,headers);
        console.log("Data post succesfully" + Record.data);
        return ({
            success: true,
            response: Record.data
        });
    } catch (error) {
            console.log("Error is  :  " + error);
        return ({
            success: false,
            message: error
        });
    }


}

// Update existence record in cloudant DB
var updateCloudantData = async(data) => {
    try {
        var response = await dbForApplicantData.insert(data);
        console.log('Applicant data updated successfully ! ');
        return ({
            success: true,
            message: 'Applicant data updated successfully ! '
        });
    } catch (err) {
        console.log('Applicant data updation issue ! ' + err);
        return ({
            success: false,
            message: 'Applicant data updation issue !'
        });
    }
}

// Insert Document in cloudant DB
var insertDocInCloudant = async(data, file, docData) => {
        console.log(data);
        console.log(file);
        try {
            var response = await dbForApplicantDocs.insert(docData);
            console.log('Document related data inserted successfully !');
            var body = await dbForApplicantDocs.attachment.insert(response.id, file.originalname, data, file.mimetype, {
                rev: response.rev
            });
            console.log('Document inserted successfully !');
            return ({
                success: true,
                message: 'Document uploaded successfully !'
            });
        } catch (err) {
            console.log('Document related data insertion issue ! ' + err);
            return ({
                success: false,
                message: 'Document related data insertion issue !'
            });
        }
    }
	
// Insert data/record in cloudant DB
var insertCloudantData = async(data) => {
    try {
        var response = await dbForApplicantData.find({
            selector: {
                GovermentId: data.GovermentId
            }
        });
        if (response && response.docs && response.docs.length > 0) {
            console.log('GovermentId already exists in DB !');
            return ({
                success: false,
                message: 'GovermentId already exists in DB !'
            });
        } else {
            console.log('GovermentId does not exists in DB !');
            var data = await dbForApplicantData.insert(data);
            console.log('Applicant Data Inserted !');
            return ({
                success: true,
                message: 'Applicant Data Inserted Successfully !'
            });
        }
    } catch (err) {
        console.log('Issue fetching/inserting data from DB ! ' + err);
        return ({
            success: false,
            message: 'Issue fetching/inserting data from DB !'
        });
    }
}

app.listen(port);
