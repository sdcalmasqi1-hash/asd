/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { initializeApp as initializeFirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { DbSchema, MemberProfile, EventItem, MainProgram, BoardMember, SurveyItem, FAQItem, NotificationItem, AdminUser, EventRegistration, AdminLog } from "./src/types";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Set up larger limits for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Directories setup
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");
const DB_PATH = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// Serve uploaded files statically
app.use("/data/uploads", express.static(UPLOADS_DIR));

// Helper to generate unique membership ID: AA1234
function generateMembershipId(existingMembers: MemberProfile[]): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const existingIds = new Set(existingMembers.map((m) => m.id));
  
  for (let attempt = 0; attempt < 1000; attempt++) {
    const char1 = chars.charAt(Math.floor(Math.random() * chars.length));
    const char2 = chars.charAt(Math.floor(Math.random() * chars.length));
    const num = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const code = `${char1}${char2}${num}`;
    if (!existingIds.has(code)) {
      return code;
    }
  }
  return `MS${Math.floor(10000 + Math.random() * 90000)}`;
}

const DEFAULT_PUBLIC_SITE_URL = "https://almasqi-sac.onrender.com";

function getPublicSiteOrigin(): string {
  const fromEnv = process.env.PUBLIC_SITE_URL || process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_PUBLIC_SITE_URL;
}

function buildMemberVerifyLink(member: MemberProfile): string {
  const id = member.id.trim().toUpperCase();
  return `${getPublicSiteOrigin()}/?tab=memberships&member=${encodeURIComponent(id)}`;
}

function hashMemberPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

function verifyMemberPassword(member: MemberProfile, password: string): boolean {
  if (!member.passwordHash) return true;
  return member.passwordHash === hashMemberPassword(password);
}

function sanitizeMember(member: MemberProfile): MemberProfile {
  const { passwordHash: _removed, ...safeMember } = member;
  return safeMember as MemberProfile;
}

function getRequestOrigin(req: express.Request): string {
  return `${req.protocol}://${req.get("host")}`;
}

