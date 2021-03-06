var myApp = angular.module("myModule", ['ngTable']);

/* File Upload Directive */
myApp.directive('fileModel', ['$parse', function($parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.fileModel);
      var modelSetter = model.assign;

      element.bind('change', function() {
        scope.$apply(function() {
          modelSetter(scope, element[0].files[0]);
        });
      });
    }
  };
}]);

/* File Upload Service */
myApp.service('fileUpload', ['$http', function($http) {
    this.uploadFileAndFieldsToUrl = function(file, data, uploadUrl) {
      var fd = new FormData();
      fd.append('file', file);
      fd.append('data', JSON.stringify(data));
      $http({
        method: 'POST',
        url: uploadUrl,
        data: fd,
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      }).then(function successCallback(response) {
        if(response.data.success == true && uploadUrl === '/applicantData') {
          window.location.href = '/success_DigitalIdEntry.html';
        } else {
          alert(response.data.message);
        }
      });
    }
  }]);

myApp.controller('myController', ['$scope', 'fileUpload', '$http', '$filter', '$window', function ($scope, fileUpload, $http, $filter, $window) {
      
	$scope.submitUserData = function () {
	$scope.gender = ["Male", "Female"];
	var uniqueId = Date.now();		
	var file = $scope.myFile;
	console.log(file);
	var dob = $scope.User.user.digitalIdInfo.DOB;
	var year = Number(dob.substr(6, 4));
	var month = Number(dob.substr(3, 2)) - 1;
	var day = Number(dob.substr(0, 2));
	var today = new Date();
	var timestamp = dateTime();
	var  UserGovUniqueID = $scope.User.user.digitalIdInfo.GovermentId
	var age = today.getFullYear() - year;
	if (today.getMonth() < month || (today.getMonth() == month && today.getDate() < day)) {
	age--;
	}

	 $scope.$watch('myFile', function (newFileObj) {
            if (newFileObj)
                $scope.filename = newFileObj.name;
        });

	    var uniqueId = Date.now();

    function dateTime() {
        var now = new Date();
        return now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "T" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    }
 
    var document = {
        _id : uniqueId + '-IdProof',
        docName : "",
        docType : "Identification Proof",

    }
    
	$scope.User.user.digitalIdInfo.Age = age;
	
	var User={
	"$class": "org.general.digitalid.RegisterUser",
	"user": {
		"$class": "org.general.digitalid.User",
	//	"id": UserGovUniqueID,
		"digitalIdDataInfo": {
			"$class": "org.general.digitalid.DigitalIdDataInfo",
			"Name":  $scope.User.user.digitalIdInfo.Name,
			"DOB": dob ,
			"Age": age,
			"MobileNumber": $scope.User.user.digitalIdInfo.MobileNumber,
			"Gender": $scope.User.user.digitalIdInfo.Gender,
			"Email": $scope.User.user.digitalIdInfo.Email,
			"GovermentId": UserGovUniqueID,
			"Address": $scope.User.user.digitalIdInfo.Address,
			"createTimestamp": timestamp,
			"documentDetails": " ",
			"student": {
				"$class": "org.general.digitalid.Student",
				"HighestEducation": " ",
				"CourseToPursue": " ",
				"Specialization": " ",
				"Type": " ",
				"GovermentId": UserGovUniqueID
			},
			"employee": {
				"$class": "org.general.digitalid.Employee",
				"CurrentEmployer": " ",
				"PreviousEmployer": " ",
				"TotalExperience": " ",
				"CurrentCTC": " ",
				"GovermentId": UserGovUniqueID
			},
			"visa": {
				"$class": "org.general.digitalid.Visa",
				"Country": " ",
				"Duration": " ",
				"ReasonOfTraveling": " ",
				"Comments": " ",
				"Status": " ",
				"GovermentId": UserGovUniqueID
			},
			"txnMsg": " "
		},
		"digitalIdStatus": 'Pending',
		"universityAdmissionStatus": ' ',
		"employeeApplicationStatus": ' ',
		"visaApplicationStatus": ' ',
		"GovermentId": UserGovUniqueID,
		"message": " ",
		"txnMsg": " "
	}
		
}
// 	var file = $scope.myFile;
// 	User.user.digitalIdInfo.documentDetails = file.name;
// 	User.user.message = "Record inserted successfully in Cloudant DB.";
// 	console.log($scope.User.user.digitalIdInfo);
	
	    var uploadUrl = "/applicantData";
            fileUpload.uploadFileAndFieldsToUrl(file, User, uploadUrl);
                      
        }  
    	   
}]);


