var pointsConfig = {};

pointsConfig.apiEndPoint = 'https://mukkamaarws.mloyalretail.com/service.svc';
pointsConfig.registrationService = 'INSERT_CUSTOMER_REGISTRATION_ACTION';
pointsConfig.registrationUpdateService = 'UPDATE_CUSTOMER_REGISTRATION';
pointsConfig.billingService = 'INSERT_BILLING_DATA_ACTION';
//pointsConfig.redeemPointsService = 'REDEEM_LOYALTY_POINTS_ACTION';
pointsConfig.redeemPointsService = 'GET_WALLET_REDEMPTION_WITHOUT_OTP';
pointsConfig.getCustomerInfoService = 'GET_CUSTOMER_TRANS_INFO';
pointsConfig.userid = 'mob_usr';
pointsConfig.pwd = '@f166a80e-857e-4793-8227-e6b94d1acd3d';
pointsConfig.glificSecretToken = '2hlhl3bkjb4jbkbl3%*13bb3b$#ln&lnl3';

pointsConfig.mukkamaar_bot_contact = 9930029265;
pointsConfig.reloadly_topup_api_endpoint = 'https://topups-sandbox.reloadly.com';
pointsConfig.reloadly_auth = 'https://auth.reloadly.com/oauth/token';
pointsConfig.reloadly_topup_api_bearer =
  'Bearer eyJraWQiOiI1N2JjZjNhNy01YmYwLTQ1M2QtODQ0Mi03ODhlMTA4OWI3MDIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyNTg0NiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjI1ODQ2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly90b3B1cHMtaHMyNTYtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MzkzNzYyMzIsImF6cCI6IjI1ODQ2Iiwic2NvcGUiOiJzZW5kLXRvcHVwcyByZWFkLW9wZXJhdG9ycyByZWFkLXByb21vdGlvbnMgcmVhZC10b3B1cHMtaGlzdG9yeSByZWFkLXByZXBhaWQtYmFsYW5jZSByZWFkLXByZXBhaWQtY29tbWlzc2lvbnMiLCJleHAiOjE3Mzk0NjI2MzIsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6IjIwZDRkMGQ5LTAwNmMtNGJiNS1hYTBiLWNlZGQ1MDIyYmM1ZCIsImlhdCI6MTczOTM3NjIzMiwianRpIjoiZDc2YWRiZmEtNDdhNC00NDMyLTgxY2YtMDcyOTQ3NDVjNThhIn0.l31kTy51OMGAQNfUIGqVqzPDAw_Nj4wddNKegAgPi1A';
pointsConfig.reloadly_airtel_data_operator_id = 776;
pointsConfig.reloadly_vodafone_data_operator_id = 774;
pointsConfig.reloadly_vodafone_idea_operator_id = 716;
pointsConfig.reloadly_airtel_data_denom = [48, 78, 89, 98, 119, 131, 248, 251];
pointsConfig.mukke_pre_paid_number = '9321644470';

pointsConfig.users_master_sheet = '1svHecY9H3sAaOXtheBVhYwpv0SoFWnrpFarSjI3gfJM';
pointsConfig.users_master_sheet_sheetid = 0;
pointsConfig.points_log_sheet = '105lK6saABWALQYDDKYcbb5NJNJ9Y46hHt-kH4-9O7aw';
pointsConfig.points_log_sheet_sheetid = 0;

pointsConfig.recharge_denominations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

module.exports = pointsConfig;