// Default Seed Data
const defaultDb: DbSchema = {
  settings: {
    centerName: "مركز النشاط الاجتماعي بالمسقي",
    logo: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&h=300&fit=crop", // Elegant vector gradient placeholder
    logoMini: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&h=100&fit=crop",
    phone: "0500000000",
    whatsapp: "966500000000",
    email: "info@almasqi-sac.org.sa",
    address: "المملكة العربية السعودية، منطقة عسير، قرية المسقي التاريخية",
    mapLocation: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14986.738084627253!2d42.61543845000001!3d18.10657985!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15ec92f808f972b9%3A0xc39cb62bc58cfdfc!2z2KfZhNmF2LPZgti6!5e0!3m2!1sar!2ssa!4v1700000000000!5m2!1sar!2ssa",
    socialX: "https://x.com/almasqi_sac",
    socialInstagram: "https://instagram.com/almasqi_sac",
    socialSnapchat: "https://snapchat.com/add/almasqi_sac",
    socialTikTok: "https://tiktok.com/@almasqi_sac",
    socialYouTube: "https://youtube.com/@almasqi_sac",
    seoTitle: "مركز النشاط الاجتماعي بالمسقي | واجهة مجتمعية متميزة",
    seoDesc: "المنصة الرسمية لمركز النشاط الاجتماعي بالمسقي بمنطقة عسير - نسعى لتقديم برامج اجتماعية، ثقافية، رياضية وتطوعية متميزة تخدم كافة فئات المجتمع.",
    seoKeywords: "المسقي, مركز النشاط الاجتماعي, عسير, برامج تطوعية, فعاليات, عضوية رقمية",
    whatsappApi: {
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      webhookUrl: "https://almasqi-sac.org.sa/api/webhooks/whatsapp"
    },
    mainCoverOpacity: 25,
    centerNameHighlightType: "none",
    centerNameHighlightColor: "rgba(250, 204, 21, 0.2)",
    feature1Title: "بناء مجتمعي فاعل",
    feature1Desc: "تكامل حقيقي بين لجان الرعاية والشباب لخدمة قرية المسقي الأثرية.",
    feature2Title: "تمكين العمل التطوعي",
    feature2Desc: "منصات وفرص تطوعية مستمرة تتيح للشباب فرصة البناء والترشح.",
    feature3Title: "تحول رقمي متكامل",
    feature3Desc: "أول مركز اجتماعي يوفر بطاقات عضوية رقمية مدعمة بالتحقق عبر الباركود."
  },
  themeSettings: {
    primaryColor: "#15803d", // Emerald Green 700
    secondaryColor: "#0f172a", // Slate 900
    buttonBg: "#16a34a", // Green 600
    buttonText: "#ffffff",
    headingColor: "#111827", // Gray 900
    textColor: "#374151", // Gray 700
    bgColor: "#f8fafc", // Slate 50
    navBg: "#ffffff",
    footerBg: "#0f172a",
    cardBg: "#ffffff",
    borderColor: "#e2e8f0",
    inputBg: "#ffffff",
    currentPreset: "classic_green",
    imageOpacity: 100
  },
  fontSettings: {
    primaryFont: "Cairo",
    headingFont: "Cairo",
    textFont: "Cairo",
    titleSize: "text-3xl",
    textSize: "text-base",
    fontWeight: "font-medium"
  },
  councils: {
    introText: "يفخر مركز النشاط الاجتماعي بالمسقي بمسيرته العطرة التي قادها رجال مخلصون، عملوا بكل جد واجتهاد لخدمة المجتمع المحلي والارتقاء بالأنشطة والبرامج التنموية والاجتماعية في قرية المسقي الجميلة.",
    current: [
      {
        id: "c1",
        name: "أ. محمد بن علي آل مسفر",
        role: "رئيس مجلس الإدارة",
        bio: "تربوي ومستشار اجتماعي بخبرة تفوق عشرين عاماً في الإدارة وتصميم المبادرات المجتمعية.",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        order: 1
      },
      {
        id: "c2",
        name: "م. سعيد بن عبد الله الأسمري",
        role: "نائب رئيس المجلس",
        bio: "مهندس استشاري ومهتم بالتطوير المجتمعي وتنمية الموارد البشرية والشبابية في القرية.",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        order: 2
      },
      {
        id: "c3",
        name: "أ. خالد بن يحيى عسيري",
        role: "أمين الصندوق",
        bio: "متخصص في المحاسبة المالية وإدارة الميزانيات، يتمتع بشغف كبير بالعمل التطوعي والإنساني.",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
        order: 3
      }
    ],
    previous: [
      {
        id: "p1",
        name: "أ. عبد الله بن يحيى آل جابر",
        role: "رئيس المجلس السابق",
        bio: "قاد المجلس في الدورة التأسيسية السابقة ورسم الخطوط العريضة للبرامج الاجتماعية بالقرية.",
        photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop",
        order: 1
      },
      {
        id: "p2",
        name: "أ. علي بن سعد الشهراني",
        role: "أمين الصندوق السابق",
        bio: "ساهم في تنظيم الشؤون المالية وتطوير أول لائحة حوكمة لبرامج المركز الاجتماعية والرياضية.",
        photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop",
        order: 2
      }
    ]
  },
  reference: {
    content: `## مرجعية مركز النشاط الاجتماعي بالمسقي

تأسس مركز النشاط الاجتماعي بالمسقي تحت إشراف الجهات الرسمية المعنية بالتنمية الاجتماعية، مستنداً إلى رؤية وطنية تهدف إلى تفعيل دور المواطن والمقيم في تنمية مجتمعه وتطوير برامج ترفيهية ورياضية وثقافية مثمرة.

### الأهداف الاستراتيجية:
1. **تمكين الكوادر الوطنية**: إعداد جيل من المتطوعين والشغوفين بخدمة مجتمعهم في قرية المسقي.
2. **الحفاظ على الموروث الثقافي**: إبراز الهوية العسيرية التراثية للقرية من خلال المعارض والفعاليات.
3. **التنمية الشاملة**: تلبية احتياجات الأسرة والطفل والشباب عبر باقات من البرامج المتنوعة.

---

### اللوائح والأنظمة المعمول بها:
يتعاون المركز بالكامل مع الإدارات والمؤسسات الشريكة لضمان تحقيق أعلى درجات الشفافية والحوكمة في إدارة الموارد المالية والبشرية، مع توثيق كافة المعاملات والمحاضر بشكل دوري.`,
    images: [
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600&h=400&fit=crop"
    ],
    files: [
      { name: "اللائحة التنظيمية لمركز المسقي.pdf", url: "#", size: "1.4 MB" },
      { name: "الدليل التعريفي للبرامج والأنشطة.pdf", url: "#", size: "2.8 MB" }
    ],
    links: [
      "https://ncnp.gov.sa"
    ]
  },
  programs: [
    {
      id: "prog1",
      name: "البرامج الاجتماعية",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
      description: "تعزيز الأواصر والعلاقات الاجتماعية بين أهالي المسقي والقرى المجاورة من خلال اللقاءات والأنشطة الدورية والمجالس العائلية المباركة.",
      subPrograms: [
        {
          id: "sub1_1",
          title: "ملتقى الأجيال الشهري",
          description: "لقاء دوري يجمع كبار السن بالشباب لنقل الخبرات والقصص التراثية وتعزيز التواصل الاجتماعي المستدام بين الأجيال المختلفة.",
          images: ["https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop"],
          files: [],
          links: [],
          isHidden: false,
          order: 1
        },
        {
          id: "sub1_2",
          title: "ديوانية المسقي الرمضانية",
          description: "ديوانية تفاعلية تقام طوال ليالي الشهر المبارك لمناقشة مبادرات القرية وتنسيق الدعم الاجتماعي للأسر المنتجة والناشئة.",
          images: ["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop"],
          files: [],
          links: [],
          isHidden: false,
          order: 2
        }
      ]
    },
    {
      id: "prog2",
      name: "البرامج الثقافية",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop",
      description: "نشر المعرفة والثقافة وإقامة المحاضرات والندوات والأمسيات الأدبية والتراثية التي تبرز تاريخ المنطقة العريق وتثري عقول الحاضرين.",
      subPrograms: [
        {
          id: "sub2_1",
          title: "مسابقة التراث والآثار الأولى",
          description: "مسابقة سنوية تركز على جمع وتوثيق تاريخ المسقي التاريخي والمباني القديمة وأدوات الزراعة التراثية في منطقة عسير.",
          images: [],
          files: [{ name: "شروط مسابقة التراث.pdf", url: "#", size: "850 KB" }],
          links: [],
          isHidden: false,
          order: 1
        }
      ]
    },
    {
      id: "prog3",
      name: "البرامج الرياضية",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
      description: "تنشيط الحركة الرياضية وتنظيم البطولات والمسابقات الرياضية المتنوعة لمختلف الفئات العمرية بالقرية للحفاظ على اللياقة والصحة العامة.",
      subPrograms: [
        {
          id: "sub3_1",
          title: "دوري المسقي الصيفي لكرة القدم",
          description: "بطولة رياضية تجمع فرق الأحياء في عسير على ملعب المركز للمنافسة الشريفة بروح رياضية عالية وجوائز قيمة.",
          images: ["https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=300&fit=crop"],
          files: [],
          links: [],
          isHidden: false,
          order: 1
        }
      ]
    },
    {
      id: "prog4",
      name: "البرامج التطوعية",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop",
      description: "إطلاق المبادرات والفرص التطوعية لخدمة البيئة والمجتمع المحلي، ونشر ثقافة العمل الإنساني والمسؤولية الاجتماعية الفردية.",
      subPrograms: [
        {
          id: "sub4_1",
          title: "مبادرة تشجير متنزهات المسقي",
          description: "حملة تطوعية لغرس شتلات العرعر والنباتات المحلية في متنزهات القرية لحماية الغطاء النباتي وتجميل الطبيعة الخلابة.",
          images: [],
          files: [],
          links: [],
          isHidden: false,
          order: 1
        }
      ]
    },
    {
      id: "prog5",
      name: "برامج الأطفال والشباب",
      image: "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=600&h=400&fit=crop",
      description: "رعاية مواهب الأطفال واستثمار أوقات فراغ الشباب من خلال برامج ترفيهية، رياضية وتعليمية هادفة تزرع القيم والأخلاق الحميدة.",
      subPrograms: [
        {
          id: "sub5_1",
          title: "نادي الابتكار البرمجي للصغار",
          description: "دورة ميسرة لتعليم أساسيات البرمجة والتفكير المنطقي للأطفال باستخدام لغات بصرية ممتعة خلال الإجازة الصيفية.",
          images: [],
          files: [],
          links: [],
          isHidden: false,
          order: 1
        }
      ]
    },
    {
      id: "prog6",
      name: "البرامج التدريبية والتطويرية",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop",
      description: "تطوير المهارات الحياتية والمهنية وتأهيل شباب وفتيات المجتمع لسوق العمل عبر دورات متخصصة وورش عمل يلقيها خبراء متميزون.",
      subPrograms: [
        {
          id: "sub6_1",
          title: "ورشة عمل كتابة السيرة الذاتية واجتياز المقابلات",
          description: "ورشة عملية تهدف إلى مساعدة الباحثين والباحثات عن العمل على تسويق مهاراتهم بنجاح وبناء ملفات مهنية احترافية.",
          images: [],
          files: [],
          links: [],
          isHidden: false,
          order: 1
        }
      ]
    }
  ],
  members: [
    {
      id: "MS4512",
      tripleName: "ياسر بن عبد الله آل جابر",
      phone: "0555555555",
      email: "yaser@gmail.com",
      birthDate: "1415-08-15",
      calendarType: "hijri",
      gender: "male",
      status: "active",
      createdAt: "2026-06-01T12:00:00.000Z",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MS4512",
      expiryDate: "2027-06-01"
    }
  ],
  events: [
    {
      id: "evt1",
      title: "ملتقى العيد السنوي لأهالي المسقي",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop",
      shortDesc: "الاحتفال السنوي ببهجة عيد الأضحى المبارك، يتخلله ألوان شعبية ومسابقات وجلسة معايدة مفتوحة.",
      fullDesc: "يسعد مركز النشاط الاجتماعي بالمسقي دعوة كافة الأهالي والأصدقاء لحضور ملتقى العيد السنوي السعيد، والذي يشمل جلسة المعايدة الكبرى، وجبة العشاء، العرضة العسيرية الشعبية وتوزيع هدايا الأطفال الخاصة ببهجة العيد.",
      date: "2026-06-25",
      startTime: "16:30",
      endTime: "22:00",
      location: "مقر المركز الرئيسي - الساحة الشعبية بالمسقي",
      mapUrl: "https://maps.google.com/?q=Al-Masqi",
      seatsTotal: 150,
      seatsRemaining: 148,
      status: "open",
      registrations: [
        {
          memberId: "MS4512",
          name: "ياسر بن عبد الله آل جابر",
          phone: "0555555555",
          status: "approved",
          registeredAt: "2026-06-15T18:30:00.000Z"
        }
      ]
    },
    {
      id: "evt2",
      title: "ندوة الحفاظ على العمارة التراثية في عسير",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
      shortDesc: "ندوة علمية هندسية تسلط الضوء على آليات صيانة الحصون القديمة وإعادة تأهيل المباني الحجرية التاريخية.",
      fullDesc: "تجمع هذه الندوة نخبة من الأكاديميين والمتخصصين في التراث العمراني لمناقشة السبل الحديثة لترميم البيوت القديمة والمحافظة على الطابع الجمالي الفريد لمنطقة عسير عامة والمسقي خاصة.",
      date: "2026-07-20",
      startTime: "19:00",
      endTime: "21:30",
      location: "قاعة الندوات والمحاضرات بمركز النشاط",
      mapUrl: "https://maps.google.com/?q=Al-Masqi",
      seatsTotal: 80,
      seatsRemaining: 80,
      status: "open",
      registrations: []
    }
  ],
  gallery: [
    {
      id: "alb1",
      title: "ألبوم تدشين مبادرات المركز 1447هـ",
      description: "لقطات توثيقية من حفل افتتاح البرامج الصيفية برعاية وجهاء وأهالي قرية المسقي.",
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
      order: 1,
      photos: [
        { id: "ph1", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", description: "الحضور الكريم أثناء كلمة رئيس مجلس الإدارة الافتتاحية.", order: 1 },
        { id: "ph2", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop", description: "تكريم الفائزين والداعمين للملتقى الرمضاني السابق.", order: 2 }
      ]
    }
  ],
  surveys: [
    {
      id: "srv1",
      title: "استبيان تقييم الفعاليات الصيفية لعام 1447هـ",
      startDate: "2026-06-01",
      endDate: "2026-07-15",
      questions: [
        { id: "q1", type: "mcq", questionText: "كيف تقيم مستوى التنظيم العام للبطولة الرياضية؟", options: ["ممتاز", "جيد جداً", "متوسط", "بحاجة لتطوير"] },
        { id: "q2", type: "mcq", questionText: "ما هو الوقت الأنسب لإقامة اللقاءات الثقافية والندوات في المركز؟", options: ["بعد العصر", "بعد المغرب", "بعد العشاء"] },
        { id: "q3", type: "text", questionText: "اكتب مقترحاتك أو أي برامج ترغب في إضافتها مستقبلاً في المركز:" }
      ],
      votesCount: 1,
      responses: [
        {
          voterId: "MS4512",
          answers: {
            "q1": "ممتاز",
            "q2": "بعد العشاء",
            "q3": "نقترح زيادة عدد الدورات التطويرية التقنية للشباب."
          },
          submittedAt: "2026-06-16T15:20:00.000Z"
        }
      ]
    }
  ],
  notifications: [
    {
      id: "n1",
      title: "ترحيب بالعضوية الرقمية",
      message: "مرحباً بكم في مركز النشاط الاجتماعي بالمسقي. تم إصدار بطاقتكم الرقمية بنجاح بنظام العضويات المحدث.",
      scheduledAt: "2026-06-01T12:00:00.000Z",
      targetGroup: "all",
      sent: true,
      sentCount: 1,
      whatsappTemplateId: "member_welcome_01"
    }
  ],
  faqs: [
    {
      id: "f1",
      question: "ما هو مركز النشاط الاجتماعي بالمسقي؟",
      answer: "هو مركز اجتماعي تنموي تطوعي يهدف إلى تفعيل دور أهالي قرية المسقي في تصميم وتنفيذ البرامج والمبادرات التوعوية، الثقافية، الرياضية، والتطويرية لخدمة مجتمعهم تحت إشراف رسمي وحوكمة متكاملة."
    },
    {
      id: "f2",
      question: "كيف يمكنني الحصول على بطاقة العضوية الرقمية؟",
      answer: "يمكنك التسجيل بسهولة عبر قسم 'العضويات' بإدخال الاسم الثلاثي، ورقم الجوال، والبريد الإلكتروني، وتاريخ ميلادك (بالتقويم الهجري أو الميلادي). سيقوم النظام فوراً بتوليد رقم عضوية فريد (مثل AA1234) وبطاقة عضوية رقمية مميزة مع كود QR مخصص."
    },
    {
      id: "f3",
      question: "هل هناك رسوم للتسجيل والاشتراك في الفعاليات؟",
      answer: "لا، الموقع والتسجيل في العضوية الرقمية وحضور كافة الفعاليات والمبادرات التي ينظمها مركز المسقي مجانية بالكامل وبدون أي رسوم اشتراك، وبدون الحاجة لأي مفتاح تفعيل."
    }
  ],
  admins: [
    {
      id: "a1",
      username: "admin",
      name: "مدير النظام العام",
      passwordHash: "admin123", // For production we recommend secure hashes, for developer ease this is standard clear config
      role: "admin"
    },
    {
      id: "a2",
      username: "content",
      name: "مشرف المحتوى والبرامج",
      passwordHash: "content123",
      role: "content_manager"
    },
    {
      id: "a3",
      username: "members",
      name: "مشرف العضويات الرقمية",
      passwordHash: "members123",
      role: "member_manager"
    },
    {
      id: "a4",
      username: "events",
      name: "مشرف الفعاليات والأنشطة",
      passwordHash: "events123",
      role: "event_manager"
    }
  ],
  logs: [
    {
      id: "log1",
      adminId: "a1",
      adminName: "مدير النظام العام",
      action: "تهيئة النظام وقاعدة البيانات للمرة الأولى بنجاح.",
      timestamp: "2026-07-02T14:20:00.000Z"
    }
  ],
  backups: []
};

// Database state
let databaseState: DbSchema = defaultDb;

// Initialize Firebase SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseDb: any = null;
let firestoreDatabaseId: string = "";

let config: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    console.log("Firebase config loaded from local json file.");
  } catch (err) {
    console.error("Error reading firebase-applet-config.json:", err);
  }
} else if (process.env.FIREBASE_API_KEY) {
  console.log("Firebase config detected from environment variables.");
  config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID
  };
}

