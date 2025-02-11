const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const request = require('request');
const dateFormat = require("dateformat");
const random = require('random');
const { authService, userService, tokenService, emailService } = require('../services');
const pointsConfig = require('../config/points-config.js');
const path = require('path');
const googleAPIKey = require("../config/mm-bot-infra-sheets.json");
var moment = require('moment');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const addPoints = catchAsync(async (req, res) => {
  console.log("----//Webhook Called//-------");
//   console.log("Headers: " + JSON.stringify(req.headers));
//   console.log("Webhook Data" + JSON.stringify(req.body));
  var eventName = req.body.event_name;
  
  switch(eventName) {
    case 'registration':
        // console.log("---- Handling event:" + eventName + " -------");
		enrolUserToregistrationPoints(req, res);
        break;
	case 'get-points':
        console.log("---- Handling event:" + eventName + " -------");
        //getPointsOfUser(req, res, function(points){
	    getPointsOfUserFromSheets(req, res, function(points){
			res.status("200").send({ "points": points });
		});
        break;
    case 'add-points':
        console.log("---- Handling event:" + eventName + " -------");
        addPointsToUsers(req, res);
        break;
    case 'bonus-points':
        console.log("---- Handling event:" + eventName + " -------");
        addBonusPointsToUsers(req, res);
        break;
    case 'redeem-points':
        console.log("---- Handling event:" + eventName + " -------");
        redeemPoints(req, res);
        break;
	case 'recharge-options':
        console.log("---- Handling event:" + eventName + " -------");
        //getRedemptionOptionsV1(req, res);
        //getRedemptionOptionsV2(req, res);
		getRedemptionOptionsFromSheets(req, res);
        break;
    default:
        //
  }

});

function getDateDifference(startDateStr, endDateStr){
	var diffHours = -1;
	var startDate = new Date(startDateStr);
	var endDate = new Date(endDateStr);
	var diffMilliSeconds = endDate.valueOf() - startDate.valueOf();
	if(diffMilliSeconds > 0){
		var diffHours = diffMilliSeconds/1000/60/60;	
	}
	console.log("DIFF*******"+diffHours);
	return diffHours;
}


async function enrolUserToregistrationPoints(req, res) {
  console.log("----//Webhook user_registration //-------");
//   console.log("Webhook req Data" + JSON.stringify(req.body));

  var fullName = req.body.first_name + " " + req.body.last_name;
  var formattedDate = getCurrentDateAndTime();
  var contactNo = getFormattedContactNumber(req.body.contact);

   await checkIfUserAlreadyRegisteredInSheets(req, res, function(status){
	console.log("Checked...."+status);
	if(status){
		console.log("User already exist in master sheet. Hence ignored");
	}else{
		 registerUsersToSheets(req.body);
		console.log("Added user in the master sheet");
	}
  });
  res.status("200").send({ "status": "success" });

//   console.log("----//About to call API: "+pointsConfig.registrationService);
//   request(options,function (error, response) {
// 	if (error) {

// 	  res.status("500").send({ "msg": "Registration failed. Mobile already registered.Please contact administrator.", "error": error });
//     }
// 	else{
// 		res.status("200").send({ "status": "success" });

// 	}
// 	console.log("response.body--",response.body);
	// var temp = JSON.parse(response.body);
	// console.log("temp--",temp)
	// if(temp.INSERT_CUSTOMER_REGISTRATION_ACTIONResult.Success == true){
	// 	editCustomerWithMobileDetails (req, res);
	// 	res.status("200").send({ "status": "success" });
	// } else{
	// 	res.status("500").send({ "msg": "Registration failed. Mobile already registered.Please contact administrator.", "status": "failed" });
	// }

  });

  

}