/* Apply For University Controller */
myApp.controller('applyUniversity', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {
  
  
  $scope.CourseToPursueSelect = ["Hotel Management", "Enginnering", "Arts", "Finance", "Medical"];

  $scope.HighestEducationSelect = ["UG", "PG"];

  $scope.selectedUniversityNameSelect = ["DTU", "KU", "PTU"];

  $scope.SpecializationSelect = ["VLSI", "E&C", "Medicines" ,  "Pharma"];

  $scope.TypeSelect = ["Regular", "Distance", "Weekends"];


  $scope.Back = function () {
        $window.location.href = '/student_portal.html';
  }

  $scope.on = function () {
        document.getElementById("overlay").style.display = "block";
  }

  $scope.off = function () {
        document.getElementById("overlay").style.display = "none";
  }

  $scope.loadDigitalIdData = function() {
        var data = {
          _id : $scope.digitalId
        }

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) { // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      if(response.data.success == true  && response.data.result.digitalIdStatus == 'Approved') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }

  $scope.submitUniversityData = function() {
	var University = {
  "$class": "org.general.digitalid.RegisterStudentInfo",
  "user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
  "HighestEducation": $scope.HighestEducation,
  "CourseToPursue": $scope.CourseToPursue,
  "Specialization": $scope.Specialization,
  "Type": $scope.Type,
  "studentInfoStatus": 'Pending'
}

	$http({
	  method: 'POST',
	  url: '/updateDigitalIdData',
	  data: University
	}).then(function successCallback(response) {
	  if(response.data.success == true) {
		$window.location.href = '../success_UniversityIdEntry.html';
	  } else {
		alert(response.data.message);
	  }
	});	
  }
}]);

myApp.controller('applyEmployee', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

	 $scope.type = ["Full-Type", "Part-Type"];
   $scope.exp = ["Beginner", "Mid level", "Higher"];
   $scope.ctc = ["Less than 5 LPA", "5 - 10 LPA", "Greater than 10 LPA"];
   $scope.Back = function () {

        $window.location.href = '/student_portal.html';
  }

  $scope.on = function () {
        document.getElementById("overlay").style.display = "block";
  }

  $scope.off = function () {
        document.getElementById("overlay").style.display = "none";
  }

  $scope.loadDigitalIdData = function() {
        var data = {
          _id : $scope.digitalId
        }

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true  && response.data.result.universityAdmissionStatus == 'Approved') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }

 $scope.submitEmployeeData = function() {
	var Employee = {
  "$class": "org.general.digitalid.RegisterEmployeeInfo",
  "user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
  "CurrentEmployer":  $scope.CurrentEmployer,
  "PreviousEmployer":  $scope.PreviousEmployer,
  "TotalExperience":  $scope.TotalExperience,
  "CurrentCTC":  $scope.CurrentCTC,
  "employeeInfoStatus":  'Pending'
}

	$http({
	  method: 'POST',
	  url: '/updateEmployeeDigitalIdData',
	  data: Employee
	}).then(function successCallback(response) {
	  if(response.data.success == true) {
		$window.location.href = '../success_EmployeeIdEntry.html';
	  } else {
		alert(response.data.message);
	  }
	});	
  }
}]);

