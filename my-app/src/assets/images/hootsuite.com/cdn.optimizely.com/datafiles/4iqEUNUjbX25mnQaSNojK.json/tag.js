window["optimizelyDatafile"] = {"accountId":"21463890023","projectId":"21528231491","revision":"851","attributes":[{"id":"21608880644","key":"trial_start_date"},{"id":"21633651424","key":"test_attribute_color"},{"id":"21644870497","key":"test_in_trial"},{"id":"21673640720","key":"test_member_plan"},{"id":"21703991056","key":"member_max_plan"},{"id":"21749300560","key":"member_language"},{"id":"21828205654","key":"hasInheritedPlanCodes"},{"id":"21854502318","key":"language"},{"id":"21858685202","key":"isInTrial"},{"id":"21893141647","key":"planCode"},{"id":"21927142765","key":"countryCode"},{"id":"22275900532","key":"getting_started_2f2f_qa"},{"id":"27453210242","key":"test_attribute"},{"id":"27516130474","key":"hasMetaAdAccounts"},{"id":"27538380209","key":"accountAge"},{"id":"27590230145","key":"hasAdAccounts"},{"id":"27812510671","key":"app_version"},{"id":"27816500608","key":"signupOffer"},{"id":"27831330542","key":"trialDuration"},{"id":"27938910251","key":"hasFacebookPageSocialProfile"},{"id":"27990400517","key":"createdDate"}],"audiences":[{"name":"Plan: Professional","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"21674540084"},{"name":"Status: Trial","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"21863885249"},{"id":"21863945224","conditions":"[\"and\", [\"or\", [\"or\", {\"match\": \"exact\", \"name\": \"language\", \"type\": \"custom_attribute\", \"value\": \"en\"}]]]","name":"Language: English"},{"name":"Ecomm Plans: Professional & Team","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"25439170728"},{"name":"First 30 days (All users)","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"27462030252"},{"name":"30_day_trial_test","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"27895400133"},{"name":"Existing User","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]","id":"27917360098"},{"id":"$opt_dummy_audience","name":"Optimizely-Generated Audience for Backwards Compatibility","conditions":"[\"or\", {\"match\": \"exact\", \"name\": \"$opt_dummy_attribute\", \"type\": \"custom_attribute\", \"value\": \"$opt_dummy_value\"}]"}],"version":"4","events":[{"id":"21655900122","experimentIds":[],"key":"promote_boost_spp_created"},{"id":"21688231454","experimentIds":[],"key":"promote_boost_video_clicked_var-a"},{"id":"21688261728","experimentIds":[],"key":"promote_boost_box2_clicked"},{"id":"21703491943","experimentIds":[],"key":"promote_boost_createpost_clicked"},{"id":"21715382013","experimentIds":[],"key":"promote_boost_boost_clicked_var-b"},{"id":"21715552271","experimentIds":[],"key":"promote_boost_set-autoboost_clicked"},{"id":"21727071879","experimentIds":[],"key":"promote_boost_box1_clicked"},{"id":"21738401083","experimentIds":[],"key":"promote_boost_box3_clicked"},{"id":"21745731587","experimentIds":[],"key":"promote_boost_learnmore_clicked_var-a"},{"id":"22072381356","experimentIds":[],"key":"ci_authwizard_entered"},{"id":"27457050111","experimentIds":[],"key":"prm_autoboost_setup_clicked"}],"integrations":[],"anonymizeIP":true,"botFiltering":false,"typedAudiences":[{"name":"Plan: Professional","conditions":["and",["or",["or",{"match":"exact","name":"planCode","type":"custom_attribute","value":"PROFESSIONAL_PLAN"}]],["or",["or",{"match":"exact","name":"hasInheritedPlanCodes","type":"custom_attribute","value":false}]]],"id":"21674540084"},{"name":"Status: Trial","conditions":["and",["or",["or",{"match":"exact","name":"isInTrial","type":"custom_attribute","value":true}]]],"id":"21863885249"},{"name":"Ecomm Plans: Professional & Team","conditions":["and",["or",["or",{"match":"exact","name":"planCode","type":"custom_attribute","value":"PROFESSIONAL_PLAN"}],["or",{"match":"exact","name":"planCode","type":"custom_attribute","value":"TEAM3S"}]],["or",["or",{"match":"exact","name":"hasInheritedPlanCodes","type":"custom_attribute","value":false}]]],"id":"25439170728"},{"name":"First 30 days (All users)","conditions":["and",["or",["or",{"match":"le","name":"accountAge","type":"custom_attribute","value":30}]]],"id":"27462030252"},{"name":"30_day_trial_test","conditions":["and",["or",["or",{"match":"le","name":"trialDuration","type":"custom_attribute","value":50}]],["or",["or",{"match":"gt","name":"trialDuration","type":"custom_attribute","value":0}]]],"id":"27895400133"},{"name":"Existing User","conditions":["and",["or",["or",{"match":"gt","name":"accountAge","type":"custom_attribute","value":30}]],["or",["or",{"match":"exact","name":"isInTrial","type":"custom_attribute","value":false}]]],"id":"27917360098"}],"variables":[],"environmentKey":"production","sdkKey":"4iqEUNUjbX25mnQaSNojK","featureFlags":[{"id":"22364","key":"grw_ss_ob_2_3","rolloutId":"rollout-22364-21528311249","experimentIds":[],"variables":[]},{"id":"25809","key":"ci_ss_authwizard_1_0","rolloutId":"rollout-25809-21528311249","experimentIds":[],"variables":[]},{"id":"30444","key":"ci_ss_simplifiedigauth_1_0","rolloutId":"rollout-30444-21528311249","experimentIds":[],"variables":[]},{"id":"44595","key":"grw_ss_act_pb_1","rolloutId":"rollout-44595-21528311249","experimentIds":[],"variables":[]},{"id":"37309","key":"mntz_eng_pendo_1_0","rolloutId":"rollout-37309-21528311249","experimentIds":[],"variables":[]},{"id":"52165","key":"grw_ss_hp_1_0","rolloutId":"rollout-52165-21528311249","experimentIds":["9300000235564"],"variables":[]},{"id":"110273","key":"grw_ss_onboarding_4_0","rolloutId":"rollout-110273-21528311249","experimentIds":["9300000414509"],"variables":[]},{"id":"112008","key":"grw_ss_onboarding_5_0","rolloutId":"rollout-112008-21528311249","experimentIds":[],"variables":[]},{"id":"121272","key":"PG2402_SSU","rolloutId":"rollout-121272-21528311249","experimentIds":[],"variables":[]},{"id":"122096","key":"prm_eng_autoboost_1_0","rolloutId":"rollout-122096-21528311249","experimentIds":[],"variables":[]},{"id":"122181","key":"grw_ss_onboarding_7_0","rolloutId":"rollout-122181-21528311249","experimentIds":["9300000495857"],"variables":[]},{"id":"122905","key":"grw_ss_homepage_4_0","rolloutId":"rollout-122905-21528311249","experimentIds":["9300000500471"],"variables":[]},{"id":"122993","key":"grw_ss_onboarding_8_0","rolloutId":"rollout-122993-21528311249","experimentIds":["9300000505583"],"variables":[]},{"id":"124167","key":"louis_test","rolloutId":"rollout-124167-21528311249","experimentIds":[],"variables":[{"id":"41093","key":"test_variable","type":"string","defaultValue":"A test variable"},{"id":"41237","key":"text_color","type":"string","defaultValue":""}]},{"id":"124674","key":"srs_ss_ecomm_homepage_1_0","rolloutId":"rollout-124674-21528311249","experimentIds":[],"variables":[]},{"id":"125130","key":"tiral_duration_test","rolloutId":"rollout-125130-21528311249","experimentIds":["9300000522612"],"variables":[]},{"id":"125216","key":"grw_ss_onboarding_7_1","rolloutId":"rollout-125216-21528311249","experimentIds":["9300000523069"],"variables":[]},{"id":"125538","key":"new_feature","rolloutId":"rollout-125538-21528311249","experimentIds":[],"variables":[{"id":"41188","key":"sortOrder","type":"string","defaultValue":"alpha"}]}],"rollouts":[{"id":"rollout-22364-21528311249","experiments":[{"id":"default-rollout-22364-21528311249","key":"default-rollout-22364-21528311249","status":"Running","layerId":"rollout-22364-21528311249","variations":[{"id":"62036","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"62036","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-25809-21528311249","experiments":[{"id":"default-rollout-25809-21528311249","key":"default-rollout-25809-21528311249","status":"Running","layerId":"rollout-25809-21528311249","variations":[{"id":"73270","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"73270","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-30444-21528311249","experiments":[{"id":"default-rollout-30444-21528311249","key":"default-rollout-30444-21528311249","status":"Running","layerId":"rollout-30444-21528311249","variations":[{"id":"89519","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"89519","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-44595-21528311249","experiments":[{"id":"default-rollout-44595-21528311249","key":"default-rollout-44595-21528311249","status":"Running","layerId":"rollout-44595-21528311249","variations":[{"id":"134155","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"134155","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-37309-21528311249","experiments":[{"id":"default-rollout-37309-21528311249","key":"default-rollout-37309-21528311249","status":"Running","layerId":"rollout-37309-21528311249","variations":[{"id":"111985","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"111985","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-52165-21528311249","experiments":[{"id":"default-rollout-52165-21528311249","key":"default-rollout-52165-21528311249","status":"Running","layerId":"rollout-52165-21528311249","variations":[{"id":"151618","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"151618","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-110273-21528311249","experiments":[{"id":"default-rollout-110273-21528311249","key":"default-rollout-110273-21528311249","status":"Running","layerId":"rollout-110273-21528311249","variations":[{"id":"344329","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"344329","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-112008-21528311249","experiments":[{"id":"default-rollout-112008-21528311249","key":"default-rollout-112008-21528311249","status":"Running","layerId":"rollout-112008-21528311249","variations":[{"id":"349485","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"349485","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-121272-21528311249","experiments":[{"id":"default-rollout-121272-21528311249","key":"default-rollout-121272-21528311249","status":"Running","layerId":"rollout-121272-21528311249","variations":[{"id":"377923","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"377923","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-122096-21528311249","experiments":[{"id":"default-rollout-122096-21528311249","key":"default-rollout-122096-21528311249","status":"Running","layerId":"rollout-122096-21528311249","variations":[{"id":"382393","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"382393","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-122181-21528311249","experiments":[{"id":"default-rollout-122181-21528311249","key":"default-rollout-122181-21528311249","status":"Running","layerId":"rollout-122181-21528311249","variations":[{"id":"382670","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"382670","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-122905-21528311249","experiments":[{"id":"default-rollout-122905-21528311249","key":"default-rollout-122905-21528311249","status":"Running","layerId":"rollout-122905-21528311249","variations":[{"id":"384990","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"384990","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-122993-21528311249","experiments":[{"id":"default-rollout-122993-21528311249","key":"default-rollout-122993-21528311249","status":"Running","layerId":"rollout-122993-21528311249","variations":[{"id":"385389","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"385389","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-124167-21528311249","experiments":[{"id":"default-rollout-124167-21528311249","key":"default-rollout-124167-21528311249","status":"Running","layerId":"rollout-124167-21528311249","variations":[{"id":"390773","key":"off","featureEnabled":false,"variables":[{"id":"41093","value":"A test variable"},{"id":"41237","value":""}]}],"trafficAllocation":[{"entityId":"390773","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-124674-21528311249","experiments":[{"id":"default-rollout-124674-21528311249","key":"default-rollout-124674-21528311249","status":"Running","layerId":"rollout-124674-21528311249","variations":[{"id":"392558","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"392558","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-125130-21528311249","experiments":[{"id":"default-rollout-125130-21528311249","key":"default-rollout-125130-21528311249","status":"Running","layerId":"rollout-125130-21528311249","variations":[{"id":"393924","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"393924","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-125216-21528311249","experiments":[{"id":"default-rollout-125216-21528311249","key":"default-rollout-125216-21528311249","status":"Running","layerId":"rollout-125216-21528311249","variations":[{"id":"394169","key":"off","featureEnabled":false,"variables":[]}],"trafficAllocation":[{"entityId":"394169","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]},{"id":"rollout-125538-21528311249","experiments":[{"id":"default-rollout-125538-21528311249","key":"default-rollout-125538-21528311249","status":"Running","layerId":"rollout-125538-21528311249","variations":[{"id":"394791","key":"off","featureEnabled":false,"variables":[{"id":"41188","value":"alpha"}]}],"trafficAllocation":[{"entityId":"394791","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]}]}],"experiments":[{"id":"9300000235564","key":"ex_grw_ss_hp_1_0","status":"Running","layerId":"9300000197821","variations":[{"id":"151632","key":"variation_1","featureEnabled":true,"variables":[]},{"id":"151631","key":"control","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"151632","endOfRange":5000},{"entityId":"151632","endOfRange":10000}],"forcedVariations":{},"audienceIds":[],"audienceConditions":[]},{"id":"9300000414509","key":"grw_ss_onboarding_4_0","status":"Running","layerId":"9300000332604","variations":[{"id":"344332","key":"control","featureEnabled":true,"variables":[]},{"id":"344334","key":"variation_1","featureEnabled":true,"variables":[]},{"id":"344335","key":"variation_2","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"","endOfRange":3333},{"entityId":"","endOfRange":6666},{"entityId":"","endOfRange":10000}],"forcedVariations":{},"audienceIds":["$opt_dummy_audience"],"audienceConditions":["and","25439170728","21863945224","21863885249"]},{"id":"9300000495857","key":"grw_ss_onboarding_7_0","status":"Running","layerId":"9300000403597","variations":[{"id":"382672","key":"control","featureEnabled":true,"variables":[]},{"id":"382673","key":"variation_1","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"","endOfRange":5000},{"entityId":"","endOfRange":10000}],"forcedVariations":{},"audienceIds":["$opt_dummy_audience"],"audienceConditions":["and","25439170728","21863945224","21863885249"]},{"id":"9300000500471","key":"grw_ss_homepage_4_0","status":"Running","layerId":"9300000406901","variations":[{"id":"384994","key":"control","featureEnabled":true,"variables":[]},{"id":"384995","key":"variation_1","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"384994","endOfRange":5000},{"entityId":"384995","endOfRange":10000}],"forcedVariations":{},"audienceIds":["$opt_dummy_audience"],"audienceConditions":["and","21863885249","21674540084"]},{"id":"9300000505583","key":"grw_ss_onboarding_8_0","status":"Running","layerId":"9300000409257","variations":[{"id":"385391","key":"variation_1","featureEnabled":true,"variables":[]},{"id":"386202","key":"control","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"385391","endOfRange":5000},{"entityId":"386202","endOfRange":10000}],"forcedVariations":{},"audienceIds":["$opt_dummy_audience"],"audienceConditions":["and","25439170728","21863945224","27462030252"]},{"id":"9300000522612","key":"trial_duration_30","status":"Running","layerId":"9300000419133","variations":[{"id":"393925","key":"on","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"393925","endOfRange":10000}],"forcedVariations":{},"audienceIds":["27895400133"],"audienceConditions":["or","27895400133"]},{"id":"9300000523069","key":"grw_ss_onboarding_7_1","status":"Running","layerId":"9300000419582","variations":[{"id":"394173","key":"variation_1","featureEnabled":true,"variables":[]},{"id":"394174","key":"control","featureEnabled":true,"variables":[]}],"trafficAllocation":[{"entityId":"394173","endOfRange":5000},{"entityId":"394174","endOfRange":10000}],"forcedVariations":{},"audienceIds":["$opt_dummy_audience"],"audienceConditions":["and","25439170728","27917360098"]}],"groups":[]}