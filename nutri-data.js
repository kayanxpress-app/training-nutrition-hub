/* قاعدة بيانات الأغذية (لكل ١٠٠ جم) — مرجعها الأساسي جداول USDA FoodData Central + قيم تقريبية للأكلات المصرية.
   الصيغة لكل سطر:  id | المجموعة | الأسماء (بفاصلة، و{أ/ب} لتوليد صيغ) | سعرات,بروتين,كارب,دهون | خيارات
   المجموعات: p بروتين · s نشويات · v خضار · fr فاكهة · f دهون · d ألبان · o أخرى (سكريات/مشروبات/توابل)
   الخيارات: st:c|r (الحالة الافتراضية مطبوخ/نيء) · alt:قيم الحالة التانية · pc:وزن الحبة · d:كثافة (جم/مل)
             cup/tbsp/tsp/scoop/slice/can/bowl/handful:وزن الوحدة بالجرام · amb:ملاحظة افتراض · est:1 قيمة تقديرية · zero:1 صفر سعرات
   ملحوظة: تقدر تصحح أي قيمة من التطبيق نفسه (زرار ✎ جنب الصنف) من غير ما تعدّل الملف ده. */
const NX_DB=`
# ===== بروتين: دواجن =====
chicken_breast|p|صدر فراخ,صدور فراخ,صدر دجاج,صدور دجاج,فراخ صدور,chicken breast|165,31,0,3.6|st:c alt:120,22.5,0,2.6
kofta_chicken|p|كفته دجاج,كفته فراخ,كفته دجاجه,كفته فرخه,chicken kofta|190,23,3,9|st:c est:1 amb:كفتة_دجاج_(قيمة_تقريبية_تختلف_بالتتبيلة_والخلطة)

shish_tawook|p|شيش طاووق,شيش طاوق,شيش فراخ,shish tawook|175,29,1.5,5.5|st:c est:1 amb:شيش_طاووق_(فراخ_متتبلة)_—_قيمة_تقريبية
chicken_generic|p|فراخ,دجاج,فرخه,chicken|165,31,0,3.6|st:c alt:120,22.5,0,2.6 amb:محسوب_كصدر_فراخ_بدون_جلد
chicken_thigh|p|ورك فراخ,وراك فراخ,فخذ فراخ,افخاذ فراخ,ورك دجاج,chicken thigh|209,26,0,10.9|st:c alt:121,19.7,0,4.1
chicken_drumstick|p|درمستيك,ساق فراخ,سيقان فراخ,دبوس فراخ,chicken drumstick,drumstick|172,28.3,0,5.7|st:c
chicken_skin|p|فراخ بالجلد,فرخه بالجلد,صدر فراخ بالجلد,ورك فراخ بالجلد,chicken with skin,roast chicken|239,27.3,0,13.6|st:c alt:215,18.6,0,15.1
chicken_liver|p|كبدة فراخ,كبد فراخ,كبد دجاج,chicken liver|167,24.5,0.9,6.5|st:c alt:119,16.9,0.7,4.8
turkey_breast|p|صدر حبش,صدر ديك رومي,حبش,ديك رومي,turkey breast,turkey|147,30.1,0,2.1|st:c alt:114,23.7,0,1.5
turkey_smoked|p|تركي مدخن,تركي,صدر حبش مدخن,حبش مدخن,ديك رومي مدخن,صدر ديك رومي مدخن,شرايح حبش,شرايح حبش مدخن,تيركي مدخن,smoked turkey,turkey slices,deli turkey|104,17.1,4.2,1.7|slice:25 amb:حبش_مدخن_مقطع_(قيمة_تقريبية_تختلف_بالماركة)
# ===== بروتين: لحوم =====
beef_lean|p|لحم قليل الدهن,لحم بقري قليل الدهن,لحم قليل الدسم,ستيك فيليه,فيليه بقري,اسكالوب بقري,لحم كندوز,كندوز,سيرلوين,تندرلوين,lean beef,sirloin,tenderloin,lean steak|185,30,0,6.5|st:c alt:125,21.5,0,3.9
beef_generic|p|لحم,لحمه,لحم بقري,لحم عجل,لحم احمر,ستيك,beef,steak,meat,red meat|217,26.1,0,11.7|st:c alt:176,20,0,10 amb:محسوب_لحم_بقري_متوسط_الدهن
beef_ground|p|لحم مفروم,مفروم,كفته,كفته لحم,كفته لحمه,كفته بقري,كفته لحم بقري,برجر,برجر لحم,ground beef,minced meat,minced beef,beef burger,burger,kofta|272,25.9,0,17.8|st:c alt:254,17.2,0,20 amb:محسوب_مفروم_٨٠/٢٠
beef_ground_lean|p|لحم مفروم قليل الدهن,مفروم قليل الدهن,لحم مفروم لين,lean ground beef,lean minced beef|175,27.5,0,6.5|st:c alt:137,21.4,0,5 est:1
lamb|p|ضاني,لحم ضاني,خروف,لحم خروف,كباب ضاني,lamb,mutton|206,28.8,0,9.3|st:c est:1
beef_liver|p|كبده,كبدة,كبدة بقري,كبدة عجل,كبد,كبد بقري,beef liver,liver|175,26.5,5.1,4.7|st:c alt:135,20.4,3.9,3.6
# ===== بروتين: أسماك =====
salmon|p|سلمون,سالمون,سمك سلمون,سمك سالمون,salmon|206,22.1,0,12.4|st:c alt:208,20.4,0,13.4
salmon_smoked|p|سلمون مدخن,سالمون مدخن,smoked salmon,lox|117,18.3,0,4.3
tuna_water|p|تونه,تونا,تونا بالماء,تونه بالماء,تونه معلبه,تونه معلبه بالماء,tuna,canned tuna,tuna in water|116,25.5,0,0.8|can:120 amb:تونة_معلبة_بالماء_(بعد_التصفية)
tuna_oil|p|تونه بالزيت,تونه مصفاه زيت,تونا بالزيت,تونا مصفاه زيت,تونه معلبه بالزيت,tuna in oil|198,29.1,0,8.2|can:120
tuna_fresh|p|تونه طازجه,تونه فريش,تونه طازج,tuna steak,fresh tuna|184,29.9,0,6.3|st:c alt:144,23.3,0,4.9
tilapia|p|بلطي,سمك بلطي,تيلابيا,tilapia|128,26.2,0,2.7|st:c alt:96,20.1,0,1.7
seabass|p|قاروص,سمك قاروص,دنيس,سمك دنيس,سي باس,sea bass,seabass,sea bream|124,24.1,0,2.6|st:c alt:97,17.7,0,2.3
whitefish|p|سمك ابيض,فيليه سمك,سمك فيليه,موسي,سمك موسي,كود,سمك كود,cod,white fish,fish fillet,sole|105,22.8,0,0.9|st:c alt:82,17.8,0,0.7
fish_generic|p|سمك,سمكه,fish|128,26.2,0,2.7|st:c alt:96,20.1,0,1.7 amb:محسوب_كسمك_بلطي
sardine|p|سردين,سردين معلب,sardine|208,24.6,0,11.5|amb:سردين_معلب_بالزيت_بعد_التصفية
mullet|p|بوري,سمك بوري,mullet|150,25.7,0,4.9|st:c alt:117,19.4,0,3.8 est:1
mackerel|p|ماكريل,سمك ماكريل,mackerel|262,23.8,0,17.8|st:c alt:205,18.6,0,13.9
shrimp|p|جمبري,جمبري مطبوخ,روبيان,shrimp,prawn|99,24,0.2,0.3|st:c alt:85,20.1,0.2,0.5
crab|p|كابوريا,سلطعون,crab|87,18.1,0,1.1|st:c
# ===== بروتين: بيض =====
egg|p|بيض,بيضه,بيضات,بيضه كامله,egg,whole egg|155,12.6,1.1,10.6|st:c alt:143,12.6,0.7,9.5 pc:50
egg_fried|p|بيضه مقليه,بيض مقلي,بيضات مقليه,fried egg|196,13.6,0.8,14.8|pc:46
egg_white|p|بياض بيض,بياض بيضه,بياض,egg white|52,10.9,0.7,0.2|pc:33
egg_yolk|p|صفار,صفار بيض,صفار بيضه,egg yolk,yolk|322,15.9,3.6,26.5|pc:17
# ===== بروتين: لحوم باردة (سندوتشات) — قيم تقريبية تختلف بالماركة: راجعها بزرار ✎ =====
roast_beef|p|روست بيف,روستو بيف,شرايح روست بيف,روست بيف شرايح,لحم روست بيف,roast beef,deli roast beef|135,20,1.5,5|slice:25 est:1 amb:روست_بيف_مقطع_(قيمة_تقريبية_تختلف_بالماركة)
pastrami|p|بسطرمه,بسطرمة,بسطرمه لحم,pastrami|160,21,1.5,7.5|slice:20 est:1 amb:بسطرمة_(قيمة_تقريبية_تختلف_بالماركة_والتتبيلة)_—_راجعها
luncheon_beef|p|لانشون,لانشون بقري,لانشون لحم,لانشون لحمه,لانشون بيف,luncheon,luncheon meat,beef luncheon|260,12,4,21|slice:25 est:1 amb:لانشون_بقري_(قيمة_تقريبية_تختلف_بالماركة_والنوع)
luncheon_chicken|p|لانشون فراخ,لانشون دجاج,لانشون فرخه,لانشون فراخ مدخن,chicken luncheon,chicken luncheon meat|190,13,6,12|slice:25 est:1 amb:لانشون_فراخ_(قيمة_تقريبية_تختلف_بالماركة)
# ===== بروتين: بقوليات ونباتي =====
ful|p|فول,فول مدمس,فول مسلوق,فول مطبوخ,فول بدون زيت,fava,fava beans,ful medames,foul,ful,broad beans|110,7.6,19.7,0.4|st:c alt:341,26.1,58.3,1.5 cup:170 amb:محسوب_فول_مدمس_سادة_بدون_زيت
ful_oil|p|فول بالزيت,فول بزيت,فول بالزيت والليمون,ful with oil,foul with oil|155,7.2,17.5,6|est:1 cup:170
chickpeas|p|حمص,حمص مسلوق,حمص مطبوخ,حمص حب,chickpea,garbanzo|164,8.9,27.4,2.6|st:c alt:378,20.5,62.9,6 cup:164
hummus|p|حمص بالطحينه,حمص طحينه,hummus|166,7.9,14.3,9.6|tbsp:15
lentils|p|عدس,عدس مسلوق,عدس مطبوخ,عدس اصفر,عدس احمر,عدس ابو جبه,lentil,red lentil|116,9,20.1,0.4|st:c alt:352,24.6,63.4,1.1 cup:198
white_beans|p|فاصوليا بيضاء,فاصوليا بيضا,فاصوليا ناشفه,white beans,navy beans,cannellini|139,9.7,25.1,0.4|st:c cup:179
loobia|p|لوبيا,لوبيا مسلوقه,black eyed peas,cowpeas|116,7.7,20.8,0.5|st:c cup:171
kidney_beans|p|فاصوليا حمراء,كيدني بينز,kidney beans,red beans|127,8.7,22.8,0.5|st:c cup:177
black_beans|p|فاصوليا سوداء,بلاك بينز,black beans|132,8.9,23.7,0.5|st:c cup:172
taameya|p|طعميه,فلافل,falafel,taamiya,tameya|333,13.3,31.8,17.8|pc:25 amb:قرص_الطعمية_٢٥_جم_(تقريبي)_والزيت_داخل_القيمة
tofu|p|توفو,جبنه توفو,tofu|144,17.3,2.8,8.7
edamame|p|ايدامامي,edamame|121,11.9,8.9,5.2|st:c
mung_beans|p|ماش,فاصوليا ماش,مونج,mung beans,mung bean|105,7,19.2,0.4|st:c alt:347,23.9,62.6,1.2 cup:202
pinto_beans|p|فاصوليا بنتو,بنتو,pinto beans,pinto|143,9,26.2,0.7|st:c cup:171
tempeh|p|تمبيه,تيمبيه,تمبي,tempeh|192,20.3,7.6,10.8
whey|p|واي بروتين,واي,بروتين واي,بروتين باودر,بروتين بودره,بروتين,whey,whey protein,protein powder,protein shake,protein|400,80,10,5|scoop:30 amb:واي_بروتين_قيمة_تقريبية_(السكوب_٣٠_جم)_وتختلف_حسب_الماركة
# ===== ألبان =====
milk_whole|d|حليب,لبن,حليب كامل الدسم,لبن كامل الدسم,milk,whole milk,full fat milk|61,3.15,4.8,3.25|d:1.03 amb:محسوب_لبن_كامل_الدسم
milk_low|d|حليب قليل الدسم,لبن قليل الدسم,حليب نصف دسم,لبن نصف دسم,حليب لايت,لبن لايت,حليب دايت,لبن دايت,low fat milk,semi skimmed milk|50,3.3,4.8,2|d:1.03
milk_skim|d|حليب خالي الدسم,لبن خالي الدسم,حليب سكيمد,لبن سكيمد,حليب خالي الدهن,لبن خالي الدهن,skim milk,skimmed milk,nonfat milk,fat free milk|34,3.4,5,0.1|d:1.03
milk_powder|d|حليب بودره,لبن بودره,حليب مجفف,لبن مجفف,نيدو,nido,milk powder,powdered milk|496,26.3,38.4,26.7
milk_powder_skim|d|حليب بودره خالي الدسم,لبن بودره خالي الدسم,حليب بودره سكيمد,skim milk powder,nonfat milk powder|362,36.2,52,0.8
yogurt_whole|d|زبادي,زبادي كامل الدسم,زبادي طبيعي,yogurt,yoghurt,plain yogurt,whole milk yogurt|61,3.5,4.7,3.3|cup:245 amb:محسوب_زبادي_كامل_الدسم
yogurt_low|d|زبادي قليل الدسم,زبادي لايت,زبادي دايت,زبادي نصف دسم,low fat yogurt,light yogurt|63,5.3,7,1.6|cup:245
yogurt_skim|d|زبادي خالي الدسم,زبادي سكيمد,زبادي صفر,nonfat yogurt,fat free yogurt,skim yogurt|56,5.7,7.7,0.2|cup:245
greek|p|زبادي يوناني,زبادي يوناني قليل الدسم,زبادي جريك,جريك يوجرت,يوجرت يوناني,greek yogurt,greek yoghurt,greek|73,9.95,3.94,1.92|cup:245 amb:محسوب_يوناني_قليل_الدسم_(٢٪)
greek_skim|p|زبادي يوناني خالي الدسم,زبادي يوناني سكيمد,زبادي يوناني صفر,جريك خالي الدسم,nonfat greek yogurt,fat free greek yogurt|59,10.2,3.6,0.4|cup:245
greek_full|p|زبادي يوناني كامل الدسم,جريك كامل الدسم,full fat greek yogurt,whole milk greek yogurt|97,9,3.98,5|cup:245
cottage|p|جبنه قريش,قريش,جبنه كوتيدج,كوتيدج,cottage cheese,cottage|72,12.4,2.7,1|cup:226 amb:محسوب_قريش_قليل_الدسم
cottage_full|p|جبنه قريش كامله الدسم,قريش كامل الدسم,creamed cottage cheese|98,11.1,3.4,4.3|cup:226
feta|p|جبنه,جبنه بيضه,جبنه بيضه كامله الدسم,جبنه فيتا,فيتا,جبنه دمياطي,دمياطي,feta,cheese,white cheese,feta cheese,domiati|264,14.2,4.1,21.3|amb:محسوب_جبنة_بيضاء_كاملة_الدسم
white_light|p|جبنه بيضه قليله الدسم,جبنه بيضه لايت,جبنه بيضه دايت,جبنه قليله الدسم,light white cheese,low fat white cheese,low fat feta|170,14,3,11|est:1
rumi|p|جبنه رومي,رومي,romano,roomy cheese|387,31.8,3.6,26.9|amb:محسوب_كجبنة_رومانو_(الرومي_المصري_يختلف)
cheddar|p|شيدر,جبنه شيدر,cheddar,cheddar cheese|403,22.9,3.1,33.3|slice:20
mozzarella|p|موتزاريلا,جبنه موتزاريلا,موزاريلا,mozzarella|300,22.2,2.2,22.4|amb:محسوب_موتزاريلا_كاملة_الدسم
mozzarella_light|p|موتزاريلا قليله الدسم,موتزاريلا لايت,موتزاريلا نصف دسم,part skim mozzarella,light mozzarella,low fat mozzarella|254,24.3,2.8,15.9
cream_cheese|f|جبنه كريمي,كريمي,كريم تشيز,جبنه كريم,cream cheese,philadelphia|342,5.9,4.1,34.2|tbsp:15
triangles|p|جبنه مثلثات,مثلثات,مثلث,جبنه تريانجل,لافاش كيري,kiri,laughing cow,cheese triangles,processed cheese|250,11,7,19|pc:18 est:1
halloumi|p|حلومي,جبنه حلومي,halloumi|321,21,2.6,25|est:1
parmesan|p|بارميزان,جبنه بارميزان,parmesan|392,35.8,3.2,25.8
ricotta|p|ريكوتا,جبنه ريكوتا,ricotta|174,11.3,3,13
gouda|p|فلمنك,جبنه فلمنك,جودا,gouda|356,25,2.2,27.4|slice:20
labneh|p|لبنه,labneh,labne|170,7,4,14|est:1
white_lowsalt|p|جبنه بيضه قليله الملح,جبنه بيضا قليله الملح,جبنه بيضه قليلة الملح,جبنه بيضه دايت ملح,جبنه بيضه لو سولت,low salt white cheese,low sodium feta|250,14,3.5,20|est:1 amb:جبنة_بيضاء_قليلة_الملح_(قيمة_تقريبية_تختلف_بالماركة)
soy_milk|d|حليب صويا,لبن صويا,soy milk,soymilk|33,2.8,1.7,1.6|d:1.03
almond_milk|d|حليب لوز,لبن لوز,almond milk|15,0.6,0.6,1.2|d:1
oat_milk|d|حليب شوفان,لبن شوفان,oat milk|46,1,6.7,1.5|d:1.03 amb:حليب_شوفان_غير_محلى_(يختلف_بالماركة)
# ===== نشويات =====
baladi|s|خبز بني,عيش بني,رغيف بني,خبز بلدي قمح كامل,عيش بلدي قمح كامل,رغيف بلدي قمح كامل,رغيف قمح كامل,عيش بلدي,عيش بر,خبز بر,رغيف بر,رغيف بلدي,خبز بلدي,عيش بلدي بر,رغيف عيش بلدي,رغيف عيش بر,عيش اسمر,رغيف اسمر,عيش,خبز,رغيف,رغيف عيش,baladi bread,whole wheat baladi,whole wheat pita,pita bread,bread,رغيف خبز بر,رغيف خبز بلدي,رغيف خبز اسمر,رغيف خبز بني,رغيف خبز بلدي بر,نص رغيف خبز بر|266,9.8,55,1.7|pc:100 amb:رغيف_بلدي_١٠٠_جم_(تقريبي)_—_اكتب_بالجرام_لو_مختلف
shami|s|عيش شامي,رغيف شامي,خبز شامي,شامي,white pita,lebanese bread,syrian bread|275,9.1,55.7,1.2|pc:70 amb:رغيف_شامي_٧٠_جم_(تقريبي)
fino|s|فينو,عيش فينو,رغيف فينو,خبز فينو,fino,fino bread|266,8.9,49.2,3.3|pc:65 amb:رغيف_فينو_٦٥_جم_(تقريبي)
toast_white|s|توست,توست ابيض,خبز توست,عيش توست,خبز ابيض,عيش ابيض,شريحه توست,white bread,toast,sandwich bread|266,8.9,49.2,3.3|slice:30 pc:30 amb:شريحة_التوست_٣٠_جم
toast_wheat|s|توست بني,عيش توست بني,خبز توست بني,خبز قمح كامل,عيش قمح كامل,شرايح قمح كامل,توست بر,توست اسمر,خبز توست بر,عيش توست بر,توست قمح كامل,خبز اسمر,whole wheat bread,brown bread,whole grain bread,whole wheat toast|252,12.4,42.7,3.5|slice:30 pc:30 amb:شريحة_التوست_٣٠_جم
rice_cake|s|رايس كيك,كيك الارز,بسكويت الارز,rice cake|387,8.2,81.5,2.8|pc:9
oats|s|شوفان,اوتس,اوتمل,oat,oatmeal,rolled oats,porridge oats|379,13.2,67.7,6.5|st:r alt:71,2.5,12,1.5 tbsp:10 cup:81 amb:شوفان_جاف_(الملعقة_١٠_جم)_—_اكتب_مطبوخ_لو_بعد_الطبخ
cornflakes|s|كورن فليكس,كورنفليكس,كورن فلاكس,رقايق الذره,cornflake,corn flakes|357,7.5,84.1,0.4|cup:28 tbsp:5 amb:ملعقة_كورن_فليكس_٥_جم_(تقريبي)
rice_white|s|رز,ارز,رز ابيض,ارز ابيض,رز مطبوخ,ارز مطبوخ,رز مصري,ارز مصري,white rice,rice,basmati,basmati rice,jasmine rice|130,2.7,28.2,0.3|st:c alt:365,7.1,80,0.7 cup:158 amb:رز_مطبوخ_—_اكتب_ني_لو_الوزن_قبل_الطبخ
rice_brown|s|رز بني,ارز بني,رز بر,ارز بر,رز اسمر,ارز اسمر,brown rice|123,2.7,25.6,1|st:c alt:370,7.9,77.2,2.9 cup:195
pasta|s|مكرونه,باستا,اسباجتي,سباجتي,مكرونه ساده,مكرونه مسلوقه,مكرونه مطبوخه,مكرونه بنا,مكرونه قلم,spaghetti,pasta,macaroni,penne,noodle|158,5.8,30.9,0.9|st:c alt:371,13,74.7,1.5 cup:140 amb:مكرونة_مسلوقة_—_اكتب_ني_لو_الوزن_قبل_السلق
pasta_ww|s|مكرونه بر,مكرونه قمح كامل,مكرونه اسمر,باستا بر,whole wheat pasta,whole wheat spaghetti|124,5.3,26.5,0.5|st:c cup:140
couscous|s|كسكسي,كسكس,couscous|112,3.8,23.2,0.2|st:c alt:376,12.8,77.4,0.6 cup:157
bulgur|s|برغل,bulgur,bulgur wheat|83,3.1,18.6,0.2|st:c alt:342,12.3,75.9,1.3 cup:182
quinoa|s|كينوا,quinoa|120,4.4,21.3,1.9|st:c alt:368,14.1,64.2,6.1 cup:185
barley|s|شعير,شعير مقشر,شعير لؤلؤي,barley,pearl barley|123,2.3,28.2,0.4|st:c alt:352,9.9,77.7,1.2 cup:157
buckwheat|s|قمح سراسين,حنطه سوداء,بكويت,buckwheat,kasha|92,3.4,19.9,0.6|st:c alt:343,13.3,71.5,3.4 cup:168
millet|s|دخن,millet|119,3.5,23.7,1|st:c alt:378,11,72.8,4.2 cup:174
potato|s|بطاطس,بطاطس مسلوقه,potato,boiled potato|87,1.9,20.1,0.1|st:c alt:77,2,17.5,0.1 pc:170 amb:حبة_بطاطس_١٧٠_جم_(تقريبي)
potato_baked|s|بطاطس مشويه,بطاطس فرن,بطاطس في الفرن,baked potato,roasted potato|93,2.5,21.2,0.1|pc:170
fries|s|بطاطس مقليه,بطاطس محمره,french fries,fries|312,3.4,41.4,14.8|amb:تقريبي_حسب_طريقة_القلي
sweet_potato|s|بطاطا,بطاطه,بطاطا حلوه,بطاطس حلوه,بطاطا مشويه,sweet potato|90,2,20.7,0.2|st:c alt:86,1.6,20.1,0.1 pc:130 amb:حبة_بطاطا_١٣٠_جم_(تقريبي)
sweet_potato_boiled|s|بطاطا مسلوقه,boiled sweet potato|76,1.4,17.7,0.1|pc:130
corn|s|ذره,ذره مسلوقه,كوز ذره,ذره حلوه,حبوب الذره,corn,sweet corn|96,3.4,21,1.5|st:c cup:164 pc:100 amb:كوز_الذرة_١٠٠_جم_حبوب_(تقريبي)
peas|s|بسله,بازلاء,بسله مطبوخه,green peas,pea|84,5.4,15.6,0.2|st:c cup:160
popcorn|s|فشار,بوشار,popcorn|387,12.9,77.8,4.5|cup:8
flour_white|s|دقيق,دقيق ابيض,طحين,flour,white flour,all purpose flour|364,10.3,76.3,1|tbsp:8
flour_ww|s|دقيق اسمر,دقيق قمح كامل,دقيق بر,whole wheat flour|340,13.2,72,2.5|tbsp:8
breadcrumbs|s|بقسماط,بقصماط,breadcrumb|395,13.4,72,5.3
koshary|s|كشري,koshari,koshary,kushari|170,5,30,3|est:1 bowl:350
# ===== خضار =====
tomato|v|طماطم,طماطه,قوطه,tomato|18,0.9,3.9,0.2|pc:120 cup:180
cucumber|v|خيار,خيارة,cucumber|15,0.7,3.6,0.1|pc:100 cup:104
lettuce|v|خس,خس رومين,خس رومانو,خس ايسبرج,lettuce,romaine,iceberg|17,1.2,3.3,0.3|cup:47
arugula|v|جرجير,rocket,arugula|25,2.6,3.7,0.7|cup:20
spinach|v|سبانخ,spinach|23,2.9,3.6,0.4
cabbage|v|كرنب,ملفوف,cabbage|25,1.3,5.8,0.1|cup:89
cabbage_red|v|كرنب احمر,red cabbage|31,1.4,7.4,0.2|cup:89
broccoli|v|بروكلي,بروكولي,broccoli|34,2.8,6.6,0.4|st:r alt:35,2.4,7.2,0.4
cauliflower|v|قرنبيط,قنبيط,كرنب مزهر,cauliflower|25,1.9,5,0.3|st:r alt:23,1.8,4.1,0.5
carrot|v|جزر,carrot|41,0.9,9.6,0.2|st:r alt:35,0.8,8.2,0.2 pc:61
zucchini|v|كوسه,زوكيني,zucchini,courgette|17,1.2,3.1,0.3|st:r alt:15,1.1,2.7,0.4
eggplant|v|باذنجان,بيذنجان,eggplant,aubergine|25,1,5.9,0.2|st:r alt:35,0.8,8.7,0.2
pepper_green|v|فلفل اخضر,فلفل رومي,فلفل حلو,فلفل اخضر رومي,green pepper,bell pepper,capsicum|20,0.9,4.6,0.2|pc:120
pepper_red|v|فلفل احمر,فلفل الوان,فلفل ملون,فلفل اصفر,red pepper,red bell pepper,yellow pepper|31,1,6,0.3|pc:119
onion|v|بصل,بصله,onion|40,1.1,9.3,0.1|pc:110 cup:160
garlic|v|ثوم,فص ثوم,garlic|149,6.4,33.1,0.5|pc:3
mushroom|v|مشروم,عيش غراب,فطر,mushroom|22,3.1,3.3,0.3|cup:70
okra|v|بامبه,بامبا,بامياء,بامي,okra|22,1.9,4.5,0.2|st:c alt:33,1.9,7.5,0.2
molokhia|v|ملوخيه,molokhia,jute leaves,mulukhiyah|34,4.65,5.8,0.25|est:1 amb:ملوخية_خام_—_المطبوخة_بالمرق_والزيت_أعلى_سعرات
green_beans|v|فاصوليا,فاصوليا خضراء,فاصوليا خضرا,green beans,string beans|31,1.8,7,0.2|st:r alt:35,1.9,7.9,0.3
beetroot|v|بنجر,شمندر,beetroot,beet|43,1.6,9.6,0.2|st:r alt:44,1.7,10,0.2
radish|v|فجل,radish|16,0.7,3.4,0.1
turnip|v|لفت,turnip|28,0.9,6.4,0.1
celery|v|كرفس,celery|14,0.7,3,0.2
asparagus|v|هليون,اسباراجس,asparagus|20,2.2,3.9,0.1
pumpkin|v|قرع,قرع عسلي,pumpkin|26,1,6.5,0.1
artichoke|v|خرشوف,artichoke|53,2.9,11.9,0.2|st:c
leek|v|كرات,كرات ابو شعره,leek|61,1.5,14.2,0.3
kale|v|كيل,كرنب اجعد,kale|35,2.9,4.4,1.5
parsley|v|بقدونس,parsley|36,3,6.3,0.8
lemon|v|ليمون,ليمونه,lemon|29,1.1,9.3,0.3|pc:58
lemon_juice|v|عصير ليمون,عصير ليمونه,lemon juice|22,0.4,6.9,0.2|d:1.03
pickles|v|مخلل,خيار مخلل,مخلل خيار,مخللات,pickles,pickled cucumber,pickle|11,0.3,2.3,0.2
veg_mixed|v|خضار,خضروات,خضار مشكل,خضروات مشكله,mixed vegetables,vegetables,veggies|35,1.9,7,0.3|est:1 bowl:100 amb:خضار_مشكل_بدون_زيت_(تقديري)
salad|v|سلطه,سلطه خضراء,سلطه خضار,salad,green salad,mixed salad|20,1,4,0.2|est:1 bowl:200 amb:سلطة_خضراء_بدون_زيت_(تقديري)
# ===== فاكهة =====
banana|fr|موز,موزه,banana|89,1.1,22.8,0.3|pc:118 amb:موزة_١١٨_جم_(صافي_بدون_القشر)
apple|fr|تفاح,تفاحه,apple|52,0.3,13.8,0.2|pc:182
orange|fr|برتقال,برتقاله,orange|47,0.9,11.8,0.1|pc:131
mandarin|fr|يوسفي,مندرين,mandarin,tangerine,clementine|53,0.8,13.3,0.3|pc:88
grapefruit|fr|جريب فروت,grapefruit|42,0.8,10.7,0.1
grapes|fr|عنب,grape|69,0.7,18.1,0.2|cup:151
strawberry|fr|فراوله,strawberry|32,0.7,7.7,0.3|cup:152 pc:12
blueberry|fr|توت ازرق,بلو بيري,blueberry|57,0.7,14.5,0.3|cup:148
raspberry|fr|توت احمر,راسبيري,raspberry|52,1.2,11.9,0.7|cup:123
mulberry|fr|توت,توت شجر,mulberry|43,1.4,9.8,0.4|cup:140
watermelon|fr|بطيخ,بطيخه,watermelon|30,0.6,7.6,0.2|cup:152
cantaloupe|fr|شمام,كانتالوب,cantaloupe,melon|34,0.8,8.2,0.2|cup:160
mango|fr|مانجو,مانجا,mango|60,0.8,15,0.4|cup:165
pineapple|fr|اناناس,pineapple|50,0.5,13.1,0.1|cup:165
peach|fr|خوخ,خوخه,peach|39,0.9,9.5,0.3|pc:150
apricot|fr|مشمش,apricot|48,1.4,11.1,0.4|pc:35
plum|fr|برقوق,plum|46,0.7,11.4,0.3|pc:66
pear|fr|كمثري,pear|57,0.4,15.2,0.1|pc:178
kiwi|fr|كيوي,kiwi|61,1.1,14.7,0.5|pc:69
pomegranate|fr|رمان,رمانه,pomegranate|83,1.7,18.7,1.2|cup:174
fig_fresh|fr|تين,تين طازج,تينه,fig,fresh fig|74,0.8,19.2,0.3|pc:50
fig_dried|fr|تين مجفف,dried fig|249,3.3,63.9,0.9
guava|fr|جوافه,guava|68,2.6,14.3,1|pc:90
cherry|fr|كريز,كرز,cherry|63,1.1,16,0.2|cup:138
prickly_pear|fr|تين شوكي,prickly pear|41,0.7,9.6,0.5|pc:103
papaya|fr|بابايا,papaya|43,0.5,10.8,0.3|cup:145
persimmon|fr|كاكا,persimmon|70,0.6,18.6,0.2|pc:168
raisins|fr|زبيب,raisin|299,3.1,79.2,0.5|tbsp:9
dried_apricot|fr|قمر الدين,مشمش مجفف,dried apricot|241,3.4,62.6,0.5
prunes|fr|برقوق مجفف,prune,dried plum|240,2.2,63.9,0.4
dates|fr|تمر,بلح,تمره,بلحه,date|282,2.5,75,0.4|pc:8 amb:تمرة_٨_جم_(تقريبي)
dates_medjool|fr|تمر مجدول,مجدول,medjool,medjool date|277,1.8,75,0.2|pc:24
juice_generic|fr|عصير بدون سكر,عصير طبيعي بدون سكر,عصير طبيعي,عصير,عصير فواكه,عصير فاكهه,juice,fruit juice|45,0.5,10.5,0.1|d:1.04 est:1 cup:240 amb:عصير_فواكه_بدون_سكر_(تقديري)_—_اكتب_نوع_العصير_لو_عايز_دقة
orange_juice|fr|عصير برتقال,orange juice|45,0.7,10.4,0.2|d:1.04
apple_juice|fr|عصير تفاح,apple juice|46,0.1,11.3,0.1|d:1.04
# ===== دهون =====
olive_oil|f|زيت زيتون,olive oil,evoo,extra virgin olive oil|884,0,0,100|tbsp:13.5 tsp:4.5 d:0.91
veg_oil|f|زيت,زيت نباتي,زيت ذره,زيت عباد الشمس,زيت كانولا,زيت طبخ,زيت قلي,زيت سمسم,oil,vegetable oil,corn oil,sunflower oil,canola oil,sesame oil|884,0,0,100|tbsp:13.6 tsp:4.5 d:0.92
coconut_oil|f|زيت جوز الهند,زيت جوز هند,coconut oil|862,0,0,100|tbsp:13.6 tsp:4.5 d:0.92
butter|f|زبده,butter|717,0.9,0.1,81.1|tbsp:14.2 tsp:4.7
ghee|f|سمن,سمن بلدي,سمن بقري,ghee,clarified butter|876,0.3,0,99.5|tbsp:13 tsp:4.3
veg_ghee|f|سمنه,سمنه نباتي,سمن نباتي,vegetable ghee,margarine|884,0,0,100|tbsp:13 tsp:4.3 est:1
tahini|f|طحينه,tahini,tahina|595,17,21.2,53.8|tbsp:15 tsp:5
mayo|f|مايونيز,مايونيزا,mayonnaise,mayo|680,1,0.6,74.9|tbsp:13.8 tsp:4.6
cream_heavy|f|كريمه,كريمه طبخ,heavy cream,whipping cream,cream|340,2.8,2.8,36.1|d:1
peanut_butter|f|زبده فول سوداني,زبده الفول السوداني,بينت بتر,peanut butter,pb|588,25.1,20,50.4|tbsp:16 tsp:5.3
almond_butter|f|زبده اللوز,زبده لوز,almond butter|614,21,18.8,55.5|tbsp:16
avocado|f|افوكادو,افوكاتو,avocado|160,2,8.5,14.7|pc:136 tbsp:15 tsp:5
olives|f|زيتون,زيتون اخضر,olive,green olive|145,1,3.8,15.3|pc:4 amb:زيتون_أخضر
olives_black|f|زيتون اسود,black olive,ripe olive|115,0.8,6.3,10.7|pc:4
coconut|f|جوز هند,coconut,fresh coconut|354,3.3,15.2,33.5
almond|f|لوز,لوز محمص,almond|579,21.2,21.6,49.9|pc:1.2 handful:30
walnut|f|عين جمل,جوز,walnut|654,15.2,13.7,65.2|pc:4 handful:30
cashew|f|كاجو,cashew|553,18.2,30.2,43.9|pc:1.6 handful:30
pistachio|f|فستق,فستق حلبي,pistachio|560,20.2,27.2,45.3|handful:30
hazelnut|f|بندق,hazelnut|628,15,16.7,60.8|pc:1.4 handful:30
peanut|f|فول سوداني,سوداني,فستق سوداني,peanut|567,25.8,16.1,49.2|handful:30
pecan|f|بيكان,pecan|691,9.2,13.9,72|handful:30
macadamia|f|ماكاداميا,macadamia|718,7.9,13.8,75.8|handful:30
brazil_nut|f|جوز برازيلي,brazil nut|659,14.3,12.3,67.1|pc:5
pine_nut|f|صنوبر,pine nut|673,13.7,13.1,68.4
sunflower|f|لب عباد الشمس,بذور عباد الشمس,sunflower seed|584,20.8,20,51.5
pumpkin_seeds|f|لب قرع,بذور القرع,pumpkin seed|559,30.2,10.7,49.1
sesame|f|سمسم,sesame,sesame seed|573,17.7,23.5,49.7|tbsp:9
flax|f|بذور الكتان,كتان,بذر الكتان,flax,flaxseed,flax seed|534,18.3,28.9,42.2|tbsp:10.3
chia|f|شيا,بذور الشيا,chia,chia seed|486,16.5,42.1,30.7|tbsp:12
mixed_nuts|f|مكسرات,مكسرات مشكله,ميكس مكسرات,mixed nut,nut|607,20,21,54|handful:30 amb:مكسرات_مشكلة_(تختلف_حسب_الخليط)
# ===== أخرى =====
honey|o|عسل,عسل نحل,عسل ابيض,honey,bee honey|304,0.3,82.4,0|tbsp:21 tsp:7
molasses|o|عسل اسود,molasses,black honey|290,0,74.7,0.1|tbsp:20 tsp:6.7
sugar|o|سكر,سكر ابيض,sugar,white sugar|387,0,100,0|tsp:4.2 tbsp:12.6
brown_sugar|o|سكر بني,brown sugar|380,0.1,98.1,0|tsp:4.6 tbsp:13.8
jam|o|مربي,جيلي,jam,jelly,marmalade|278,0.4,68.9,0.1|tbsp:20 tsp:6.7
halawa|o|حلاوه طحينيه,حلاوه,halawa,halva,halvah|469,12.5,50.9,21.5
nutella|o|نوتيلا,نوتيلا شوكولاته,nutella,chocolate spread|539,6.3,57.5,30.9|tbsp:18.5 tsp:6.2
chocolate_dark|o|شوكولاته داكنه,دارك شوكولاته,شيكولاته داكنه,dark chocolate|598,7.8,45.9,42.6
chocolate_milk|o|شوكولاته,شيكولاته,milk chocolate,chocolate|535,7.7,59.4,29.7
chips|o|شيبسي,رقايق بطاطس,بطاطس شيبس,chip,potato chip,crisp|536,7,52.9,34.6
ketchup|o|كاتشب,ketchup,catsup|101,1,25.8,0.1|tbsp:17 tsp:5.7
cola|o|كولا,بيبسي,كوكاكولا,مشروب غازي,cola,pepsi,coca cola,coke,soda,soft drink|41,0,10.6,0|d:1
zero|o|ملح,فلفل اسود,فلفل,بهارات,كمون,كزبره,قرفه,خل,ما,ميه,مياه,مي,قهوه,قهوه ساده,شاي,شاي اخضر,ستيفيا,سكر دايت,ساخرين,سويتنر,نعناع,ينسون,salt,pepper,black pepper,spice,cumin,cinnamon,vinegar,water,coffee,tea,green tea,stevia,sweetener,mint,herb|0,0,0,0|zero:1
`;
if(typeof module!=="undefined"&&module.exports)module.exports=NX_DB;