if (config) {
  try {
    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    };
    const firebaseApp = initializeFirebaseApp(firebaseConfig);
    firestoreDatabaseId = config.firestoreDatabaseId || "";
    firebaseDb = getFirestore(firebaseApp, firestoreDatabaseId);
    console.log("Firebase client initialized successfully on backend for database:", firestoreDatabaseId || "default");
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
  }
} else {
  console.log("No Firebase configuration found (neither JSON file nor environment variables), skipping Firestore sync.");
}

const DATABASE_KEYS = [
  "settings",
  "themeSettings",
  "fontSettings",
  "councils",
  "reference",
  "programs",
  "members",
  "events",
  "gallery",
  "surveys",
  "notifications",
  "faqs",
  "admins",
  "logs",
  "backups"
];

// Load database state from local file (fast synchronous fallback on boot)
function loadDatabaseLocal() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      databaseState = JSON.parse(data);
      console.log("Database loaded successfully from local file cache:", DB_PATH);
    } else {
      saveDatabaseLocal();
      console.log("Local cache file initialized with default seed data.");
    }
  } catch (err) {
    console.error("Error loading local database, falling back to seed data:", err);
    databaseState = defaultDb;
  }
}

// Save database state to local file
function saveDatabaseLocal() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(databaseState, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database locally:", err);
  }
}