function editCustomerWithMobileDetails(req, res){
  console.log("----//Webhook user_registration //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));

  var contactNo = getFormattedContactNumber(req.body.contact);

  var fullName = req.body.first_name + " " + req.body.last_name;
  var formattedDate = getCurrentDateAndTime();
  
  var url = pointsConfig.apiEndPoint + "/" + pointsConfig.registrationUpdateService;


  autoDetectMobileNumber(contactNo, function(mobileDetails){
		console.log("Auto detected mobile number.....");
		var mobileDetailsObj = JSON.parse(mobileDetails);
		var fixedAmounts = mobileDetailsObj.fixedAmounts;
		console.log(JSON.stringify(fixedAmounts));
		var operatorId = mobileDetailsObj.operatorId+"";
		var options = {
		    'method': 'POST',
		    'url': url,
		    'headers': {
		      'userid': pointsConfig.userid,
		      'pwd': pointsConfig.pwd,
		      'Content-Type': 'application/json'
		    },
		    body: JSON.stringify({
		      "objClass": 
		        {
		          "customer_mobile": contactNo,
		          "Customer_mobile_service_provider":operatorId,
		          "Customer_phone_recharges_allowed":JSON.stringify(fixedAmounts),
          		  "registration_date": formattedDate,
          		  "customer_name": fullName,
          		  "customer_mobile": contactNo,
          		  "customer_doa": "",
          		  "customer_gender": req.body.sex
		        }
		    })

		  };
		  console.log("----//About to call API: "+url);
		  console.log("with request data:" + JSON.stringify(options));
		  request(options, function (error, response) {
			if (error) {
			  console.log("user update failed.Please contact administrator.");
		    };
			console.log(response.body);
			var temp = JSON.parse(response.body);
			if(temp.UPDATE_CUSTOMER_REGISTRATIONResult.Success == true){
				console.log("User updated successfully");
			} else{
				console.log("Oops... User update failed");
			}

  		  });
	});


}

function addPointsToUsers(req, res,) {
  console.log("----//Webhook add points //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));
  var currentDate = getCurrentDate();
  var now = new Date();
  var currentDateTime = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

  var billNo = random.int((min = 100000), (max = 200000));
  var txnNo = random.int((min = 500000), (max = 900000));

  var itemCode = req.body.item_code;
  var itemName = req.body.item_code;
  var contactNo = getFormattedContactNumber(req.body.contact);
  //var contactNo = req.body.contact;
  var amount = pointsConfig[itemCode];

  checkIfUserPointsExistsInSheets(req, res, function(status){
	console.log("Checked...."+status);
	if(status){
		console.log("Points already exist for the user. Hence ignored");
	}else{
		addTotalPointsInSheet(contactNo, amount, itemCode, null);
		res.status("200").send({ "msg": "success" });
		console.log("Added Points in the sheet");
	}
  });
	
  //console.log("----//About to call API:   //-------" + url);
 // console.log(" with request data: " + JSON.stringify(options));
//   request(options, function (error, response) {
//     if (error) {
//       res.status("500").send({ "msg": "error", "error": error });
//       throw new Error(error)
//     };
//     res.status("200").send({ "msg": "success" });
//     console.log(response.body);
//   });
}

function addBonusPointsToUsers(req, res,) {
  console.log("----//Webhook add points //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));
  var currentDate = getCurrentDate();
  var now = new Date();
  var currentDateTime = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

  var startDate = req.body.start_date;
  var endDate = req.body.end_date;
  var dateDiff = getDateDifference(startDate, endDate);
  var msg = "";	
  if(parseInt(dateDiff) == -1 || parseInt(dateDiff) > 24){
	
	var diff = Math.round(parseInt(dateDiff), 0);
	if(parseInt(dateDiff) > 24){
		console.log("Time taken is:"+dateDiff);
		console.log("Sttaus is 3");
		res.status("200").send({"status":3, "bonusPoints":0,"timeTaken":diff,"msg": "You have taken "+diff+" hours to complete a day activity. Hence missed bonus points. Try to finish every day activity within 24 hours to get bonus points" });
	}
	
	if (parseInt(dateDiff) == -1){
		res.status("500").send({"timeTaken":diff, "msg": "Dates passed are not proper. Hence no bonus points added. Start date:"+startDate+" --- End Date:"+endDate });
	}
	
  } else{
	  console.log("Adding bonus points");
	  
	  var billNo = random.int((min = 100000), (max = 200000));
	  var txnNo = random.int((min = 500000), (max = 900000));
	
	  var itemCode = req.body.item_code;
	  var itemName = req.body.item_code;
	  var contactNo = getFormattedContactNumber(req.body.contact);
	  //var amount = pointsConfig[itemCode];
	  var amount = 100;
	  console.log("Contact no received: :" + req.body.contact);
	  console.log("Formated contact no: :" + contactNo);

	 checkIfUserPointsExistsInSheets(req, res, function(status){
		console.log("Checked...."+status);
		if(status){
			console.log("Points already exist for the user. Hence ignored");
		}else{
			addTotalPointsInSheet(contactNo, amount, itemCode, null);
			console.log("Added Points in the sheet");
		}
	  });

	  res.status("200").send({"status":1, "bonusPoints":100, "timeTaken":parseInt(dateDiff), "msg": "You have earned bonus pounts because you finished day activity in "+parseInt(dateDiff)+" hours. Finish every day actvities in 24 hours to get bonus points"  });
	}
}

/**
 * Returns available recharge options. 
 */
function getRedemptionOptionsV1(req, res){
	getPointsOfUser(req, res, function(points){
		if(points >= 1000){
			//console.log("Mobile number:::::"+req.contact);
			console.log("POINTS:::::"+points);
			var contactNumber = pointsConfig.mukke_pre_paid_number;
			//autoDetectMobileNumber(contactNumber, function(mobileDetails){
			detectMobileNumberFromSheets(contactNumber, function(mobileDetails){
				console.log(mobileDetails);
				//var mobileDetailsObj = JSON.parse(mobileDetails);
				
				/*var fixedAmounts = mobileDetailsObj.fixedAmounts;
				var operatorId = mobileDetailsObj.operatorId;*/
				var operatorId = mobileDetails[9];
				var fixedAmountsStr = mobileDetails[10];
				fixedAmounts = _getFixedAmountArrayFromString(fixedAmountsStr);
				var rechargeOptionsData = getAmountForPoints(points, fixedAmounts);
				var eligibleDenomination = rechargeOptionsData.rechargeDenomination;
				var pointsToBeDeducted = rechargeOptionsData.pointsToDeduct; 	
				console.log("Recharge denomination:::::"+eligibleDenomination);
				console.log("Points to be deducted:::::"+pointsToBeDeducted);
				
				res.status("200").send({ "totalPoints":points, "eligibleAmount":eligibleDenomination, "pointsToDeduct":pointsToBeDeducted, "operatorId":operatorId ,"message": "Succesfully fetched recharge options for points" });	
			});
			
		}else{
			res.status("500").send({ "message": "Insufficient points. Earn 1000 points to get mobile recharge coupon. You are at "+points+ " right now. All the best" });
		}
	});
}
function getRedemptionOptionsV2(req, res){

  console.log("----//Webhook getRedemptionOptionsV2 called //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));
  var currentDate = getCurrentDate();
  var now = new Date();
  var currentDateTime = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

  var contactNo = getFormattedContactNumber(req.body.contact);
  console.log("Contact no received: :" + req.body.contact);
  console.log("Formated contact no: :" + contactNo);

  var url = pointsConfig.apiEndPoint + "/" + pointsConfig.getCustomerInfoService;
  var options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'userid': pointsConfig.userid,
      'pwd': pointsConfig.pwd,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "objClass": 
        {
		  "customer_mobile": contactNo
		}
    })
  };
  console.log("----//About to call API:   //-------" + url);
  console.log(" with request data: " + JSON.stringify(options));
  request(options, function (error, response) {
	var points = 0;
	if (error) {
	  console.log("Error while fetching points:"+points);
	  throw new Error(error);
    };
	console.log(response.body);
	var temp = JSON.parse(response.body);
	if(temp.GET_CUSTOMER_TRANS_INFOResult.Success == true){
		var temp2 = JSON.parse(temp.GET_CUSTOMER_TRANS_INFOResult.output.response);
		points = temp2.CUSTOMER_DETAILS[0].LoyalityPoints;
		console.log("User points received from API:"+points);
		if(points >= 1000){
			console.log("POINTS:::::"+points);
			var operatorId = temp2.CUSTOMER_DETAILS[0].Customer_mobile_service_provider;
			console.log("Operator Id"+operatorId);
			var fixedAmountsStr = temp2.CUSTOMER_DETAILS[0].Customer_phone_recharges_allowed;
			if(fixedAmountsStr !=null && operatorId != null){
				var fixedAmounts = _getFixedAmountArrayFromString(fixedAmountsStr);
				var rechargeOptionsData = getAmountForPoints(points, fixedAmounts);
				var eligibleDenomination = rechargeOptionsData.rechargeDenomination;
				var pointsToBeDeducted = rechargeOptionsData.pointsToDeduct; 	
				console.log("Recharge denomination:::::"+eligibleDenomination);
				console.log("Points to be deducted:::::"+pointsToBeDeducted);
				res.status("200").send({ "totalPoints":points, "eligibleAmount":eligibleDenomination, "pointsToDeduct":pointsToBeDeducted, "operatorId":operatorId ,"message": "Succesfully fetched recharge options for points" });
			}else{
				res.status("500").send({ "message": "Cannot fetch rechrege options at this moment. Please contact teacher." });
			}
				
		}else{
			res.status("500").send({ "message": "Insufficient points. Earn 1000 points to get mobile recharge coupon. You are at "+points+ " right now. All the best" });
		}
	}	
  });
}

/**
 * Returns available recharge options. 
 */
function getRedemptionOptionsFromSheets(req, res){
	
	var contactNumber = req.body.contact;
	detectMobileNumberFromSheets(contactNumber, function(mobileDetails){
		console.log(mobileDetails);
		var operatorId = mobileDetails[5];
		var fixedAmountsStr = mobileDetails[6];
		var totalPoints = mobileDetails[7];
		console.log("total Points:::::"+totalPoints);
		if(parseInt(totalPoints) >= 1000){
			fixedAmounts = _getFixedAmountArrayFromString(fixedAmountsStr);
			var rechargeOptionsData = getAmountForPoints(totalPoints, fixedAmounts);
			var eligibleDenomination = rechargeOptionsData.rechargeDenomination;
			var pointsToBeDeducted = rechargeOptionsData.pointsToDeduct; 	
			console.log("Recharge denomination:::::"+eligibleDenomination);
			console.log("Points to be deducted:::::"+pointsToBeDeducted);
			res.status("200").send({ "totalPoints":totalPoints, "eligibleAmount":eligibleDenomination, "pointsToDeduct":pointsToBeDeducted, "operatorId":operatorId ,"message": "Succesfully fetched recharge options for points" });	
		}else{
			res.status("500").send({ "totalPoints":totalPoints, "eligibleAmount":0, "pointsToDeduct":0, "message": "Insufficient points. Earn 1000 points to get mobile recharge coupon. You are at "+totalPoints+ " right now. All the best" });
		}
	});
}

function _getFixedAmountArrayFromString(fixedAmountsStr){
	fixedAmountsStr = fixedAmountsStr.substring(1, fixedAmountsStr.length-1);
	var fixedAmounts = fixedAmountsStr.split(",");
	return fixedAmounts;
}

function getAmountForPoints(points, fixedAmounts){
	var amount = 0;
	// Minimum points is 100. 100 points will map to 1 rupee.	
	if(points > 100) {
		amount = points/100;
	}
	var rechargeDenomination = 0;
	// validate against the fixed amounts
	console.log("fixedAmounts"+fixedAmounts);
	for (var i = 0; i < fixedAmounts.length; i++) {
		console.log("comparing:"+fixedAmounts[i]);
		if(amount > fixedAmounts[i]){
		  // Do nothing	
		}else if(amount == fixedAmounts[i]){
			rechargeDenomination = fixedAmounts[i];
		}else{
			rechargeDenomination = fixedAmounts[i-1];
			break;	
		} 
	}
	var pointsToDeduct = rechargeDenomination*100;
	var response = {'rechargeDenomination':rechargeDenomination, 'pointsToDeduct':pointsToDeduct}; 
	return response;
}

function redeemPoints(req, res) {
	console.log('About to recharge mobile...');
	topupMobileNumber(req, res, function(status){
		if(status) {
			deductPointsFromUser(req, res, function(topupStatus){
				if(topupStatus){
					res.status("200").send({ "message": "Successfully recharged the mobile and deducted points " });
				}else{
					res.status("500").send({ "message": "Issue occured during redemption and deducting points" });
				}
			});		
		}else{
			res.status("500").send({ "message": "Issue occured with topup" });
		}
	});
}

function deductPointsFromUser(req, res, status) {
  console.log("----//Webhook deduct points called //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));
  var currentDate = getCurrentDate();
  var now = new Date();
  var currentDateTime = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

  var billNo = random.int((min = 100000), (max = 200000));
  
  var pointsToBeDeducted = req.body.pointsToDeduct;
  var contactNo = getFormattedContactNumber(req.body.contact);
  
  console.log("Contact no received: :" + req.body.contact);
  console.log("Formated contact no: :" + contactNo);

  deductTotalPointsInSheet(contactNo, pointsToBeDeducted, 'redeem_points', null);
  status(true);
}


/**
* Returns the points of the users.
 */
function getPointsOfUser(req, res, userPoints) {
  console.log("----//Webhook Get points called //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));
  var currentDate = getCurrentDate();
  var now = new Date();
  var currentDateTime = dateFormat(now, "yyyy-mm-dd HH:MM:ss");

  var contactNo = getFormattedContactNumber(req.body.contact);
  console.log("Contact no received: :" + req.body.contact);
  console.log("Formated contact no: :" + contactNo);

  var url = pointsConfig.apiEndPoint + "/" + pointsConfig.getCustomerInfoService;
  var options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'userid': pointsConfig.userid,
      'pwd': pointsConfig.pwd,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "objClass": 
        {
		  "customer_mobile": contactNo
		}
    })
  };
  console.log("----//About to call API:   //-------" + url);
  console.log(" with request data: " + JSON.stringify(options));
  request(options, function (error, response) {
	var points = 0;
	if (error) {
	  console.log("Error while fetching points:"+points);
	  throw new Error(error);
    };
	console.log(response.body);
	var temp = JSON.parse(response.body);
	if(temp.GET_CUSTOMER_TRANS_INFOResult.Success == true){
		var temp2 = JSON.parse(temp.GET_CUSTOMER_TRANS_INFOResult.output.response);
		points = temp2.CUSTOMER_DETAILS[0].LoyalityPoints;
		console.log("User points received from API:"+points);
	}
	userPoints(points);
  });
}