/* Apply For Visa Controller */
myApp.controller('applyVisa', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {
  
  $scope.DurationSelect = ["Less than 2 months", "2 -12 Months", "More than 1 year"];

  $scope.ReasonOfTravelingSelect = ["Personal", "Corporate"];

  $scope.VisaTypeSelect = ["Single", "Family"];

  $scope.ModeSelect = ["Normal", "Fast track"];


  $scope.Back = function () {
        $window.location.href = '/student_portal.html';
  }

  $scope.on = function () {
        document.getElementById("overlay").style.display = "block";
  }

  $scope.off = function () {
        document.getElementById("overlay").style.display = "none";
  }

  $scope.loadDigitalIdData = function() {
        var data = {
          _id : $scope.digitalId
        }

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true  && response.data.result.employeeApplicationStatus == 'Approved') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }

  $scope.submitVisaData = function() {
	var Visa = { 
  "$class": "org.general.digitalid.RegisterVisaInfo",
   "user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
  "Country": $scope.VisaCountry,
  "Duration": $scope.Duration,
  "ReasonOfTraveling":  $scope.ReasonOfTraveling,
  "Comments": $scope.VisaApplyMode,
  "Status": $scope.VisaType,
  "visaInfoStatus": 'Pending'
}

	$http({
	  method: 'POST',
	  url: '/updateVisaDigitalIdData',
	  data: Visa
	}).then(function successCallback(response) {
	  if(response.data.success == true) {
		$window.location.href = '../success_VisaIdEntry.html';
	  } else {
		alert(response.data.message);
	  }
	});	
  }
}]);
// Digital ID Admin Controller
myApp.controller('digitalIdAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

 $scope.closeTab = function() {
  window.close();
 }

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '../AdminPages/digital_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* Digital Admin  Requests Form Controller */
myApp.controller('digitalIdAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getDigitalIdRequests = function() {
    $http({
      method: 'GET',
      url: '/getDigitalIdRequests'
    }).then(function successCallback(response) {
	if(response.data.success == true ){

                $scope.tableData = response.data.result;
				console.log(JSON.stringify(response.data.result));
				
                /*$scope.tableParams = new NgTableParams({
                        count: 4
                }, {
                        counts: [],
                        dataset: $scope.tableData
                });*/
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
        $window.sessionStorage.setItem("_id", digitalId);
        $window.location.href = '../ReadOnlyPages/digitalId_read_only.html';
  }

  $scope.Logout = function () {
        window.close();
  }

}]);

/* University Success Controller */
myApp.controller('universityAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getUniversityApplicantRequests = function() {
    $http({
      method: 'GET',
      url: '/getUniversityApplicantRequests'
    }).then(function successCallback(response) {
      if(response.data.success == true ) {
                $scope.tableData = response.data.result;
				console.log( "University Server Data" + JSON.stringify(response.data.result));
/*                 $scope.tableParams = new NgTableParams({
                        count: 4
                }, {
                        counts: [],
                        dataset: $scope.tableData
                }); */
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
        $window.sessionStorage.setItem("_id", digitalId);
        $window.location.href = '../ReadOnlyPages/university_read_only.html';
  }

}]);

/* Digital Id Read Only Form Controller */
myApp.controller('digitalIdReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

    var data = {
          _id : $window.sessionStorage.getItem("_id")
    }
   
   $scope.loadDigitalIdData = function() {

    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true  && response.data.result.digitalIdStatus == 'Pending') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }
  
    $scope.updateDigitalIdData = function (buttonValue) {

	var updateDigitalIdData = {
		   "$class": "org.general.digitalid.digitalIdStatus",
		    "user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
			"status": buttonValue
		}
		 // var message = $scope.digitalIdData.message + " The digital id request has been " + buttonValue + ".";
         // $scope.digitalIdData.message = message;
  
         // if(buttonValue == "Approved")
          //    $scope.digitalIdData.digitalIdStatus = "Approved";
          
         // if(buttonValue == "Rejected")
          //    $scope.digitalIdData.digitalIdStatus = "Rejected";
  
      $http({
        method: 'POST',
        url: '/updateReadOnlyDigitalIdData',
            data: updateDigitalIdData //$scope.digitalIdData
      }).then(function successCallback(response) {
        if(response.data.success == true) {
              $window.location.href = '../AdminPages/digital_id_admin.html';
        } else {
          alert(response.data.message);
        }
      });
    }
  
    $scope.Back = function () {
          $window.location.href = '/consortium_admin.html';
    }
  
    $scope.Logout = function () {
          window.close();
    }
  
  }]);


  /* University Read Only Form Controller */
myApp.controller('universityReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

	var data = {
        _id : $window.sessionStorage.getItem("_id")
	}

	$scope.loadDigitalIdData = function() {
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
				
      if(response.data.success == true  && response.data.result.universityAdmissionStatus == 'Pending') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }

  $scope.updateUniversityData = function (buttonValue) {
	  
        var updateUniversityData = {
			"$class": "org.general.digitalid.universityAdmissionStatus",
			"user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
			"status": buttonValue
			}

    $http({
      method: 'POST',
      url: '/updateReadOnlyUniversityData',
          data: updateUniversityData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
                $window.location.href = '../AdminPages/university_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function () {
        $window.location.href = '../AdminPages/university_id_admin.html';
  }

  $scope.Logout = function () {
        window.close();
  }

}]);

  /* employee Read Only Form Controller */