// Load state from Firestore
async function loadStateFromFirestore() {
  if (!firebaseDb) return false;
  try {
    console.log("Synchronizing with cloud database (Firestore)...");
    const tempState: any = {};
    let hasData = false;

    // Load each document in parallel
    await Promise.all(
      DATABASE_KEYS.map(async (key) => {
        const docRef = doc(firebaseDb, "app_state", key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          tempState[key] = docData.value;
          hasData = true;
        }
      })
    );

    if (hasData) {
      databaseState = { ...defaultDb, ...tempState };
      console.log("Cloud state synchronized successfully from Firestore.");
      saveDatabaseLocal(); // Keep local cache in sync
      return true;
    } else {
      console.log("Firestore database is empty. Uploading initial local seed state to cloud...");
      await saveStateToFirestore();
      return true;
    }
  } catch (err) {
    console.error("Error loading state from Firestore:", err);
    return false;
  }
}

// Save state to Firestore
async function saveStateToFirestore() {
  if (!firebaseDb) return;
  try {
    await Promise.all(
      DATABASE_KEYS.map(async (key) => {
        const docRef = doc(firebaseDb, "app_state", key);
        const val = (databaseState as any)[key] ?? (defaultDb as any)[key];
        await setDoc(docRef, { value: val });
      })
    );
    console.log("Cloud state saved successfully to Firestore.");
  } catch (err) {
    console.error("Error saving state to Firestore:", err);
  }
}

function loadDatabase() {
  loadDatabaseLocal();
}

// Public API exposed for backward compatibility in endpoints
function saveDatabase() {
  saveDatabaseLocal();
  if (firebaseDb) {
    saveStateToFirestore().catch((err) => {
      console.error("Async cloud save failed:", err);
    });
  }
}

// Initial synchronous boot from local file
loadDatabaseLocal();

// API Endpoints

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    firebase: Boolean(firebaseDb),
    uptime: process.uptime(),
  });
});

// Get public database state (non-sensitive elements)
app.get("/api/public/data", (req, res) => {
  const syntheticEvents: any[] = [];
  if (databaseState.programs && Array.isArray(databaseState.programs)) {
    databaseState.programs.forEach(prog => {
      if (prog.subPrograms && Array.isArray(prog.subPrograms)) {
        prog.subPrograms.forEach(sub => {
          if (sub.date && !sub.isHidden) {
            const associatedEventId = `e_${sub.id}`;
            const existsInEvents = databaseState.events && databaseState.events.some(e => e.id === associatedEventId);
            if (!existsInEvents) {
              syntheticEvents.push({
              id: sub.id,
              title: sub.title,
              image: (sub.images && sub.images[0]) || prog.image || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
              shortDesc: sub.description ? (sub.description.substring(0, 150) + (sub.description.length > 150 ? "..." : "")) : "",
              fullDesc: sub.description || "",
              date: sub.date,
              startTime: sub.timeFrom || "00:00",
              endTime: sub.timeTo || "00:00",
              location: sub.location || "مركز النشاط الاجتماعي بالمسقي",
              mapUrl: "",
              seatsTotal: sub.seatsTotal || 100,
              seatsRemaining: sub.seatsRemaining !== undefined ? sub.seatsRemaining : (sub.seatsTotal || 100),
              status: (sub.seatsRemaining !== undefined && sub.seatsRemaining <= 0) ? "closed" : "open",
              registrationsCount: sub.registrations ? sub.registrations.length : 0,
              registrations: sub.registrations || [],
              isSubProgram: true,
              programId: prog.id
            });
            }
          }
        });
      }
    });
  }

  const mergedEvents = [
    ...databaseState.events.map(e => ({
      ...e,
      registrationsCount: e.registrations.length
    })),
    ...syntheticEvents
  ];

  // Sort events by date ascending (nearest first)
  mergedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  res.json({
    settings: databaseState.settings,
    themeSettings: databaseState.themeSettings,
    fontSettings: databaseState.fontSettings,
    councils: databaseState.councils,
    reference: databaseState.reference,
    programs: databaseState.programs,
    events: mergedEvents,
    gallery: databaseState.gallery,
    faqs: databaseState.faqs,
    surveys: databaseState.surveys.map(s => ({
      id: s.id,
      title: s.title,
      startDate: s.startDate,
      endDate: s.endDate,
      questions: s.questions,
      votesCount: s.responses.length
    }))
  });
});

// Member registration (Public)
app.post("/api/members/register", (req, res) => {
  const { tripleName, phone, email, birthDate, calendarType, gender, password } = req.body;
  
  if (!tripleName || !phone || !birthDate || !calendarType || !gender || !password) {
    return res.status(400).json({ error: "الرجاء تعبئة الحقول الإجبارية (الاسم الثلاثي، رقم الجوال، تاريخ الميلاد، الجنس، وكلمة سر العضوية)." });
  }

  if (String(password).trim().length < 4) {
    return res.status(400).json({ error: "كلمة سر العضوية يجب أن تكون 4 أحرف على الأقل." });
  }

  // Generate unique member ID AA1234
  const newId = generateMembershipId(databaseState.members);
  
  const newMember: MemberProfile = {
    id: newId,
    tripleName,
    phone,
    email: email || "",
    birthDate,
    calendarType,
    gender,
    status: "active", // Active by default or pending based on admin config
    createdAt: new Date().toISOString(),
    qrCodeUrl: "",
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0], // 2 years default
    passwordHash: hashMemberPassword(String(password))
  };
  newMember.qrCodeUrl = buildMemberVerifyLink(newMember);

  databaseState.members.push(newMember);
  saveDatabase();

  res.json({
    success: true,
    message: "تم إنشاء العضوية الرقمية بنجاح!",
    member: sanitizeMember(newMember)
  });
});

// Lookup memberships by phone (no card data until password is verified)
app.post("/api/members/lookup-phone", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "الرجاء إدخال رقم الجوال." });
  }

  const matches = databaseState.members.filter((m) => m.phone.trim() === String(phone).trim());
  if (matches.length === 0) {
    return res.status(404).json({ error: "عذراً، لم يتم العثور على أي بطاقة عضوية مسجلة برقم الجوال المدخل." });
  }

  res.json({
    success: true,
    count: matches.length,
    members: matches.map((m) => ({
      id: m.id,
      tripleName: m.tripleName
    }))
  });
});