const getPointsOfUserFromSheets = async (req, res, userPoints) => {
	
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(req.body.contact);
	console.log("---------------- contactNo"+contactNo);
	var spreadSheetId = pointsConfig.users_master_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		console.log("Retrieved rows count :"+rows.length);
		var rowToUpdate = null;
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;
			if(phone == contactNo){
				console.log("---------------- matched"+contactNo);
				rowToUpdate = rows[i]; 
				break;	
			}
		}
		
		var totalPoints = 0;
		if(rowToUpdate && rowToUpdate._rawData[7]){
			totalPoints = parseInt(rowToUpdate._rawData[7]);	
		} 
		userPoints(totalPoints); 
		
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}


const checkIfUserPointsExistsInSheets = async (req, res, status) => {
	
	console.log("Checking if points exits...");
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(req.body.contact);
	var activityToCheck = req.body.item_code;
	
	var spreadSheetId = pointsConfig.points_log_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.points_log_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		console.log("Retrieved rows count :"+rows.length);
		var exists = false;
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;
			if(phone == contactNo){
				var activityCode = rows[i].activity_code;
				if(activityCode == activityToCheck){
					console.log("activityCode points found...");
					exists = true; 
					break;
				}	
			}
		}
		status(exists);
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}

const checkIfUserAlreadyRegisteredInSheets = async (req, res, status) => {
	
	console.log("Checking if points exits...");
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(req.body.contact);
	console.log("contactNo--", contactNo)
	
	var spreadSheetId = pointsConfig.users_master_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		// console.log("Retrieved rows count :"+rows.length);
		var exists = false;
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;

			if( phone === contactNo){
				
				console.log("User record found...");
				exists = true; 
				break;
			}
		}
		status(exists);
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	// console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}