myApp.controller('employeeReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
        _id : $window.sessionStorage.getItem("_id")
  }

  $scope.loadDigitalIdData = function() {
        
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true  && response.data.result.employeeApplicationStatus == 'Pending') {
		$scope.digitalIdData = response.data.result;
		$scope.dob = new Date(response.data.result.digitalIdDataInfo.DOB);
		$scope.off();
      } else {
        alert(response.data.message);
                window.close();
      }
    });
  }

  $scope.updateEmployeeData = function (buttonValue) {
        var updateEmployeeData = {
			"$class": "org.general.digitalid.employeeApplicationStatus",
			"user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
			"status": buttonValue
			}

    $http({
      method: 'POST',
      url: '/updateReadOnlyEmployeeData',
          data: updateEmployeeData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
                $window.location.href = '../AdminPages/employee_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function () {
        $window.location.href = '../AdminPages/employee_id_admin.html';
  }

  $scope.Logout = function () {
        window.close();
  }

}]);

  /* Visa Read Only Form Controller */
myApp.controller('visaReadOnlyForm', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  var data = {
        _id : $window.sessionStorage.getItem("_id")
  }

  $scope.loadDigitalIdData = function() {
    $http({
      method: 'POST',
      url: '/getDigitalIdData',
          data: data
    }).then(function successCallback(response) {
      if(response.data.success == true && response.data.result.visaApplicationStatus == 'Pending')  {
                $scope.digitalIdData = response.data.result;
                $scope.dob = new Date(response.data.result.digitalIdInfo.dateOfBirth);
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.updateVisaData = function (buttonValue) {
        var updateVisaData = {
			"$class": "org.general.digitalid.visaApplicationStatus",
			"user": "resource:org.general.digitalid.User#"+$scope.digitalIdData.GovermentId,
			"status": buttonValue
			}

    $http({
      method: 'POST',
      url: '/updateReadOnlyVisaData',
          data: updateVisaData
    }).then(function successCallback(response) {
      if(response.data.success == true) {
                $window.location.href = '../AdminPages/visa_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.Back = function () {
        $window.location.href = '../AdminPages/visa_id_admin.html';
  }

  $scope.Logout = function () {
        window.close();
  }

}]);


//Fetch specific digitalId record from cloudant DB
var getDigitalIdData = async (digitalId) => {
	try{
		var response = await dbForApplicantData.find({ selector: { _id: digitalId } });
		console.log('Applicant data found successfully ! ');
        return({ success: true, message: 'Applicant data found successfully ! ', response: response });
	}catch(err) {		
        console.log('Applicant data not present/DB issue ! ' + err);
        return({ success: false, message: 'Applicant data not present/DB issue !' });
    }		
}

/* University Admin Login Controller */
myApp.controller('universityAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/AdminPages/university_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);




/* Employee Admin Login Controller */
myApp.controller('employeeAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/AdminPages/employee_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* Employee Success Controller */
myApp.controller('employeeAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getEmployeeApplicantRequests = function() {
    $http({
      method: 'GET',
      url: '/getEmployeeApplicantRequests'
    }).then(function successCallback(response) {
      if(response.data.success == true) {
                $scope.tableData = response.data.result;
/*                 $scope.tableParams = new NgTableParams({
                        count: 4
                }, {
                        counts: [],
                        dataset: $scope.tableData
                }); */
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
        $window.sessionStorage.setItem("_id", digitalId);
        $window.location.href = '../ReadOnlyPages/employeeId_read_only.html';
  }
}]);




/* Visa Admin Login Controller */
myApp.controller('visaAdminLogin', ['$scope', 'fileUpload', '$http', '$filter', '$window', function($scope, fileUpload, $http, $filter, $window) {

  $scope.verifyLogin = function() {

    var data = {
      username: $scope.username,
      password: $scope.password
    }

    $http({
      method: 'POST',
      url: '/verifyLogin',
      data: data
    }).then(function successCallback(response) {
      if(response.data.success == true) {
        window.location.href = '/AdminPages/visa_id_admin.html';
      } else {
        alert(response.data.message);
      }
    });
  }

}]);

/* Visa Success Controller */
myApp.controller('visaAdmin', ['$scope', '$http', '$window', 'NgTableParams', function($scope, $http, $window, NgTableParams) {

  $scope.getVisaApplicantRequests = function() {
    $http({
      method: 'GET',
      url: '/getVisaApplicantRequests'
    }).then(function successCallback(response) {
      if(response.data.success == true) {
                $scope.tableData = response.data.result;
/*                 $scope.tableParams = new NgTableParams({
                        count: 4
                }, {
                        counts: [],
                        dataset: $scope.tableData
                }); */
      } else {
        alert(response.data.message);
      }
    });
  }

  $scope.selectedDigitalId = function(digitalId) {
        $window.sessionStorage.setItem("_id", digitalId);
        $window.location.href = '../ReadOnlyPages/visa_read_only.html';
  }

}]);

