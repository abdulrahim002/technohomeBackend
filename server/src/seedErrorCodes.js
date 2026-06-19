/**
 * seedErrorCodes.js
 * ============================================================
 * سكريبت تلقائي لملء قاعدة البيانات بأكواد الأعطال الشائعة
 * لأشهر الأجهزة المنزلية والماركات العالمية
 *
 * طريقة التشغيل من مجلد server:
 *   node src/seedErrorCodes.js
 * ============================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');

const ApplianceType = require('./models/ApplianceType.model');
const Brand        = require('./models/Brand.model');
const ErrorCode    = require('./models/ErrorCode.model');

// ============================================================
// قاعدة بيانات أكواد الأعطال (المحتوى الكامل)
// ============================================================
// الهيكل: { deviceName, brandName, codes: [{ code, description, actionStep }] }

const ERROR_CODES_DATA = [

  // =====================================================================
  // مكيف هواء (Air Conditioner) - سامسونج
  // =====================================================================
  {
    deviceName: 'Air Conditioner',
    brandName: 'Samsung',
    codes: [
      {
        code: 'E1',
        description: 'عطل في مستشعر درجة حرارة الغرفة (Indoor Temperature Sensor Error) - يعني الجهاز لا يستطيع قراءة حرارة الغرفة بشكل صحيح.',
        actionStep: 'تأكد أن فلتر الهواء نظيف وغير مسدود. إذا استمر العطل، يحتاج الجهاز لاستبدال مستشعر الحرارة من قِبل فني متخصص.'
      },
      {
        code: 'E2',
        description: 'عطل في مستشعر درجة حرارة المبخر (Evaporator Temperature Sensor Error) - تجمد محتمل أو ماس كهربائي في مستشعر المبخر.',
        actionStep: 'أوقف تشغيل المكيف لمدة 30 دقيقة ثم أعد تشغيله. إذا ظهر الكود مجدداً، اتصل بفني لفحص المستشعر.'
      },
      {
        code: 'E3',
        description: 'عطل في مستشعر درجة حرارة أنبوب التبريد (Pipe Temperature Sensor Error).',
        actionStep: 'تحقق من عدم وجود تسريب غاز التبريد، وتأكد من نظافة وحدة الخارجية. احجز فني للفحص الشامل.'
      },
      {
        code: 'E4',
        description: 'ارتفاع في ضغط التبريد عند الضاغط (High Pressure Error) - قد يكون بسبب انسداد أو تسريب غاز.',
        actionStep: 'لا تقم بتشغيل الجهاز. أوقفه فوراً واتصل بفني صيانة لفحص نظام التبريد وضبط مستوى الغاز.'
      },
      {
        code: 'E5',
        description: 'تجاوز التيار الكهربائي للضاغط (Overload/Overcurrent of Compressor) - حمل زائد على المحرك.',
        actionStep: 'تحقق من أن مصدر الكهرباء مستقر وخال من الانقطاعات. إذا تكرر الكود، استبدل الضاغط مع فني متخصص.'
      },
      {
        code: 'E6',
        description: 'خطأ في اتصال الوحدة الداخلية بالخارجية (Communication Error) - انقطاع في الأسلاك أو بروتوكول الاتصال.',
        actionStep: 'تحقق من سلامة الأسلاك الرابطة بين الوحدتين الداخلية والخارجية. قد تكون متأكلة أو مقطوعة.'
      },
      {
        code: 'F1',
        description: 'عطل في مروحة الوحدة الداخلية (Indoor Fan Error) - المروحة بطيئة أو متوقفة.',
        actionStep: 'تحقق من وجود أجسام غريبة تعيق مروحة الوحدة الداخلية. احجز فني لفحص محرك المروحة.'
      },
      {
        code: 'F3',
        description: 'عطل في مروحة الوحدة الخارجية (Outdoor Fan Error) - قد يؤدي لارتفاع الحرارة وتوقف الجهاز.',
        actionStep: 'تحقق من سلامة مروحة الوحدة الخارجية وعدم وجود ما يعيقها. استدعِ فني لتبديل محرك المروحة إذا لزم.'
      },
      {
        code: 'P1',
        description: 'ضعف ولتاج مصدر الكهرباء أو تذبذبه (Low Voltage / Power Supply Error).',
        actionStep: 'تأكد من أن الفلتر الكهربائي أو المنظم (UPS) يعمل بكفاءة. استشر كهربائياً إذا كانت المشكلة في الشبكة المنزلية.'
      },
      {
        code: 'P5',
        description: 'حماية من الفولتية العالية (High Voltage Protection) - الجهاز يحمي نفسه من تيار زائد.',
        actionStep: 'استخدم جهاز منظم كهرباء (Stabilizer) مناسب. لا تشغّل المكيف مباشرة حتى تستقر الكهرباء.'
      }
    ]
  },

  // =====================================================================
  // مكيف هواء (Air Conditioner) - إل جي
  // =====================================================================
  {
    deviceName: 'Air Conditioner',
    brandName: 'LG',
    codes: [
      {
        code: 'CH01',
        description: 'عطل مستشعر درجة حرارة الغرفة الداخلية (Indoor Room Sensor Error).',
        actionStep: 'نظف الفلتر جيداً وتأكد من عدم إعاقة الهواء. إذا استمر الكود اتصل بفني لاستبدال المستشعر.'
      },
      {
        code: 'CH02',
        description: 'عطل مستشعر درجة حرارة المبخر (Indoor Pipe Sensor Error).',
        actionStep: 'أوقف الجهاز 30 دقيقة ثم أعد تشغيله. إذا ظهر الكود مجدداً يلزم تغيير المستشعر من قبل فني.'
      },
      {
        code: 'CH03',
        description: 'عطل مستشعر درجة حرارة الوحدة الخارجية (Outdoor Temp Sensor Error).',
        actionStep: 'تحقق من الوحدة الخارجية وتأكد أنها نظيفة وبعيدة عن مصادر الحرارة.'
      },
      {
        code: 'CH04',
        description: 'عطل مستشعر تدفق الغاز في الخارج (Outdoor Pipe Sensor Error).',
        actionStep: 'احجز فني صيانة لفحص أنابيب التبريد وقياس ضغط الغاز.'
      },
      {
        code: 'CH10',
        description: 'خطأ في الاتصال بين الوحدتين (Communication Error).',
        actionStep: 'تحقق من جميع التوصيلات الكهربائية بين الوحدة الداخلية والخارجية، وتأكد من عدم وجود سلك مقطوع.'
      },
      {
        code: 'CH22',
        description: 'محدودية في دوران ضاغط (Compressor Failure) - احتمال عطل الكمبريسور.',
        actionStep: 'أوقف الجهاز فوراً وتجنب التشغيل للحفاظ على المحرك. اتصل بفني متخصص لصيانة الضاغط.'
      },
      {
        code: 'CH38',
        description: 'انحراف في وظيفة المروحة الخارجية (Outdoor Fan Motor Error).',
        actionStep: 'تحقق من وجود عوائق أمام المروحة الخارجية. استدعِ فني لفحص وصيانة محرك المروحة.'
      },
      {
        code: 'CH53',
        description: 'تشبع سعة التكثيف - ارتفاع ضغط سائل التبريد (High Pressure Trip).',
        actionStep: 'نظف المكثف الخارجي (Condenser) جيداً. تأكد من وجود تدفق هواء كافٍ حول الوحدة الخارجية.'
      },
      {
        code: 'CH67',
        description: 'انخفاض مستوى غاز التبريد (Low Refrigerant Pressure / Gas Leak).',
        actionStep: 'لا تشغّل الجهاز. احجز فني متخصص لفحص نقاط التسريب وإعادة شحن الغاز.'
      }
    ]
  },

  // =====================================================================
  // مكيف هواء - جري (Gree)
  // =====================================================================
  {
    deviceName: 'Air Conditioner',
    brandName: 'Gree',
    codes: [
      {
        code: 'E1',
        description: 'ارتفاع ضغط التبريد الخارجي (High Pressure Protection) - توقف الضاغط تلقائياً.',
        actionStep: 'تأكد من نظافة الوحدة الخارجية وخلوها من الأتربة. إذا استمر العطل، احجز فنياً لضبط مستوى الغاز.'
      },
      {
        code: 'E2',
        description: 'وقاية ضد التجمد (Freeze Protection) - اكتشاف تجمد المبخر الداخلي.',
        actionStep: 'أوقف التكييف وشغّل وضع المروحة فقط لساعة حتى يذوب الجليد، ثم أعد التشغيل.'
      },
      {
        code: 'E3',
        description: 'انخفاض ضغط سائل التبريد (Low Pressure Protection) - احتمال وجود تسريب غاز.',
        actionStep: 'لا تشغّل الجهاز وأغلق الكهرباء. احجز فني متخصص لفحص تسريب الغاز فوراً.'
      },
      {
        code: 'E4',
        description: 'حماية من ارتفاع درجة حرارة الخارج (High Discharge Temperature Protection).',
        actionStep: 'أوقف الجهاز لمدة ساعة. تحقق من سلامة المروحة الخارجية وتوفر التهوية الجيدة.'
      },
      {
        code: 'E6',
        description: 'انقطاع الاتصال بين الوحدتين (Communication Failure).',
        actionStep: 'تحقق من الأسلاك الرابطة بين الوحدتين واستبدل أي سلك متلف.'
      },
      {
        code: 'F1',
        description: 'عطل مستشعر حرارة داخلي (Indoor Temperature Sensor Fault).',
        actionStep: 'أعد تشغيل الجهاز. إذا استمر العطل، يحتاج الاستبدال من فني.'
      },
      {
        code: 'F2',
        description: 'عطل مستشعر حرارة خارجي (Outdoor Temperature Sensor Fault).',
        actionStep: 'تحقق من التوصيلات في الوحدة الخارجية وتأكد من سلامة المستشعر.'
      },
      {
        code: 'H5',
        description: 'حماية من التحميل الزائد (Module Protection) - ارتفاع حرارة المكثفات الإلكترونية.',
        actionStep: 'أوقف الجهاز فوراً لمدة 30 دقيقة. تأكد من وجود تهوية مناسبة حول الوحدة الخارجية.'
      }
    ]
  },

  // =====================================================================
  // ثلاجة (Refrigerator) - سامسونج
  // =====================================================================
  {
    deviceName: 'Refrigerator',
    brandName: 'Samsung',
    codes: [
      {
        code: '1E',
        description: 'عطل في مستشعر حرارة المبخر (Freezer Sensor Error) - خلل في قراءة درجة حرارة الفريزر.',
        actionStep: 'افتح الثلاجة وتحقق من عدم وجود جليد متراكم على المستشعر. قم بإذابة الجليد وأعد التشغيل.'
      },
      {
        code: '2E',
        description: 'عطل في مستشعر حرارة القسم الرئيسي للثلاجة (Fridge Compartment Sensor Error).',
        actionStep: 'أوقف الثلاجة لمدة ساعتين للإذابة الكاملة ثم أعد التشغيل. إذا تكرر، استبدل المستشعر مع فني.'
      },
      {
        code: '5E',
        description: 'عطل في مستشعر المبيد الخارجي (Defrost Sensor Error) - خلل في نظام إزالة الجليد.',
        actionStep: 'أعد ضبط الثلاجة عن طريق فصلها عن الكهرباء لـ5 دقائق. إذا استمر احجز فني.'
      },
      {
        code: '8E',
        description: 'عطل في مستشعر الرطوبة (Ice Maker Sensor Error).',
        actionStep: 'تحقق من صنبور الماء المتصل بصانع الثلج وتأكد أنه مفتوح. احجز فني إذا استمر الكود.'
      },
      {
        code: '14E',
        description: 'عطل في نظام الاتصال الداخلي (Control Board Communication Error).',
        actionStep: 'افصل الثلاجة عن الكهرباء لـ10 دقائق ثم أعد التشغيل. إذا استمر، يلزم تغيير بورد التحكم.'
      },
      {
        code: 'OF OF',
        description: 'الثلاجة في وضع العرض (Demo/Store Mode) - التبريد معطل عمداً.',
        actionStep: 'اضغط مع الاستمرار على زري Power Freeze و Power Cool معاً لمدة 3 ثوانٍ لإلغاء وضع العرض.'
      },
      {
        code: 'PC ER',
        description: 'خطأ في الاتصال بين لوحتي التحكم (PCB Communication Error).',
        actionStep: 'افصل الثلاجة من الكهرباء لـ5 دقائق. إذا تكرر العطل يلزم صيانة اللوحة الإلكترونية.'
      }
    ]
  },

  // =====================================================================
  // ثلاجة (Refrigerator) - إل جي
  // =====================================================================
  {
    deviceName: 'Refrigerator',
    brandName: 'LG',
    codes: [
      {
        code: 'ER-FS',
        description: 'عطل في مستشعر حرارة الفريزر (Freezer Sensor Error).',
        actionStep: 'أوقف الثلاجة وتحقق من تراكم الجليد على المستشعر. أجرِ دفروست كامل ثم أعد التشغيل.'
      },
      {
        code: 'ER-RS',
        description: 'عطل في مستشعر حرارة قسم التبريد (Refrigerator Sensor Error).',
        actionStep: 'نفّذ إعادة ضبط بإيقاف الثلاجة لـ5 دقائق. إذا استمر الكود، احجز فني.'
      },
      {
        code: 'ER-AS',
        description: 'عطل في المستشعر الجوي للوحدة الخارجية (Ambient Sensor Error).',
        actionStep: 'تأكد من توفر التهوية الكافية حول الثلاجة وعدم تعرضها للحرارة المباشرة.'
      },
      {
        code: 'ER-DS',
        description: 'عطل في مستشعر إزالة الجليد (Defrost Sensor Error).',
        actionStep: 'أجرِ دفروست يدوي كامل بإيقاف الثلاجة ليوم كامل. إذا تكرر استبدل المستشعر مع فني.'
      },
      {
        code: 'ER-CO',
        description: 'عطل في الاتصال بين وحدة التحكم الرئيسية (Control Board Error).',
        actionStep: 'افصل الكهرباء لـ10 دقائق ثم أعد التشغيل. إذا استمر يلزم تبديل بورد التحكم.'
      },
      {
        code: 'CL',
        description: 'تنبيه قفل الأطفال (Child Lock) - الضبط مقفل.',
        actionStep: 'اضغط مع الاستمرار على زر Ice Plus لـ3 ثوانٍ لإلغاء القفل.'
      },
      {
        code: 'ER-DH',
        description: 'عطل في نظام إزالة الجليد (Defrost Heater Error) - سخان إزالة الجليد لا يعمل.',
        actionStep: 'أجرِ دفروست يدوي كامل. إذا تكرر العطل يلزم استبدال سخان إزالة الجليد من قبل فني.'
      }
    ]
  },

  // =====================================================================
  // غسالة ملابس (Washing Machine) - سامسونج
  // =====================================================================
  {
    deviceName: 'Washing Machine',
    brandName: 'Samsung',
    codes: [
      {
        code: 'E2',
        description: 'خطأ في نظام تصريف المياه (Drain Error) - الغسالة لا تفرغ الماء بشكل صحيح.',
        actionStep: 'تحقق من شلنج التصريف وتأكد أنه غير مسدود أو ملوي. نظف فلتر المضخة من الأمام السفلي.'
      },
      {
        code: 'E3',
        description: 'خطأ في مستشعر الضغط/منسوب الماء (Overflow Error) - الماء يزيد عن المستوى الطبيعي.',
        actionStep: 'أوقف الغسالة فوراً. تحقق من صمام دخول الماء ونظف فلتر خرطوم الدخول.'
      },
      {
        code: 'E4',
        description: 'خطأ في دخول الماء (Water Supply Error) - الغسالة لا تحصل على الماء الكافي.',
        actionStep: 'تأكد من فتح صنبور الماء بالكامل. تحقق من نظافة فلتر خرطوم دخول الماء.'
      },
      {
        code: '3E',
        description: 'خطأ في محرك الغسالة (Motor Error) - حمل زائد على المحرك أو خلل فيه.',
        actionStep: 'أخرج جزءاً من الغسيل لتقليل الحمل. إذا استمر الكود، يلزم فحص المحرك مع فني.'
      },
      {
        code: '4E',
        description: 'لا يوجد إمداد ماء (No Water Supply) - مشكلة في الصنبور أو الخرطوم.',
        actionStep: 'تأكد من فتح الصنبور ومن عدم تهالك أو انحناء خرطوم الماء. نظف الفلتر.'
      },
      {
        code: '5E',
        description: 'خطأ في تصريف المياه (Drain Error) - مشابه E2، مضخة التصريف متوقفة أو مسدودة.',
        actionStep: 'نظف فلتر مضخة التصريف من الفتحة الأمامية السفلية. إذا استمر احجز فني.'
      },
      {
        code: 'UB',
        description: 'عدم توازن الحمولة (Unbalanced Load) - الغسيل مرتب بشكل غير متساوٍ.',
        actionStep: 'أوقف الغسالة وأعد توزيع الملابس بشكل متوازن ثم أعد التشغيل.'
      },
      {
        code: 'DC',
        description: 'الغطاء غير مغلق بشكل صحيح (Door Open Error).',
        actionStep: 'تأكد من إغلاق باب الغسالة بشكل كامل وسماع صوت القفل. نظف إطار الباب من أي أوساخ تمنع الإغلاق.'
      },
      {
        code: 'HE',
        description: 'عطل في سخان الغسالة (Heater Error) - عنصر التسخين لا يعمل.',
        actionStep: 'تأكد من أن الكهرباء مستقرة. إذا استمر الكود، يلزم استبدال عنصر التسخين مع فني.'
      },
      {
        code: 'LE',
        description: 'تسريب مياه (Water Leak Error) - الجهاز اكتشف تسرب ماء داخلياً.',
        actionStep: 'أوقف الغسالة فوراً وافحص الخراطيم والتوصيلات. احجز فني للفحص الشامل.'
      }
    ]
  },

  // =====================================================================
  // غسالة ملابس (Washing Machine) - إل جي
  // =====================================================================
  {
    deviceName: 'Washing Machine',
    brandName: 'LG',
    codes: [
      {
        code: 'OE',
        description: 'خطأ في تصريف المياه (Drain Error) - الغسالة لا تستطيع تصريف الماء.',
        actionStep: 'نظف فلتر مضخة التصريف (الموجود خلف لوحة أمامية صغيرة). تأكد من عدم انثناء خرطوم التصريف.'
      },
      {
        code: 'IE',
        description: 'خطأ في دخول الماء (Inlet Error) - الغسالة لا تستطيع ملء الماء.',
        actionStep: 'افتح صنبور الماء بالكامل. تحقق من خرطوم الدخول وفلتره.'
      },
      {
        code: 'UE',
        description: 'عدم توازن الحمولة (Unbalanced Load).',
        actionStep: 'أوقف الغسالة وأعد توزيع الغسيل داخل الحوض بشكل متساوٍ.'
      },
      {
        code: 'FE',
        description: 'تجاوز مستوى الماء (Overflow Error).',
        actionStep: 'أوقف الغسالة واسمح للماء بالتصريف الكامل. تحقق من صمام الماء.'
      },
      {
        code: 'PE',
        description: 'عطل في مستشعر الضغط/مستوى الماء (Pressure Sensor Error).',
        actionStep: 'أعد ضبط الجهاز بفصله عن الكهرباء لـ5 دقائق. إذا استمر احجز فني.'
      },
      {
        code: 'TE',
        description: 'عطل في مستشعر الحرارة (Temperature Sensor Error).',
        actionStep: 'احجز فني لاستبدال مستشعر الحرارة.'
      },
      {
        code: 'DE',
        description: 'باب الغسالة مفتوح أو غير مقفل (Door Error).',
        actionStep: 'أغلق الباب بشكل جيد مع الاستماع لصوت القفل. نظف حافة الباب من الأوساخ.'
      },
      {
        code: 'CE',
        description: 'حمل زائد على المحرك (Motor Overload/Current Error).',
        actionStep: 'أخرج الملابس الزائدة وحاول بحمولة أخف. إذا تكرر يلزم فحص المحرك.'
      }
    ]
  },

  // =====================================================================
  // غسالة ملابس (Washing Machine) - بيكو
  // =====================================================================
  {
    deviceName: 'Washing Machine',
    brandName: 'Beko',
    codes: [
      {
        code: 'E01',
        description: 'خطأ في صنبور دخول الماء (Water Inlet Valve Error).',
        actionStep: 'تأكد من فتح صنبور الماء. نظف فلتر خرطوم الدخول وتأكد من صحة الضغط.'
      },
      {
        code: 'E02',
        description: 'خطأ في تصريف الماء (Drain Pump Error).',
        actionStep: 'نظف فلتر مضخة التصريف وتحقق من خرطوم التصريف. أعد تشغيل الجهاز.'
      },
      {
        code: 'E03',
        description: 'باب الغسالة لا يُغلق بشكل صحيح (Door Lock Error).',
        actionStep: 'تحقق من إغلاق الباب بشكل محكم. إذا استمر الكود، يلزم استبدال قفل الباب.'
      },
      {
        code: 'E04',
        description: 'تجاوز مستوى الماء (Overflow Error).',
        actionStep: 'أوقف الغسالة فوراً وتحقق من صمام الماء.'
      },
      {
        code: 'E05',
        description: 'عطل في مستشعر الحرارة (Temperature Sensor Error).',
        actionStep: 'احجز فني لفحص واستبدال مستشعر الحرارة.'
      },
      {
        code: 'E07',
        description: 'خطأ في حرارة الغسيل المرتفعة جداً (Overheating Error).',
        actionStep: 'أوقف الغسالة وانتظر حتى تبرد. تأكد من أن الفلتر نظيف وغير مسدود.'
      },
      {
        code: 'E10',
        description: 'خطأ في لوحة التحكم الرئيسية (Control Board Error).',
        actionStep: 'افصل الكهرباء لـ10 دقائق ثم أعد التشغيل. إذا استمر يلزم استبدال اللوحة.'
      }
    ]
  }

];

// ============================================================
// الدالة الرئيسية للتنفيذ
// ============================================================

async function seedErrorCodes() {
  try {
    console.log('\n🔗 جاري الاتصال بقاعدة البيانات...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح.\n');

    let totalInserted = 0;
    let totalSkipped  = 0;

    for (const entry of ERROR_CODES_DATA) {
      // البحث عن نوع الجهاز
      const device = await ApplianceType.findOne({ nameEn: entry.deviceName });
      if (!device) {
        console.warn(`⚠️  لم يتم إيجاد نوع الجهاز: "${entry.deviceName}" - تخطي...`);
        continue;
      }

      // البحث عن الماركة
      const brand = await Brand.findOne({ nameEn: entry.brandName });
      if (!brand) {
        console.warn(`⚠️  لم يتم إيجاد الماركة: "${entry.brandName}" - تخطي...`);
        continue;
      }

      console.log(`\n📦 إضافة أكواد: [${entry.deviceName}] + [${entry.brandName}]`);

      for (const codeEntry of entry.codes) {
        const exists = await ErrorCode.findOne({
          code:     codeEntry.code.toUpperCase(),
          deviceId: device._id,
          brandId:  brand._id
        });

        if (exists) {
          console.log(`   ⏭️  الكود ${codeEntry.code} موجود مسبقاً - تخطي`);
          totalSkipped++;
          continue;
        }

        await ErrorCode.create({
          code:        codeEntry.code,
          description: codeEntry.description,
          deviceId:    device._id,
          brandId:     brand._id,
          actionStep:  codeEntry.actionStep,
          isActive:    true
        });

        console.log(`   ✅ تمت إضافة الكود: ${codeEntry.code}`);
        totalInserted++;
      }
    }

    console.log('\n=================================================');
    console.log(`🎉 اكتمل السيد بنجاح!`);
    console.log(`   تمت إضافة : ${totalInserted} كود جديد`);
    console.log(`   تخطي مكرر : ${totalSkipped} كود`);
    console.log('=================================================\n');

  } catch (error) {
    console.error('❌ خطأ أثناء تنفيذ السيد:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات.');
  }
}

seedErrorCodes();