/**
* Topup a mobile numner
 */
function topupMobileNumber(req, res, status) {
  console.log("----//Webhook Topup called //-------");
  console.log("Webhook req Data" + JSON.stringify(req.body));

  var rechargeAmount = req.body.eligibleAmount;	
  var operatorId =  req.body.operatorId;
  // TODO: remove this mobile number hard coding after testing.
  //var contactNo = pointsConfig.mukke_pre_paid_number;
  var contactNo = getFormattedContactNumber(req.body.contact);
  console.log("Contact no received: :" + req.body.contact);
  console.log("Formated contact no: :" + contactNo);
  var uniqueRefNo = random.int((min = 100000), (max = 200000));
  uniqueRefNo = contactNo+"_"+uniqueRefNo;


  var authToken = 'Bearer '+pointsConfig.reloadly_topup_api_bearer;
  var options = {
	  'method': 'POST',
	  'url': pointsConfig.reloadly_topup_api_endpoint+"/topups-async",
	  'headers': {
	    'Authorization': authToken,
	    'Accept': 'application/com.reloadly.topups-v1+json',
	    'Content-Type': 'application/json'
	  },
	  body: JSON.stringify({
	    "operatorId": operatorId,
	    "amount": rechargeAmount,
	    "customIdentifier": uniqueRefNo,
	    "recipientPhone": {
	      "countryCode": "IN",
	      "number": contactNo
	    },
	    "senderPhone": {
	      "countryCode": "IN",
	      "number": pointsConfig.mukkamaar_bot_contact
	    }
	  })
	
	};
	 
  request(options, function (error, response) {
	if (error) {
		status(false);
		console.log("Inside Error");
		throw new Error(error);	
	}
	if(response.statusCode != 200) {
		status(false);
	}else{
		status(true);
	}
	console.log(response.body);
  });

}