// Member Auth/Login via Membership ID + Phone Number + Password
app.post("/api/members/auth", (req, res) => {
  const { memberId, phone, password } = req.body;
  
  if (!phone || !password) {
    return res.status(400).json({ error: "الرجاء إدخال رقم الجوال وكلمة سر العضوية." });
  }

  let member: MemberProfile | undefined;

  if (memberId) {
    member = databaseState.members.find(
      (m) =>
        m.id.toLowerCase() === String(memberId).trim().toLowerCase() &&
        m.phone.trim() === String(phone).trim()
    );
  } else {
    const phoneMatches = databaseState.members.filter((m) => m.phone.trim() === String(phone).trim());
    if (phoneMatches.length === 1) {
      member = phoneMatches[0];
    } else if (phoneMatches.length > 1) {
      return res.status(409).json({
        error: "يوجد أكثر من عضوية مسجلة على هذا الرقم. يرجى تحديد رقم العضوية.",
        members: phoneMatches.map((m) => ({ id: m.id, tripleName: m.tripleName }))
      });
    }
  }

  if (!member) {
    return res.status(401).json({ error: "رقم العضوية أو رقم الجوال المدخل غير صحيح." });
  }

  if (!verifyMemberPassword(member, String(password))) {
    return res.status(401).json({ error: "كلمة سر العضوية غير صحيحة." });
  }

  res.json({
    success: true,
    member: sanitizeMember(member)
  });
});

// Public membership verification (for QR code scans — no phone/email exposed)
app.get("/api/members/verify/:memberId", (req, res) => {
  const memberId = (req.params.memberId || "").trim().toUpperCase();
  if (!memberId) {
    return res.status(400).json({ error: "رقم العضوية مطلوب." });
  }

  const member = databaseState.members.find((m) => m.id.trim().toUpperCase() === memberId);
  if (!member) {
    return res.status(404).json({ error: "لم يتم العثور على عضوية بهذا الرقم." });
  }

  res.json({
    id: member.id,
    tripleName: member.tripleName,
    status: member.status,
    gender: member.gender,
    birthDate: member.birthDate,
    calendarType: member.calendarType,
    expiryDate: member.expiryDate,
    createdAt: member.createdAt
  });
});

// Short link for QR codes — opens membership verification on mobile
app.get("/v/:memberId", (req, res) => {
  const memberId = (req.params.memberId || "").trim().toUpperCase();
  if (!memberId) {
    return res.redirect("/?tab=memberships");
  }
  res.redirect(302, `/?tab=memberships&member=${encodeURIComponent(memberId)}`);
});

// Update Member Profile (Public or Self-service)
app.post("/api/members/update", (req, res) => {
  const { memberId, tripleName, phone, email, birthDate, calendarType, gender, password, currentPassword } = req.body;
  
  const index = databaseState.members.findIndex((m) => m.id === memberId);
  if (index === -1) {
    return res.status(404).json({ error: "العضو غير موجود." });
  }

  const member = databaseState.members[index];

  if (password) {
    if (String(password).trim().length < 4) {
      return res.status(400).json({ error: "كلمة سر العضوية الجديدة يجب أن تكون 4 أحرف على الأقل." });
    }
    if (member.passwordHash && !currentPassword) {
      return res.status(400).json({ error: "الرجاء إدخال كلمة السر الحالية لتغيير كلمة السر." });
    }
    if (member.passwordHash && !verifyMemberPassword(member, String(currentPassword))) {
      return res.status(401).json({ error: "كلمة السر الحالية غير صحيحة." });
    }
  }

  const updated: MemberProfile = {
    ...member,
    tripleName: tripleName || member.tripleName,
    phone: phone || member.phone,
    email: email !== undefined ? email : member.email,
    birthDate: birthDate || member.birthDate,
    calendarType: calendarType || member.calendarType,
    gender: gender || member.gender,
    passwordHash: password ? hashMemberPassword(String(password)) : member.passwordHash
  };
  updated.qrCodeUrl = buildMemberVerifyLink(updated);
  databaseState.members[index] = updated;

  saveDatabase();
  res.json({ success: true, member: sanitizeMember(databaseState.members[index]) });
});

// Event Registration (Public for Members)
app.post("/api/events/register", (req, res) => {
  const { eventId, memberId, name, phone } = req.body;
  
  if (!eventId || !memberId || !name || !phone) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة للمشاركة." });
  }

  // Validate that membership exists
  const normalizedMemberId = memberId.trim().toUpperCase();
  const memberExists = databaseState.members.some(
    (m) => m.id.trim().toUpperCase() === normalizedMemberId
  );
  if (!memberExists) {
    return res.status(400).json({ error: "عذراً، رقم العضوية المدخل غير مسجل في النظام. يرجى التأكد من الرقم أو إصدار عضوية جديدة." });
  }

  const eventIndex = databaseState.events.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) {
    // Search in programs' subprograms
    let foundProgram = null;
    let foundSub = null;
    if (databaseState.programs && Array.isArray(databaseState.programs)) {
      for (const prog of databaseState.programs) {
        if (prog.subPrograms && Array.isArray(prog.subPrograms)) {
          const s = prog.subPrograms.find(sub => sub.id === eventId);
          if (s) {
            foundProgram = prog;
            foundSub = s;
            break;
          }
        }
      }
    }

    if (!foundSub || !foundProgram) {
      return res.status(404).json({ error: "الفعالية أو المبادرة غير موجودة." });
    }

    // Handle Subprogram registration
    if (!foundSub.registrations) {
      foundSub.registrations = [];
    }

    const seatsTotal = foundSub.seatsTotal || 100;
    if (foundSub.seatsRemaining !== undefined && foundSub.seatsRemaining <= 0) {
      return res.status(400).json({ error: "عذراً، اكتملت المقاعد المتاحة لهذه المبادرة." });
    }

    const alreadyRegistered = foundSub.registrations.some((r) => r.memberId.trim().toUpperCase() === normalizedMemberId);
    if (alreadyRegistered) {
      return res.status(400).json({ error: "لقد قمت بحجز مقعد في هذه المبادرة مسبقاً!" });
    }

    const registration: EventRegistration = {
      memberId: normalizedMemberId,
      name,
      phone,
      status: "approved", // auto approved for subprograms for simplicity
      registeredAt: new Date().toISOString()
    };

    foundSub.registrations.push(registration);
    foundSub.seatsRemaining = Math.max(0, seatsTotal - foundSub.registrations.length);

    saveDatabase();

    const syntheticEvent = {
      id: foundSub.id,
      title: foundSub.title,
      image: (foundSub.images && foundSub.images[0]) || foundProgram.image || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
      shortDesc: foundSub.description ? foundSub.description.substring(0, 150) : "",
      fullDesc: foundSub.description || "",
      date: foundSub.date,
      startTime: foundSub.timeFrom || "00:00",
      endTime: foundSub.timeTo || "00:00",
      location: foundSub.location || "مركز النشاط الاجتماعي بالمسقي",
      mapUrl: "",
      seatsTotal: seatsTotal,
      seatsRemaining: foundSub.seatsRemaining,
      status: foundSub.seatsRemaining <= 0 ? "closed" : "open",
      registrationsCount: foundSub.registrations.length,
      registrations: foundSub.registrations,
      isSubProgram: true,
      programId: foundProgram.id
    };

    return res.json({
      success: true,
      message: "تم حجز مقعدك بنجاح في هذه المبادرة الفرعية!",
      event: syntheticEvent
    });
  }

  const event = databaseState.events[eventIndex];
  
  if (event.status === "closed" || event.seatsRemaining <= 0) {
    return res.status(400).json({ error: "عذراً، التسجيل في هذه الفعالية مغلق حالياً أو اكتملت المقاعد." });
  }

  // Check if member already registered
  const alreadyRegistered = event.registrations.some((r) => r.memberId.trim().toUpperCase() === normalizedMemberId);
  if (alreadyRegistered) {
    return res.status(400).json({ error: "لقد قمت بالتسجيل في هذه الفعالية مسبقاً!" });
  }

  const registration: EventRegistration = {
    memberId: normalizedMemberId,
    name,
    phone,
    status: "pending", // Default to pending until approved by event manager
    registeredAt: new Date().toISOString()
  };

  event.registrations.push(registration);
  // Do not decrement seatsRemaining until approved by admin
  saveDatabase();

  res.json({
    success: true,
    message: "تم تقديم طلب التسجيل بنجاح! بانتظار موافقة مشرف الفعالية.",
    event: {
      ...event,
      registrationsCount: event.registrations.length
    }
  });
});

