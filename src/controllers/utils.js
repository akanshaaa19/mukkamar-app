const pointsConfig = require('../config/points-config.js');
const { default: axios } = require('axios');

const getAuthCode = async () => {
  const client_id = process.env.RELOADLY_CLIENT_ID;
  const client_secret = process.env.RELOADLY_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return;
  }

  const response = await axios
    .post(pointsConfig.reloadly_auth, {
      client_id,
      client_secret,
      grant_type: 'client_credentials',
      audience: pointsConfig.reloadly_topup_api_endpoint,
    })
    .then((data) => data)
    .catch((error) => error);

  console.log(response);

  if (response.status === 200) {
    return response.data.access_token;
  } else {
    return null;
  }
};

/**
 * Returns available recharge options.
 */
function getRedemptionOptionsFromSheets(req, res) {
  try {
    const { total_points, fixedAmounts } = req.body;
    let finalFixedAmount = fixedAmounts ? fixedAmounts.split(',') : pointsConfig.fixedAmounts;
    if (parseInt(total_points) >= 1000) {
      console.log(total_points, finalFixedAmount);
      const rechargeOptionsData = getAmountForPoints(total_points, finalFixedAmount);
      const { rechargeDenomination, pointsToDeduct } = rechargeOptionsData;

      res.status('200').send({
        totalPoints: total_points,
        eligibleAmount: rechargeDenomination,
        pointsToDeduct: pointsToDeduct,
        message: 'Succesfully fetched recharge options for points',
      });
    } else {
      res.status('500').send({
        totalPoints: total_points,
        eligibleAmount: 0,
        pointsToDeduct: 0,
        message:
          'Insufficient points. Earn 1000 points to get mobile recharge coupon. You are at ' +
          total_points +
          ' right now. All the best',
      });
    }
  } catch (error) {
    console.log('Error in getRedemptionOptionsFromSheets', error);
  }
}

const redeemPoints = async (operator_id, amount, phone) => {
  const authToken = await getAuthCode();

  const response = await axios
    .post(
      pointsConfig.reloadly_topup_api_endpoint + '/topups-async',
      {
        operatorId: operator_id,
        amount: amount,
        recipientPhone: { countryCode: 'IN', number: phone },
        senderPhone: { countryCode: 'IN', number: pointsConfig.mukkamaar_bot_contact },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/com.reloadly.topups-v1+json',
          Authorization: `Bearer ${authToken}`,
        },
      }
    )
    .then((data) => data)
    .catch((error) => error);

  console.log(response);

  return response.status;
};

const rechargePhone = async (req, res) => {
  console.log('About to recharge mobile...', req.body);
  const { contact, eligibleAmount, operator_id, pointsToDeduct } = req.body;

  const response = await redeemPoints(operator_id, eligibleAmount, contact);

  if (response === 200) {
    res.status(200).send({ message: 'Successfully recharged the mobile and deducted points', pointsToDeduct });
  } else {
    res.status(500).send({ message: 'Issue occured during redemption and deducting points', pointsToDeduct });
  }
};

const getOperatorDetails = async (req, res) => {
  const { contact } = req.body;
  const authToken = await getAuthCode();

  const response = await axios
    .get(`${pointsConfig.reloadly_topup_api_endpoint}/operators/auto-detect/phone/${contact}/countries/IN`, {
      headers: {
        Accept: 'application/com.reloadly.topups-v1+json',
        Authorization: `Bearer ${authToken}`,
      },
    })
    .then((response) => response)
    .catch((error) => error);

  console.log(response.data);

  if (response.status === 200) {
    res.status(200).send({
      operatorId: response.data?.operatorId,
      fixedAmounts: response.data?.fixedAmounts?.toString(),
    });
  } else {
    return res.status(500).send({
      error: 'Error while fetching operator id',
    });
  }
};

function getAmountForPoints(points, fixedAmounts) {
  var amount = 0;
  // Minimum points is 100. 100 points will map to 1 rupee.
  if (points > 100) {
    amount = points / 100;
  }
  var rechargeDenomination = 0;
  // validate against the fixed amounts
  console.log('fixedAmounts' + fixedAmounts);
  for (var i = 0; i < fixedAmounts.length; i++) {
    console.log('comparing:' + fixedAmounts[i]);
    if (amount > fixedAmounts[i]) {
      // Do nothing
    } else if (amount == fixedAmounts[i]) {
      rechargeDenomination = fixedAmounts[i];
    } else {
      rechargeDenomination = fixedAmounts[i - 1];
      break;
    }
  }
  var pointsToDeduct = rechargeDenomination * 100;
  var response = { rechargeDenomination: rechargeDenomination, pointsToDeduct: pointsToDeduct };
  return response;
}

module.exports = {
  getRedemptionOptionsFromSheets,
  rechargePhone,
  getOperatorDetails,
};