function autoDetectMobileNumber(mobileNumber, status){

  var contactNo = getFormattedContactNumber(mobileNumber);
  console.log("Contact no received: :" + mobileNumber);
  console.log("Formated contact no: :" + contactNo);

  var authToken = 'Bearer '+pointsConfig.reloadly_topup_api_bearer;
  var options = {
	  'method': 'GET',
	  'url': pointsConfig.reloadly_topup_api_endpoint+"/operators/auto-detect/phone/"+contactNo+"/countries/IN",
	  'headers': {
	    'Authorization': authToken,
	    'Accept': 'application/com.reloadly.topups-v1+json',
	    'Content-Type': 'application/json'
	  }
	};
	 
  request(options, function (error, response) {
	if (error) {
		status(response.body);
		throw new Error(error);	
	}
	status(response.body);
	//console.log(response.body);
  });
}



function getCurrentDate() {
  var now = new Date();
  var formattedDate = dateFormat(now, "yyyy-mm-dd");
  return formattedDate;
}

function getCurrentDateAndTime() {
  var now = new Date();
  var formattedDate = dateFormat(now, "yyyy-mm-dd HH:MM");
  return formattedDate;
}

function getFormattedContactNumber(phoneNumber) {
  var formattedNumber = phoneNumber;
  // Remove characters after _ for Glific simulator scenarios.
  if (phoneNumber.indexOf("_") != -1) {
    formattedNumber = formattedNumber.substr(0, phoneNumber.indexOf("_"));
  }
  if (formattedNumber.length > 10) {
    if (formattedNumber.startsWith("+")) {
      console.log("Starts with +");
      formattedNumber = formattedNumber.replace("+", "");
    }

    if (formattedNumber.startsWith("91")) {
      console.log("Starts with 91");
      formattedNumber = formattedNumber.replace("91", "");
    }

    if (formattedNumber.startsWith("+91")) {
      formattedNumber = formattedNumber.replace("+91", "");
    }
  }

  return formattedNumber;
}