// SubProgram Seat Booking Registration (Public for Members)
app.post("/api/subprograms/register", (req, res) => {
  const { programId, subProgramId, memberId, name, phone } = req.body;
  
  if (!programId || !subProgramId || !memberId || !name || !phone) {
    return res.status(400).json({ error: "جميع الحقول مطلوبة للمشاركة." });
  }

  // Validate that membership exists
  const normalizedMemberId = memberId.trim().toUpperCase();
  const memberExists = databaseState.members.some(
    (m) => m.id.trim().toUpperCase() === normalizedMemberId
  );
  if (!memberExists) {
    return res.status(400).json({ error: "عذراً، رقم العضوية المدخل غير مسجل في النظام. يرجى التأكد من الرقم أو إصدار عضوية جديدة." });
  }

  const programIndex = databaseState.programs.findIndex((p) => p.id === programId);
  if (programIndex === -1) {
    return res.status(404).json({ error: "البرنامج الرئيسي غير موجود." });
  }

  const program = databaseState.programs[programIndex];
  const subProgramIndex = program.subPrograms.findIndex((s) => s.id === subProgramId);
  if (subProgramIndex === -1) {
    return res.status(404).json({ error: "المبادرة الفرعية غير موجودة." });
  }

  const subProgram = program.subPrograms[subProgramIndex];

  if (!subProgram.seatsEnabled) {
    return res.status(400).json({ error: "حجز المقاعد غير مفعل لهذه المبادرة الفرعية." });
  }

  // Ensure registrations array exists
  if (!subProgram.registrations) {
    subProgram.registrations = [];
  }

  const seatsTotal = subProgram.seatsTotal || 50;
  const currentCount = subProgram.registrations.length;
  if (currentCount >= seatsTotal) {
    return res.status(400).json({ error: "عذراً، اكتملت المقاعد المتاحة لهذه المبادرة." });
  }

  // Check if member already registered
  const alreadyRegistered = subProgram.registrations.some((r) => r.memberId.trim().toUpperCase() === normalizedMemberId);
  if (alreadyRegistered) {
    return res.status(400).json({ error: "لقد قمت بحجز مقعد في هذه المبادرة مسبقاً!" });
  }

  const registration: EventRegistration = {
    memberId: normalizedMemberId,
    name,
    phone,
    status: "approved", // approved automatically for subprogram booking simplicity
    registeredAt: new Date().toISOString()
  };

  subProgram.registrations.push(registration);
  subProgram.seatsRemaining = Math.max(0, seatsTotal - subProgram.registrations.length);

  saveDatabase();

  res.json({
    success: true,
    message: "تم حجز مقعدك بنجاح في المبادرة الفرعية!",
    program
  });
});

// Survey voting (Public for Members)
app.post("/api/surveys/vote", (req, res) => {
  const { surveyId, voterId, answers } = req.body;

  if (!surveyId || !voterId || !answers) {
    return res.status(400).json({ error: "الرجاء الإجابة على الأسئلة وإرسال الاستبيان." });
  }

  const surveyIndex = databaseState.surveys.findIndex((s) => s.id === surveyId);
  if (surveyIndex === -1) {
    return res.status(404).json({ error: "الاستبيان غير موجود." });
  }

  const survey = databaseState.surveys[surveyIndex];

  // Check if already voted
  const alreadyVoted = survey.responses.some((r) => r.voterId === voterId);
  if (alreadyVoted) {
    return res.status(400).json({ error: "لقد قمت بالمشاركة في هذا الاستبيان مسبقاً." });
  }

  survey.responses.push({
    voterId,
    answers,
    submittedAt: new Date().toISOString()
  });
  survey.votesCount = survey.responses.length;
  
  saveDatabase();

  res.json({
    success: true,
    message: "نشكرك على مشاركتك القيمة في الاستبيان!",
    survey: {
      id: survey.id,
      title: survey.title,
      startDate: survey.startDate,
      endDate: survey.endDate,
      questions: survey.questions,
      votesCount: survey.votesCount
    }
  });
});

// Contact Us form submission
app.post("/api/contact", (req, res) => {
  const { name, phone, email, subject, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: "الرجاء ملء الحقول المطلوبة (الاسم، الجوال، الرسالة)." });
  }

  // Save as a log or simply respond with success (in prototype, log it as an admin activity or keep it simple)
  console.log(`[Contact Submission] Name: ${name}, Phone: ${phone}, Message: ${message}`);
  res.json({ success: true, message: "تم إرسال رسالتكم بنجاح! سيتواصل معكم فريق المركز قريباً." });
});

// Admin Authentication Login
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "الرجاء إدخال اسم المستخدم وكلمة المرور." });
  }

  const admin = databaseState.admins.find(
    (a) => a.username.trim() === username.trim() && a.passwordHash === password.trim()
  );

  if (!admin) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." });
  }

  // Create a log entry
  const log: AdminLog = {
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminName: admin.name,
    action: `تسجيل دخول ناجح إلى لوحة التحكم الإدارية بصلاحية (${admin.role}).`,
    timestamp: new Date().toISOString()
  };
  databaseState.logs.push(log);
  saveDatabase();

  res.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    }
  });
});

// Admin-Protected API Access (Simple verification from request headers or query params)
// In our prototype, we will verify the user's role from a simple header or token
const checkAdminAuth = (allowedRoles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminId = req.headers["x-admin-id"] as string;
  const admin = databaseState.admins.find((a) => a.id === adminId);
  
  if (!admin) {
    return res.status(403).json({ error: "غير مصرح لك بالوصول. الرجاء تسجيل الدخول أولاً." });
  }

  if (admin.role !== "admin" && !allowedRoles.includes(admin.role)) {
    return res.status(403).json({ error: "صلاحياتك الحالية لا تسمح لك بإجراء هذه العملية." });
  }

  req.body._adminUser = admin; // attach user context
  next();
};

// Log administrative action helper
function logAdminAction(admin: AdminUser, action: string) {
  const log: AdminLog = {
    id: `log_${Date.now()}`,
    adminId: admin.id,
    adminName: admin.name,
    action,
    timestamp: new Date().toISOString()
  };
  databaseState.logs.push(log);
}

// Retrieve Full Admin Database State (Protected)
app.get("/api/admin/full-data", checkAdminAuth(["admin", "content_manager", "member_manager", "event_manager"]), (req, res) => {
  res.json(databaseState);
});

// Update Settings
app.post("/api/admin/settings", checkAdminAuth(["admin"]), (req, res) => {
  const { settings } = req.body;
  if (!settings) return res.status(400).json({ error: "بيانات الإعدادات مفقودة." });
  
  databaseState.settings = { ...databaseState.settings, ...settings };
  logAdminAction(req.body._adminUser, "تحديث إعدادات المركز العامة وبيانات التواصل والـ SEO.");
  saveDatabase();
  res.json({ success: true, settings: databaseState.settings });
});

// Update Theme Design
app.post("/api/admin/theme", checkAdminAuth(["admin"]), (req, res) => {
  const { themeSettings } = req.body;
  if (!themeSettings) return res.status(400).json({ error: "بيانات المظهر مفقودة." });
  
  databaseState.themeSettings = { ...databaseState.themeSettings, ...themeSettings };
  logAdminAction(req.body._adminUser, "تحديث المظهر العام والتصميم اللوني للموقع.");
  saveDatabase();
  res.json({ success: true, themeSettings: databaseState.themeSettings });
});

// Update Font Settings
app.post("/api/admin/fonts", checkAdminAuth(["admin"]), (req, res) => {
  const { fontSettings } = req.body;
  if (!fontSettings) return res.status(400).json({ error: "بيانات الخطوط مفقودة." });
  
  databaseState.fontSettings = { ...databaseState.fontSettings, ...fontSettings };
  logAdminAction(req.body._adminUser, "تحديث إعدادات الخطوط العربية وأحجام العناوين.");
  saveDatabase();
  res.json({ success: true, fontSettings: databaseState.fontSettings });
});

// Board members (Councils) Management
app.post("/api/admin/councils", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { councils } = req.body;
  if (!councils) return res.status(400).json({ error: "بيانات المجالس مفقودة." });
  
  databaseState.councils = councils;
  logAdminAction(req.body._adminUser, "تحديث بيانات أعضاء مجلس الإدارة الحالي والسابق.");
  saveDatabase();
  res.json({ success: true, councils: databaseState.councils });
});

// Reference page management
app.post("/api/admin/reference", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ error: "محتوى الصفحة المرجعية مفقود." });
  
  databaseState.reference = reference;
  logAdminAction(req.body._adminUser, "تحديث محتوى وأوراق الصفحة المرجعية العامة.");
  saveDatabase();
  res.json({ success: true, reference: databaseState.reference });
});

// Programs management
app.post("/api/admin/programs", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { programs } = req.body;
  if (!programs) return res.status(400).json({ error: "قائمة البرامج مفقودة." });
  
  databaseState.programs = programs;
  logAdminAction(req.body._adminUser, "تحديث قائمة الأقسام الرئيسية والفرعية لبرامج المركز.");
  saveDatabase();
  res.json({ success: true, programs: databaseState.programs });
});

// Gallery management
app.post("/api/admin/gallery", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { gallery } = req.body;
  if (!gallery) return res.status(400).json({ error: "بيانات ألبومات الصور مفقودة." });
  
  databaseState.gallery = gallery;
  logAdminAction(req.body._adminUser, "تحديث ألبومات الصور ومعرض الميديا.");
  saveDatabase();
  res.json({ success: true, gallery: databaseState.gallery });
});

// FAQs management
app.post("/api/admin/faqs", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { faqs } = req.body;
  if (!faqs) return res.status(400).json({ error: "قائمة الأسئلة الشائعة مفقودة." });
  
  databaseState.faqs = faqs;
  logAdminAction(req.body._adminUser, "تعديل وتحديث قائمة الأسئلة الشائعة.");
  saveDatabase();
  res.json({ success: true, faqs: databaseState.faqs });
});

// Members admin management (Add/Update/Delete/Approve member profiles)
app.post("/api/admin/members", checkAdminAuth(["admin", "member_manager"]), (req, res) => {
  const { members } = req.body;
  if (!members) return res.status(400).json({ error: "قائمة الأعضاء مفقودة." });

  databaseState.members = members.map((incoming: MemberProfile) => {
    const existing = databaseState.members.find((m) => m.id === incoming.id);
    if (existing?.passwordHash && !incoming.passwordHash) {
      return { ...incoming, passwordHash: existing.passwordHash };
    }
    return incoming;
  });

  logAdminAction(req.body._adminUser, "تحديث وإدارة العضويات الرقمية والمصادقة على التغييرات.");
  saveDatabase();
  res.json({ success: true, members: databaseState.members.map(sanitizeMember) });
});

app.post("/api/admin/members/set-password", checkAdminAuth(["admin", "member_manager"]), (req, res) => {
  const { memberId, password } = req.body;

  if (!memberId || !password) {
    return res.status(400).json({ error: "رقم العضوية وكلمة السر الجديدة مطلوبان." });
  }

  if (String(password).trim().length < 4) {
    return res.status(400).json({ error: "كلمة السر يجب أن تكون 4 أحرف على الأقل." });
  }

  const index = databaseState.members.findIndex(
    (m) => m.id.toLowerCase() === String(memberId).trim().toLowerCase()
  );
  if (index === -1) {
    return res.status(404).json({ error: "العضو غير موجود." });
  }

  databaseState.members[index] = {
    ...databaseState.members[index],
    passwordHash: hashMemberPassword(String(password))
  };

  logAdminAction(
    req.body._adminUser,
    `تغيير كلمة سر العضوية ${databaseState.members[index].id} (${databaseState.members[index].tripleName}).`
  );
  saveDatabase();

  res.json({
    success: true,
    message: "تم تحديث كلمة سر العضوية بنجاح.",
    member: sanitizeMember(databaseState.members[index])
  });
});

// Events admin management (Manage events and participant approvals)
app.post("/api/admin/events", checkAdminAuth(["admin", "event_manager"]), (req, res) => {
  const { events } = req.body;
  if (!events) return res.status(400).json({ error: "قائمة الفعاليات مفقودة." });
  
  databaseState.events = events;
  logAdminAction(req.body._adminUser, "تحديث قائمة الفعاليات وإدارة حضور المسجلين وتأكيد مقاعدهم.");
  saveDatabase();
  res.json({ success: true, events: databaseState.events });
});

// Surveys admin management
app.post("/api/admin/surveys", checkAdminAuth(["admin", "content_manager"]), (req, res) => {
  const { surveys } = req.body;
  if (!surveys) return res.status(400).json({ error: "قائمة الاستبيانات مفقودة." });
  
  databaseState.surveys = surveys;
  logAdminAction(req.body._adminUser, "إدارة الاستبيانات ونشر نماذج تصويت جديدة للأعضاء.");
  saveDatabase();
  res.json({ success: true, surveys: databaseState.surveys });
});