const registerUsersToSheets = async (writeData) => {

	console.log("Excel registerUsersToSheets called with Request Data");
	
	var spreadSheetId = pointsConfig.users_master_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});

		var fieldsToWrite = writeData;
		var currentDate = getCurrentDateAndTime();
		fieldsToWrite.reg_date = currentDate;
		console.log(fieldsToWrite);

		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];

		var contactNumber = getFormattedContactNumber(fieldsToWrite.contact);
		
		autoDetectMobileNumber(contactNumber, function(mobileDetails){
				console.log("Auto detected mobile number.....");
				var mobileDetailsObj = JSON.parse(mobileDetails);
				var fixedAmounts = mobileDetailsObj.fixedAmounts;
				console.log(JSON.stringify(fixedAmounts));
				var operatorId = mobileDetailsObj.operatorId;
				fieldsToWrite.operator_id = operatorId;
				fieldsToWrite.contact = contactNumber;
				console.log("Contact number being written : "+ fieldsToWrite.contact);
				fieldsToWrite.total_points = 0;
				fieldsToWrite.recharge_denom = JSON.stringify(fixedAmounts);
				const row = sheet.addRow(fieldsToWrite);
		});
		
	}
	else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
};


const detectMobileNumberFromSheets = async (mobileNumber, status) => {
	
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(mobileNumber);
	console.log("---------------- contactNo"+contactNo);
	var spreadSheetId = pointsConfig.users_master_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		console.log("Retrieved rows count :"+rows.length);
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;
			if(phone == contactNo){
				console.log("---------------- matched"+contactNo);
				status(rows[i]._rawData);
				break;	
			}
		}
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the detect function is:"+secondsDiff+ "seconds");
}