// Notifications admin management
app.post("/api/admin/notifications", checkAdminAuth(["admin", "content_manager", "event_manager"]), (req, res) => {
  const { notifications } = req.body;
  if (!notifications) return res.status(400).json({ error: "قائمة الإشعارات مفقودة." });
  
  databaseState.notifications = notifications;
  logAdminAction(req.body._adminUser, "تحديث وجدولة الإشعارات الداخلية ورسائل الواتساب الجماعية.");
  saveDatabase();
  res.json({ success: true, notifications: databaseState.notifications });
});

// Multi-admin manager additions
app.post("/api/admin/users", checkAdminAuth(["admin"]), (req, res) => {
  const { admins } = req.body;
  if (!admins) return res.status(400).json({ error: "بيانات المدراء مفقودة." });
  
  databaseState.admins = admins;
  logAdminAction(req.body._adminUser, "تحديث قائمة مدراء ومشرّفي المركز وإعداد صلاحياتهم.");
  saveDatabase();
  res.json({ success: true, admins: databaseState.admins });
});

// Backup creation, recovery, and download system
app.post("/api/admin/backups/create", checkAdminAuth(["admin"]), (req, res) => {
  try {
    const backupId = `bk_${Date.now()}`;
    const filename = `backup_${backupId}.json`;
    const filepath = path.join(BACKUPS_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(databaseState, null, 2), "utf-8");
    
    const size = `${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`;
    const newBackup = {
      id: backupId,
      date: new Date().toISOString(),
      type: "يدوي",
      size,
      filename
    };
    
    databaseState.backups.push(newBackup);
    logAdminAction(req.body._adminUser, `إنشاء نسخة احتياطية جديدة لقاعدة البيانات باسم: ${filename}`);
    saveDatabase();
    
    res.json({ success: true, backups: databaseState.backups });
  } catch (err) {
    res.status(500).json({ error: "فشل إنشاء النسخة الاحتياطية." });
  }
});

app.post("/api/admin/backups/restore", checkAdminAuth(["admin"]), (req, res) => {
  const { backupId } = req.body;
  const backup = databaseState.backups.find(b => b.id === backupId);
  if (!backup) return res.status(404).json({ error: "النسخة الاحتياطية غير موجودة." });
  
  try {
    const filepath = path.join(BACKUPS_DIR, backup.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "ملف النسخة الاحتياطية مفقود من الخادم." });
    }
    
    const data = fs.readFileSync(filepath, "utf-8");
    databaseState = JSON.parse(data);
    
    // Log the restore
    logAdminAction(req.body._adminUser, `استعادة قاعدة البيانات بالكامل من النسخة الاحتياطية المؤرشفة: ${backup.filename}`);
    saveDatabase();
    
    res.json({ success: true, message: "تمت استعادة قاعدة البيانات بنجاح!" });
  } catch (err) {
    res.status(500).json({ error: "فشل استعادة قاعدة البيانات." });
  }
});

app.post("/api/admin/backups/delete", checkAdminAuth(["admin"]), (req, res) => {
  const { backupId } = req.body;
  const index = databaseState.backups.findIndex(b => b.id === backupId);
  if (index === -1) return res.status(404).json({ error: "النسخة غير موجودة." });
  
  try {
    const backup = databaseState.backups[index];
    const filepath = path.join(BACKUPS_DIR, backup.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    databaseState.backups.splice(index, 1);
    logAdminAction(req.body._adminUser, `حذف ملف النسخة الاحتياطية: ${backup.filename}`);
    saveDatabase();
    
    res.json({ success: true, backups: databaseState.backups });
  } catch (err) {
    res.status(500).json({ error: "فشل حذف الملف." });
  }
});

// Download full site database as JSON (Admin only)
app.get("/api/admin/backups/download/:filename", (req, res) => {
  const adminId = req.query.adminId as string;
  const admin = databaseState.admins.find((a) => a.id === adminId);
  
  if (!admin || admin.role !== "admin") {
    return res.status(403).send("غير مصرح بالتحميل");
  }

  const filename = req.params.filename;
  let filepath = "";
  
  if (filename === "current-db.json") {
    filepath = DB_PATH;
  } else {
    filepath = path.join(BACKUPS_DIR, filename);
  }

  if (fs.existsSync(filepath)) {
    res.download(filepath, filename);
  } else {
    res.status(404).send("الملف غير موجود");
  }
});

// Upload media/image endpoint (Base64 file receiver)
app.post("/api/upload", (req, res) => {
  const { fileName, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: "اسم الملف ومحتوى الصورة مطلوبان." });
  }

  try {
    // Sanitize file name
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}_${sanitizedName}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    
    // base64 contains metadata prefix (e.g. "data:image/png;base64,...")
    const base64Content = fileData.split(";base64,").pop();
    if (!base64Content) {
      return res.status(400).json({ error: "محتوى الملف غير صالح كـ base64." });
    }

    fs.writeFileSync(filePath, base64Content, { encoding: "base64" });
    const fileUrl = `/data/uploads/${uniqueName}`;
    
    res.json({
      success: true,
      url: fileUrl
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الملف على الخادم." });
  }
});

// Auto-generated Sitemap & Robots for SEO
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://almasqi-sac.org.sa/</loc><priority>1.0</priority></url>
  <url><loc>https://almasqi-sac.org.sa/about</loc><priority>0.8</priority></url>
  <url><loc>https://almasqi-sac.org.sa/reference</loc><priority>0.7</priority></url>
  <url><loc>https://almasqi-sac.org.sa/programs</loc><priority>0.8</priority></url>
  <url><loc>https://almasqi-sac.org.sa/memberships</loc><priority>0.9</priority></url>
  <url><loc>https://almasqi-sac.org.sa/events</loc><priority>0.8</priority></url>
  <url><loc>https://almasqi-sac.org.sa/calendar</loc><priority>0.7</priority></url>
  <url><loc>https://almasqi-sac.org.sa/gallery</loc><priority>0.6</priority></url>
  <url><loc>https://almasqi-sac.org.sa/faqs</loc><priority>0.5</priority></url>
  <url><loc>https://almasqi-sac.org.sa/contact</loc><priority>0.6</priority></url>
</urlset>`;
  res.send(sitemap);
});

app.get("/robots.txt", (req, res) => {
  res.header("Content-Type", "text/plain");
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin/
Sitemap: https://almasqi-sac.org.sa/sitemap.xml`;
  res.send(robots);
});

// Vite Middleware for development + Single Page Application fallback
async function startServer() {
  // Sync state with Firestore on boot if database is connected
  if (firebaseDb) {
    console.log("[ALMASQI SAC] Initializing database synchronization with Firestore...");
    try {
      await loadStateFromFirestore();
    } catch (err) {
      console.error("[ALMASQI SAC] Firestore synchronization failed on boot:", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: { ignored: ["**/data/**"] },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ALMASQI SAC] Server running on http://localhost:${PORT}`);
  });
}

startServer();