const addTotalPointsInSheet = async (mobileNumber, points, activityCode, status) => {
	
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(mobileNumber);
	console.log("---------------- contactNo"+contactNo);
	var spreadSheetId = pointsConfig.users_master_sheet;
	console.log("UserSpreadSheet Id: " + spreadSheetId);
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		
		var rowToUpdate = null;
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;
			if(phone == contactNo){
				console.log("---------------- matched"+contactNo);
				rowToUpdate = rows[i]; 
				break;
			}
		}
		console.log("Retrieved rows count :"+rows.length);
		var totalPoints = 0;
		if(rowToUpdate != null){
			if(rowToUpdate._rawData[7]){
			totalPoints = parseInt(rowToUpdate._rawData[7]);	
		} 
		totalPoints = totalPoints + points;
		rowToUpdate.total_points = totalPoints;
		
		await logTransaction(mobileNumber, points, activityCode, null)
		
		rowToUpdate.save(); 
		}
		
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}



const logTransaction = async (mobileNumber, points, activityCode, status) => {
	
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(mobileNumber);
	console.log("---------------- contactNo"+contactNo);
	var spreadSheetId = pointsConfig.points_log_sheet;
	console.log("logspreadsheet id : " + spreadSheetId);
	if (spreadSheetId) {
		const sheetId = pointsConfig.points_log_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		var fieldsToWrite = {};
		var currentDate = getCurrentDateAndTime();
		fieldsToWrite.date = currentDate;
		fieldsToWrite.contact = contactNo;
		fieldsToWrite.activity_code = activityCode;
		fieldsToWrite.points = points;
		console.log("fieldsTowrite:  ", fieldsToWrite);
		const row = sheet.addRow(fieldsToWrite); 
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}


const deductTotalPointsInSheet = async (mobileNumber, points, activityCode, status) => {
	
	var startDate = moment(new Date());
	var contactNo = getFormattedContactNumber(mobileNumber);
	console.log("---------------- contactNo"+contactNo);
	var spreadSheetId = pointsConfig.users_master_sheet;
	if (spreadSheetId) {
		const sheetId = pointsConfig.users_master_sheet_sheetid;
		const { GoogleSpreadsheet } = require('google-spreadsheet');
		const doc = new GoogleSpreadsheet(spreadSheetId);
		await doc.useServiceAccountAuth({
			client_email: googleAPIKey.client_email,
			private_key: googleAPIKey.private_key
		});
		await doc.loadInfo();
		var sheet = doc.sheetsById[sheetId];
		const rows = await sheet.getRows();
		
		console.log("Retrieved rows count :"+rows.length);
		var rowToUpdate = null;
		for (var i = 0; i < rows.length ; i++) {
			var phone = rows[i].contact;
			if(phone == contactNo){
				rowToUpdate = rows[i]; 
				break;	
			}
		}
		
		var totalPoints = 0;
		if(rowToUpdate._rawData[7]){
			totalPoints = parseInt(rowToUpdate._rawData[7]);	
		} 
		totalPoints = totalPoints - points;
		rowToUpdate.total_points = totalPoints;
		
		logTransaction(mobileNumber, points, activityCode, null);
		
		rowToUpdate.save(); 
		
		
	}else {
		throw new ApiError(httpStatus.NOT_FOUND, 'Master Excel sheet not found');
	}
	var endDate = moment(new Date());
	var secondsDiff = endDate.diff(startDate, 'seconds')
	console.log("Time taken by the  function is:"+secondsDiff+ "seconds");
}

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const refershApp = catchAsync(async (req, res) => {
  res.send({ "msg" : "App Refershed.." });
});

module.exports = {
  register,
  refershApp,
  login,
  addPoints,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
