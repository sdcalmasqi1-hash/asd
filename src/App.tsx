/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { getPublicData, applyThemeAndFonts } from "./lib/api";
import { SystemSettings, ThemeSettings, FontSettings, CouncilsData, ReferencePage, MainProgram, EventItem, GalleryAlbum, FAQItem, SurveyItem, MemberProfile } from "./types";
import { FAQSection, ReferenceSection, ContactSection, GallerySection, CalendarSection } from "./components/PublicViews";
import { ProgramsSection } from "./components/ProgramsSection";
import { MembershipSection } from "./components/MembershipSection";
import { EventsSection } from "./components/EventsSection";
import { SurveysSection } from "./components/SurveysSection";
import { AdminDashboard } from "./components/AdminDashboard";
import {
  Menu, X, Search, Moon, Sun, Shield, Compass, BookOpen, Users, FileText, Ticket, BarChart3, Image as ImageIcon, Phone, Mail, MapPin, ExternalLink, ChevronLeft, ArrowRight, CheckCircle, Info, Instagram, Youtube, Twitter, MessageCircle, Facebook, Send, Calendar, ChevronDown
} from "lucide-react";

type AppTab = "home" | "about" | "reference" | "programs" | "memberships" | "events" | "calendar" | "gallery" | "faqs" | "contact" | "admin";
const TAB_STORAGE_KEY = "almasqi_current_tab";
const VALID_TABS: AppTab[] = ["home", "about", "reference", "programs", "memberships", "events", "calendar", "gallery", "faqs", "contact", "admin"];

function parseAppUrlParams(): { tab: AppTab | null; verifyMemberId: string | null } {
  try {
    const pathname = window.location.pathname.replace(/\/$/, "");
    const vMatch = pathname.match(/^\/v\/([^/]+)$/i);
    if (vMatch) {
      return {
        tab: "memberships",
        verifyMemberId: decodeURIComponent(vMatch[1]).trim().toUpperCase()
      };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    const memberParam = searchParams.get("member") || searchParams.get("id");
    return {
      tab: tabParam && VALID_TABS.includes(tabParam as AppTab) ? (tabParam as AppTab) : null,
      verifyMemberId: memberParam?.trim().toUpperCase() || null
    };
  } catch {
    return { tab: null, verifyMemberId: null };
  }
}

function getInitialTab(): AppTab {
  const url = parseAppUrlParams();
  if (url.tab) return url.tab;
  if (url.verifyMemberId) return "memberships";
  try {
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (saved && VALID_TABS.includes(saved as AppTab)) return saved as AppTab;
  } catch {
    // sessionStorage may be unavailable
  }
  return "home";
}

export default function App() {
  // Navigation / Tab state (persisted so admin stays active after saves/reloads)
  const [currentTab, setCurrentTabState] = useState<AppTab>(getInitialTab);

  const setCurrentTab = (tab: AppTab) => {
    setCurrentTabState(tab);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      // ignore
    }
  };
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");

  // Core Database states loaded from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [fontSettings, setFontSettings] = useState<FontSettings | null>(null);
  const [councils, setCouncils] = useState<CouncilsData | null>(null);
  const [reference, setReference] = useState<ReferencePage | null>(null);
  const [programs, setPrograms] = useState<MainProgram[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryAlbum[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);

  // Authenticated member session
  const [loggedInMember, setLoggedInMember] = useState<MemberProfile | null>(() => {
    const saved = localStorage.getItem("loggedInMember");
    return saved ? JSON.parse(saved) : null;
  });

  const [verifyMemberId, setVerifyMemberId] = useState<string | null>(
    () => parseAppUrlParams().verifyMemberId
  );

  // Search Engine states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; tab: any; desc: string }[] | null>(null);

  // Load public data on mount
  useEffect(() => {
    fetchSystemData();
  }, []);

  // Handle QR scan links on mobile (/?tab=memberships&member=ID or /v/ID)
  useEffect(() => {
    try {
      const pathname = window.location.pathname.replace(/\/$/, "");
      const vMatch = pathname.match(/^\/v\/([^/]+)$/i);
      if (vMatch) {
        const id = decodeURIComponent(vMatch[1]).trim().toUpperCase();
        setVerifyMemberId(id);
        setCurrentTab("memberships");
        window.history.replaceState({}, "", `/?tab=memberships&member=${encodeURIComponent(id)}`);
        return;
      }

      const params = parseAppUrlParams();
      if (params.verifyMemberId) {
        setVerifyMemberId(params.verifyMemberId);
        setCurrentTab("memberships");
      } else if (params.tab) {
        setCurrentTab(params.tab);
      }
    } catch {
      // ignore
    }
  }, []);

  // Synchronize dark mode class and dynamic theme CSS variables on root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (themeSettings && fontSettings) {
      applyThemeAndFonts(themeSettings, fontSettings, darkMode);
    }
  }, [darkMode, themeSettings, fontSettings]);

  const fetchSystemData = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const data = await getPublicData();
      
      setSettings(data.settings);
      setThemeSettings(data.themeSettings);
      setFontSettings(data.fontSettings);
      setCouncils(data.councils);
      setReference(data.reference);
      setPrograms(data.programs);
      setEvents(data.events);
      setGallery(data.gallery);
      setFaqs(data.faqs);
      setSurveys(data.surveys);

      // Apply theme & typography to root element
      applyThemeAndFonts(data.themeSettings, data.fontSettings, darkMode);
      setError(null);
    } catch (err: any) {
      if (!options?.silent) {
        setError(err.message || "فشل الاتصال بخادم مركز المسقي الاجتماعي.");
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("darkMode", String(nextMode));
  };

  // Internal Comprehensive Search logic
  const handleInternalSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const matches: { type: string; title: string; tab: any; desc: string }[] = [];
    const qLower = query.toLowerCase();

    // 1. Search programs
    programs.forEach(p => {
      if (p.name.toLowerCase().includes(qLower) || p.description.toLowerCase().includes(qLower)) {
        matches.push({ type: "برنامج رئيسي", title: p.name, tab: "programs", desc: p.description });
      }
      p.subPrograms.forEach(sub => {
        if (sub.title.toLowerCase().includes(qLower) || sub.description.toLowerCase().includes(qLower)) {
          matches.push({ type: "مبادرة فرعية", title: sub.title, tab: "programs", desc: sub.description });
        }
      });
    });

    // 2. Search events
    events.forEach(e => {
      if (e.title.toLowerCase().includes(qLower) || e.shortDesc.toLowerCase().includes(qLower) || e.location.toLowerCase().includes(qLower)) {
        matches.push({ type: "فعالية / ملتقى", title: e.title, tab: "events", desc: e.shortDesc });
      }
    });

    // 3. Search FAQs
    faqs.forEach(f => {
      if (f.question.toLowerCase().includes(qLower) || f.answer.toLowerCase().includes(qLower)) {
        matches.push({ type: "سؤال شائع", title: f.question, tab: "faqs", desc: f.answer });
      }
    });

    // 4. Search reference
    if (reference?.content.toLowerCase().includes(qLower)) {
      matches.push({ type: "اللوائح والمرجعية", title: "المرجعية النظامية للمركز", tab: "reference", desc: "أنظمة ولوائح مركز النشاط الاجتماعي بالمسقي" });
    }

    setSearchResults(matches);
  };

  const getSocialLinks = () => {
    if (settings && settings.socialLinks && Array.isArray(settings.socialLinks) && settings.socialLinks.length > 0) {
      return settings.socialLinks;
    }
    // Fallback to legacy structure
    const fallback: any[] = [];
    if (settings) {
      if (settings.whatsapp) {
        fallback.push({ id: "wa", name: "واتساب", url: `https://wa.me/${settings.whatsapp}`, icon: "MessageCircle" });
      }
      if (settings.socialX) {
        fallback.push({ id: "x", name: "تويتر / X", url: settings.socialX, icon: "Twitter" });
      }
      if (settings.socialInstagram) {
        fallback.push({ id: "ig", name: "إنستغرام", url: settings.socialInstagram, icon: "Instagram" });
      }
      if (settings.socialYouTube) {
        fallback.push({ id: "yt", name: "يوتيوب", url: settings.socialYouTube, icon: "Youtube" });
      }
      if (settings.socialSnapchat) {
        fallback.push({ id: "snap", name: "سناب شات", url: settings.socialSnapchat, icon: "ExternalLink" });
      }
      if (settings.socialTikTok) {
        fallback.push({ id: "tiktok", name: "تيك توك", url: settings.socialTikTok, icon: "ExternalLink" });
      }
    }
    return fallback;
  };

  const renderSocialIcon = (iconName: string, className = "w-5 h-5") => {
    if (iconName && (iconName.startsWith("data:image/") || iconName.startsWith("http://") || iconName.startsWith("https://"))) {
      return <img src={iconName} className={`${className} object-contain rounded`} alt="" referrerPolicy="no-referrer" />;
    }
    switch (iconName?.toLowerCase()) {
      case "twitter":
      case "x":
        return <Twitter className={className} />;
      case "instagram":
        return <Instagram className={className} />;
      case "youtube":
        return <Youtube className={className} />;
      case "whatsapp":
      case "messagecircle":
        return <MessageCircle className={className} />;
      case "facebook":
        return <Facebook className={className} />;
      case "telegram":
      case "send":
        return <Send className={className} />;
      case "phone":
        return <Phone className={className} />;
      case "mail":
        return <Mail className={className} />;
      default:
        return <ExternalLink className={className} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800" style={{ direction: "rtl" }}>
        <div className="w-16 h-16 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-lg font-sans">مركز النشاط الاجتماعي بالمسقي</p>
        <p className="text-xs text-slate-400 mt-1">جاري تحميل المنصة الرقمية الموحدة...</p>
      </div>
    );
  }

  if (error || !settings || !themeSettings || !fontSettings || !councils || !reference) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-4" style={{ direction: "rtl" }}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl max-w-md text-center space-y-4">
          <Info className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-bold">فشل الاتصال بقاعدة البيانات</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error || "تأكد من تشغيل خادم الواجهة الخلفية بشكل صحيح."}</p>
          <button onClick={fetchSystemData} className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl w-full">
            إعادة محاولة الاتصال والتحميل
          </button>
        </div>
      </div>
    );
  }

  const renderCenterName = (context: 'header' | 'hero' | 'footer', baseClass: string, extraStyle?: React.CSSProperties) => {
    const highlightType = settings.centerNameHighlightType || 'none';
    const highlightColor = settings.centerNameHighlightColor || 'rgba(250, 204, 21, 0.2)';
    
    let style: React.CSSProperties = { ...extraStyle };
    let className = baseClass;
    
    if (highlightType === 'marker') {
      style.backgroundColor = highlightColor;
      style.padding = '3px 10px';
      style.borderRadius = '8px';
      style.display = 'inline-block';
    } else if (highlightType === 'shadow') {
      style.textShadow = `0px 2px 8px ${highlightColor}`;
    } else if (highlightType === 'badge') {
      className += " px-4 py-1.5 rounded-xl bg-black/45 backdrop-blur-xs border border-white/10 shadow-xs inline-block";
    }
    
    return (
      <span className={className} style={style}>
        {settings.centerName}
      </span>
    );
  };

  return (
    <div className={`min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 bg-[var(--bg-color)] transition-colors duration-200`} style={{ direction: "rtl" }}>
      
      {/* 1. TOP HEADER NAVIGATION - STYLISH RTL BRANDING */}
      <header className="sticky top-0 z-40 bg-[var(--nav-bg)] border-b border-[var(--border-color)] shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          
          {/* Right Logo & Branding Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("home")}>
            <div className="w-11 h-11 rounded-full border border-[var(--border-color)] overflow-hidden flex items-center justify-center bg-white shadow-xs">
              <img src={settings.logoMini} alt="Center Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              {!settings.centerNameHeaderHide && (
                <h1 className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">
                  {renderCenterName('header', '', settings.centerNameHeaderColor ? { color: settings.centerNameHeaderColor } : undefined)}
                </h1>
              )}
              {!settings.headerSloganHide && (
                <p 
                  className="text-[10px] text-slate-400 hidden sm:block"
                  style={settings.headerSloganColor ? { color: settings.headerSloganColor } : undefined}
                >
                  {settings.headerSlogan || "ملتقى العطاء والمواطنة والتطوير بالمسقي"}
                </p>
              )}
            </div>
          </div>

          {/* Desktop links navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {/* الرئيسية */}
            <button 
              onClick={() => setCurrentTab("home")} 
              className={`hover:text-[var(--primary-color)] transition-colors py-2 cursor-pointer ${currentTab === "home" ? "text-[var(--primary-color)] font-extrabold border-b-2 border-[var(--primary-color)] pb-1" : ""}`}
            >
              الرئيسية
            </button>

            {/* عن المركز - Dropdown */}
            <div className="relative group py-2">
              <button 
                className={`flex items-center gap-1 hover:text-[var(--primary-color)] transition-colors cursor-pointer ${["about", "reference", "faqs"].includes(currentTab) ? "text-[var(--primary-color)] font-extrabold" : ""}`}
              >
                <span>عن المركز</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <button 
                  onClick={() => setCurrentTab("about")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "about" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  النبذة التعريفية (عن المركز)
                </button>
                <button 
                  onClick={() => setCurrentTab("reference")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "reference" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  المرجعية واللوائح التنظيمية
                </button>
                <button 
                  onClick={() => setCurrentTab("faqs")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "faqs" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  الأسئلة الشائعة
                </button>
              </div>
            </div>

            {/* برامجنا */}
            <button 
              onClick={() => setCurrentTab("programs")} 
              className={`hover:text-[var(--primary-color)] transition-colors py-2 cursor-pointer ${currentTab === "programs" ? "text-[var(--primary-color)] font-extrabold border-b-2 border-[var(--primary-color)] pb-1" : ""}`}
            >
              برامجنا
            </button>

            {/* الأنشطة والفعاليات - Dropdown */}
            <div className="relative group py-2">
              <button 
                className={`flex items-center gap-1 hover:text-[var(--primary-color)] transition-colors cursor-pointer ${["events", "calendar", "gallery"].includes(currentTab) ? "text-[var(--primary-color)] font-extrabold" : ""}`}
              >
                <span>الفعاليات والأنشطة</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <button 
                  onClick={() => setCurrentTab("events")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "events" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  الفعاليات والملتقيات
                </button>
                <button 
                  onClick={() => setCurrentTab("calendar")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "calendar" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  التقويم السنوي الموحد
                </button>
                <button 
                  onClick={() => setCurrentTab("gallery")} 
                  className={`w-full text-right px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer block ${currentTab === "gallery" ? "text-[var(--primary-color)] font-bold bg-[var(--primary-color)]/5" : "text-slate-700 dark:text-slate-300"}`}
                >
                  معرض الصور
                </button>
              </div>
            </div>

            {/* العضويات الرقمية */}
            <button 
              onClick={() => setCurrentTab("memberships")} 
              className={`hover:text-[var(--primary-color)] transition-colors py-2 cursor-pointer ${currentTab === "memberships" ? "text-[var(--primary-color)] font-extrabold border-b-2 border-[var(--primary-color)] pb-1" : ""}`}
            >
              العضويات الرقمية
            </button>

            {/* اتصل بنا */}
            <button 
              onClick={() => setCurrentTab("contact")} 
              className={`hover:text-[var(--primary-color)] transition-colors py-2 cursor-pointer ${currentTab === "contact" ? "text-[var(--primary-color)] font-extrabold border-b-2 border-[var(--primary-color)] pb-1" : ""}`}
            >
              اتصل بنا
            </button>
          </nav>

          {/* Left Buttons: Search, Theme, Admin Gate */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-[var(--border-color)] rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              title="تغيير المظهر"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>

            {/* Admin Portal Gateway */}
            <button
              onClick={() => setCurrentTab("admin")}
              className={`p-2 border rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                currentTab === "admin" ? "bg-[var(--primary-color)] text-white border-[var(--primary-color)]" : "border-[var(--border-color)] hover:bg-slate-50"
              }`}
              title="لوحة الإشراف والتحكم"
            >
              <Shield className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-bold">بوابة المشرف</span>
            </button>

            {/* Mobile Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 border border-[var(--border-color)] rounded-xl hover:bg-slate-50 cursor-pointer"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Hamburger Side Drawer overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop blur */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Sidebar drawer panel */}
            <div className="lg:hidden fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-[var(--nav-bg)] shadow-2xl z-55 flex flex-col transition-transform duration-300 transform translate-x-0 border-l border-[var(--border-color)] overflow-hidden h-full">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-slate-50 dark:bg-black/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border border-[var(--border-color)] overflow-hidden flex items-center justify-center bg-white shadow-xs">
                    <img src={settings.logoMini} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    {!settings.centerNameHeaderHide && (
                      <h2 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                        {renderCenterName('header', '', settings.centerNameHeaderColor ? { color: settings.centerNameHeaderColor } : undefined)}
                      </h2>
                    )}
                    <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">القائمة الرئيسية</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 border border-[var(--border-color)] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {[
                  { id: "home", label: "الرئيسية", icon: <Compass className="w-4 h-4" /> },
                  { id: "about", label: "عن المركز", icon: <Info className="w-4 h-4" /> },
                  { id: "reference", label: "المرجعية واللوائح", icon: <BookOpen className="w-4 h-4" /> },
                  { id: "programs", label: "برامجنا وأنشطتنا", icon: <Users className="w-4 h-4" /> },
                  { id: "memberships", label: "العضويات الرقمية", icon: <FileText className="w-4 h-4" /> },
                  { id: "events", label: "الفعاليات والملتقيات", icon: <Ticket className="w-4 h-4" /> },
                  { id: "calendar", label: "التقويم الموحد", icon: <Calendar className="w-4 h-4" /> },
                  { id: "gallery", label: "معرض الصور", icon: <ImageIcon className="w-4 h-4" /> },
                  { id: "faqs", label: "الأسئلة الشائعة", icon: <Info className="w-4 h-4" /> },
                  { id: "contact", label: "اتصل بنا", icon: <Phone className="w-4 h-4" /> }
                ].map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all font-semibold text-xs text-right cursor-pointer border ${
                        isActive
                          ? "bg-[var(--primary-color)]/10 text-[var(--primary-color)] border-[var(--primary-color)]/30 font-bold pr-4 pl-3"
                          : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 pr-3.5 pl-3.5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-[var(--primary-color)]" : "text-slate-400 dark:text-slate-500"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      
                      <ChevronLeft className={`w-4 h-4 transition-transform ${isActive ? "text-[var(--primary-color)] translate-x-[-2px]" : "text-slate-300 dark:text-slate-600"}`} />
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer - Social links & branding */}
              <div className="p-5 border-t border-[var(--border-color)] bg-slate-50 dark:bg-slate-900/30 text-center space-y-3.5">
                <div className="flex items-center justify-center gap-3 text-slate-400">
                  {settings.socialX && (
                    <a href={settings.socialX} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[var(--border-color)] rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-[var(--primary-color)] transition-all">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialInstagram && (
                    <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[var(--border-color)] rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-[var(--primary-color)] transition-all">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {settings.socialYouTube && (
                    <a href={settings.socialYouTube} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[var(--border-color)] rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-[var(--primary-color)] transition-all">
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {settings.whatsapp && (
                    <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-[var(--border-color)] rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-[var(--primary-color)] transition-all">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {settings.centerName} - المنصة الرقمية الرسمية
                </p>
              </div>

            </div>
          </>
        )}
      </header>

      {/* 2. DYNAMIC BROAD SEARCH BAR AND REAL-TIME POPUP MODAL */}
      <div className="bg-slate-100/50 py-4 border-b border-[var(--border-color)] no-print">
        <div className="max-w-4xl mx-auto px-4 relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInternalSearch(e.target.value)}
              placeholder="البحث الشامل والمباشر في اللوائح، البرامج، الفعاليات، والأسئلة الشائعة..."
              className="w-full p-3.5 pr-11 border border-[var(--border-color)] rounded-2xl bg-white text-sm font-semibold shadow-xs"
            />
            <Search className="absolute right-4 top-4 text-slate-400 w-5 h-5" />
          </div>

          {/* Real-time search result overlay popover */}
          {searchResults && (
            <div className="absolute top-16 right-4 left-4 bg-white border border-[var(--border-color)] rounded-2xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto space-y-3 text-right">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-bold text-xs text-slate-400">نتائج البحث الشامل ({searchResults.length})</span>
                <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="text-xs text-rose-600 hover:underline">إغلاق</button>
              </div>

              {searchResults.length === 0 ? (
                <p className="text-xs opacity-60 text-center py-4">لم نجد أي نتائج مطابقة لبحثك.</p>
              ) : (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setCurrentTab(res.tab);
                      setSearchQuery("");
                      setSearchResults(null);
                    }}
                    className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-dashed border-transparent hover:border-[var(--primary-color)] transition-all space-y-1"
                  >
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[var(--primary-color)]">{res.type}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800">{res.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{res.desc}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. HERO PARALLAX BANNER (Only displays on Homepage tab) */}
      {currentTab === "home" && (
        <section className="relative overflow-hidden bg-neutral-950 text-white min-h-[460px] flex items-center justify-center py-12 px-4 no-print">
          <div className="absolute inset-0 z-0" style={{ opacity: (settings.mainCoverOpacity ?? 25) / 100 }}>
            <img src={settings.mainCover || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"} alt="Al-Masqi Cover image" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            {!settings.heroBadgeHide && (
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/25 border border-yellow-400/40 rounded-full text-xs font-bold text-yellow-300"
                style={settings.heroBadgeColor ? { color: settings.heroBadgeColor, borderColor: `${settings.heroBadgeColor}40`, backgroundColor: `${settings.heroBadgeColor}15` } : undefined}
              >
                <Compass className="w-4 h-4 animate-spin-slow" />
                {settings.heroBadge || "منصة مركز المسقي الرقمية الرسمية المعتمدة"}
              </div>
            )}

            {!settings.centerNameHeroHide && (
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
                {renderCenterName('hero', '', settings.centerNameHeroColor ? { color: settings.centerNameHeroColor } : undefined)}
              </h1>
            )}
            
            {!settings.heroDescriptionHide && (
              <p 
                className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
                style={settings.heroDescriptionColor ? { color: settings.heroDescriptionColor } : undefined}
              >
                {settings.heroDescription || "بلدة الأجداد التراثية والتاريخية عسير، والنشاط الاجتماعي الممتد لخدمة الأجيال وتمكين الطاقات الإيجابية وتدشين لجان الرعاية المجتمعية."}
              </p>
            )}

            {/* Quick Action Bento triggers */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <button
                onClick={() => setCurrentTab("memberships")}
                className="px-6 py-3 bg-[var(--button-bg)] text-[var(--button-text)] font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center gap-2 text-sm"
              >
                <Users className="w-5 h-5" />
                إصدار بطاقتك الرقمية الفورية
              </button>
              <button
                onClick={() => setCurrentTab("events")}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 text-sm"
              >
                <Ticket className="w-5 h-5 text-yellow-400" />
                احجز مقعدك بالملتقيات القادمة
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. MAIN LAYOUT CONTAINER VIEWPORT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HOMEPAGE VIEW TAB */}
        {currentTab === "home" && (
          <div className="space-y-16" id="view-home">
            
            {/* Center Introduction Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-[var(--border-color)] p-6 md:p-8 rounded-3xl shadow-xs">
              <div className="lg:col-span-4 h-64 rounded-2xl overflow-hidden bg-slate-100">
                <img src={settings.logoMini} alt="Al-Masqi Center badge" className="w-full h-full object-contain p-6 hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              </div>
              <div className="lg:col-span-8 space-y-4">
                {!settings.introTitleHide && (
                  <h3 
                    className="text-2xl font-bold text-[var(--primary-color)]"
                    style={settings.introTitleColor ? { color: settings.introTitleColor } : undefined}
                  >
                    {settings.introTitle || "توطئة وتعريف بمركز النشاط الاجتماعي بالمسقي"}
                  </h3>
                )}
                {!settings.introDescriptionHide && (
                  <p 
                    className="text-sm opacity-90 leading-relaxed text-justify"
                    style={settings.introDescriptionColor ? { color: settings.introDescriptionColor } : undefined}
                  >
                    {settings.introDescription || "يعد مركز النشاط الاجتماعي بالمسقي أحد المنارات البارزة في قرية المسقي التاريخية بمنطقة عسير، حيث يشكل المحور الأساس لجمع أهالي وأبناء القرية تحت مظلة وطنية وتنموية وثقافية متكاملة. يسعى المركز من خلال برامجه المستمرة لغرس روح المواطنة الفاعلة، وإحياء العمل التطوعي كقيمة أصيلة، وتنظيم الملتقيات الشبابية والرياضية والاجتماعية التي تخدم كافة الفئات العمرية."}
                  </p>
                )}
                
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setCurrentTab("about")} className="text-xs font-bold text-[var(--primary-color)] flex items-center gap-1 hover:underline">
                    اقرأ المزيد عن لجاننا ومجلس الإدارة <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-white border border-[var(--border-color)] rounded-3xl shadow-xs space-y-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                  01
                </div>
                <h4 className="font-bold text-lg">{settings.feature1Title || "بناء مجتمعي فاعل"}</h4>
                <p className="text-xs opacity-75 leading-relaxed">{settings.feature1Desc || "تكامل حقيقي بين لجان الرعاية والشباب لخدمة قرية المسقي الأثرية."}</p>
              </div>
              <div className="p-6 bg-white border border-[var(--border-color)] rounded-3xl shadow-xs space-y-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
                  02
                </div>
                <h4 className="font-bold text-lg">{settings.feature2Title || "تمكين العمل التطوعي"}</h4>
                <p className="text-xs opacity-75 leading-relaxed">{settings.feature2Desc || "منصات وفرص تطوعية مستمرة تتيح للشباب فرصة البناء والترشح."}</p>
              </div>
              <div className="p-6 bg-white border border-[var(--border-color)] rounded-3xl shadow-xs space-y-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center font-bold">
                  03
                </div>
                <h4 className="font-bold text-lg">{settings.feature3Title || "تحول رقمي متكامل"}</h4>
                <p className="text-xs opacity-75 leading-relaxed">{settings.feature3Desc || "أول مركز اجتماعي يوفر بطاقات عضوية رقمية مدعمة بالتحقق عبر الباركود."}</p>
              </div>
            </div>

            {/* Featured Events row (Bento-grid) */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-[var(--primary-color)]" />
                    الفعاليات الحالية والقادمة
                  </h3>
                  <p className="text-xs opacity-70">أحدث الملتقيات الرياضية والثقافية بمركز المسقي</p>
                </div>
                <button onClick={() => setCurrentTab("events")} className="text-xs font-bold text-[var(--primary-color)] hover:underline">عرض جميع الفعاليات &larr;</button>
              </div>

              <EventsSection
                events={events.slice(0, 3)}
                loggedInMember={loggedInMember}
                onEventRegisteredSuccess={(updatedEvent) => {
                  const updatedList = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
                  setEvents(updatedList);
                }}
              />
            </div>

            {/* Photo Gallery Featured Albums row */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-[var(--primary-color)]" />
                    آخر التغطيات المصورة من الميدان
                  </h3>
                  <p className="text-xs opacity-70">توثيق حي للحظات البهجة والعمل في فعاليات المسقي</p>
                </div>
                <button onClick={() => setCurrentTab("gallery")} className="text-xs font-bold text-[var(--primary-color)] hover:underline">استعراض الألبومات بالكامل &larr;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.slice(0, 3).map((alb) => (
                  <div
                    key={alb.id}
                    onClick={() => setCurrentTab("gallery")}
                    className="cursor-pointer group bg-white border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs hover:shadow-sm"
                  >
                    <div className="h-44 bg-slate-100 overflow-hidden relative">
                      <img src={alb.coverImage} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-md">
                        {alb.photos.length} صور
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-[var(--primary-color)] transition-colors">{alb.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{alb.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ABOUT US AND COUNCILS MEMBERS ROW */}
        {currentTab === "about" && councils && (
          <div className="space-y-12" id="view-about">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--primary-color)]">من نحن - مركز المسقي الاجتماعي</h1>
              <p className="text-sm opacity-80 mt-2">تعرف على رسالتنا ونبذتنا التعريفية ومجلس الإدارة واللجان القائمة على رعاية شؤون ملتقى المسقي</p>
            </div>

            {/* Introductory Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 bg-white border border-[var(--border-color)] rounded-3xl p-6 md:p-8 space-y-4 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-slate-900 border-b pb-2">النبذة التعريفية للمركز</h3>
                <p className="text-sm opacity-95 leading-relaxed text-justify text-slate-700">
                  {councils.introText || "يفخر مركز النشاط الاجتماعي بالمسقي بمسيرته العطرة التي قادها رجال مخلصون، عملوا بكل جد واجتهاد لخدمة المجتمع المحلي والارتقاء بالأنشطة والبرامج التنموية والاجتماعية في قرية المسقي الجميلة."}
                </p>
              </div>
              <div className="lg:col-span-5 bg-white border border-[var(--border-color)] rounded-3xl p-6 md:p-8 space-y-4 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-slate-900 border-b pb-2">رؤيتنا ورسالتنا وقيمنا الراسخة</h3>
                <p className="text-sm opacity-95 leading-relaxed text-justify text-slate-700">
                  إن رؤيتنا تتبلور في قيادة العمل الاجتماعي الأهلي بمنطقة عسير لتكون بلدة المسقي نموذجاً حياً للمشاريع التربوية والتطوعية المتميزة. نهدف إلى تقديم مجموعة شاملة من الخدمات والمبادرات التنموية لتمكين الطاقات البشرية، ودعم المواهب، وتيسير قنوات التدريب، بما يدعم رؤية المملكة 2030 في رفع نسب جودة الحياة ونشر الوعي الثقافي والتنموي.
                </p>
              </div>
            </div>

            {/* Current Council Grid */}
            <div className="space-y-6">
              <div className="text-center md:text-right border-r-4 border-[var(--primary-color)] pr-4">
                <h3 className="text-2xl font-bold text-slate-800">مجلس الإدارة واللجان المعتمدة (الدورة الحالية)</h3>
                <p className="text-xs opacity-70 mt-1">النخبة القائمة على متابعة وتوجيه مشاريع وبرامج مركز المسقي الاجتماعي</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {councils.current && councils.current.sort((a, b) => a.order - b.order).map((member) => (
                  <div key={member.id} className="bg-white border border-[var(--border-color)] rounded-2xl p-5 text-center space-y-4 shadow-xs hover:shadow-md transition-all duration-200">
                    <div className="w-24 h-24 rounded-full overflow-hidden mx-auto bg-slate-100 border-2 border-[var(--primary-color)] shadow-xs">
                      <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{member.name}</h4>
                      <p className="text-xs text-[var(--primary-color)] font-semibold mt-1">{member.role}</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-h-24 overflow-y-auto">{member.bio}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Council Grid */}
            {councils.previous && councils.previous.length > 0 && (
              <div className="space-y-6 pt-6">
                <div className="text-center md:text-right border-r-4 border-slate-400 pr-4">
                  <h3 className="text-xl font-bold text-slate-800">أعضاء مجلس الإدارة السابقين (لهم منا جزيل العرفان)</h3>
                  <p className="text-xs opacity-70 mt-1">الرجال المخلصين الذين ساهموا في تأسيس وبناء مسيرة المركز المباركة</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {councils.previous.sort((a, b) => a.order - b.order).map((member) => (
                    <div key={member.id} className="bg-slate-50 border border-[var(--border-color)] rounded-2xl p-5 text-center space-y-4 shadow-xs opacity-90">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto bg-slate-100 border-2 border-slate-300 shadow-xs">
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-700">{member.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold mt-1">{member.role}</p>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed max-h-24 overflow-y-auto">{member.bio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGULATORY LEGAL AND DOCUMENTS REFERENCES VIEW */}
        {currentTab === "reference" && reference && (
          <ReferenceSection reference={reference} />
        )}

        {/* SIX CORE MAIN PROGRAMS DRAWER */}
        {currentTab === "programs" && programs.length > 0 && (
          <ProgramsSection
            programs={programs}
            loggedInMember={loggedInMember}
            onProgramUpdated={(updatedProgram) => {
              const updatedList = programs.map(p => p.id === updatedProgram.id ? updatedProgram : p);
              setPrograms(updatedList);
            }}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* MEMBESHIP LOGIN/REGISTRATION/RECOVERY MODULE */}
        {currentTab === "memberships" && (
          <MembershipSection
            settings={settings}
            loggedInMember={loggedInMember}
            verifyMemberId={verifyMemberId}
            onClearVerify={() => {
              setVerifyMemberId(null);
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete("member");
                url.searchParams.delete("id");
                const qs = url.searchParams.toString();
                window.history.replaceState({}, "", qs ? `${url.pathname}?${qs}` : url.pathname);
              } catch {
                // ignore
              }
            }}
            onLoginSuccess={(member) => {
              setLoggedInMember(member);
              localStorage.setItem("loggedInMember", JSON.stringify(member));
            }}
            onLogout={() => {
              setLoggedInMember(null);
              localStorage.removeItem("loggedInMember");
            }}
          />
        )}

        {/* BOOKABLE EVENT SYSTEMS */}
        {currentTab === "events" && (
          <EventsSection
            events={events}
            loggedInMember={loggedInMember}
            onEventRegisteredSuccess={(updatedEvent) => {
              const updatedList = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
              setEvents(updatedList);
            }}
          />
        )}

        {/* UNIFIED INTERACTIVE ANNUAL CALENDAR */}
        {currentTab === "calendar" && (
          <CalendarSection
            events={events}
            programs={programs}
            loggedInMember={loggedInMember}
            onProgramUpdated={(updatedProgram) => {
              const updatedList = programs.map(p => p.id === updatedProgram.id ? updatedProgram : p);
              setPrograms(updatedList);
            }}
            onEventRegisteredSuccess={(updatedEvent) => {
              const updatedList = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
              setEvents(updatedList);
            }}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* PHOTO ALBUMS GALLERY */}
        {currentTab === "gallery" && (
          <GallerySection albums={gallery} />
        )}

        {/* COMMONS GENERAL ACCORDION FAQS */}
        {currentTab === "faqs" && (
          <FAQSection faqs={faqs} />
        )}

        {/* PUBLIC CONTACT US COMPONENT */}
        {currentTab === "contact" && (
          <ContactSection settings={settings} />
        )}

        {/* PORTAL ADMINISTRATOR BACKEND CONSOLE */}
        {currentTab === "admin" && (
          <AdminDashboard
            currentTheme={themeSettings}
            currentFonts={fontSettings}
            onSystemUpdate={(options) => fetchSystemData(options)}
          />
        )}

      </main>

      {/* 5. VISUALLY SPLENDID FOOTER WITH AL-MASQI ATTRIBUTION */}
      <footer className="bg-[var(--footer-bg)] text-slate-400 py-12 border-t border-[var(--border-color)]/20 mt-20 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          
          {/* Logo representation and name */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden mb-2">
              <img src={settings.logoMini} alt="AlMasqi Center logo" className="w-10 h-10 object-contain" />
            </div>
            {!settings.centerNameFooterHide && (
              <h4 className="font-extrabold text-lg text-white">
                {renderCenterName('footer', '', settings.centerNameFooterColor ? { color: settings.centerNameFooterColor } : undefined)}
              </h4>
            )}
            {!settings.footerDescriptionHide && (
              <p 
                className="text-xs max-w-lg mx-auto leading-relaxed text-slate-400"
                style={settings.footerDescriptionColor ? { color: settings.footerDescriptionColor } : undefined}
              >
                {settings.footerDescription || "ملتقى يجمع الأصالة والعراقة والتطوع الأهلي بالمسقي، عسير، المملكة العربية السعودية."}
              </p>
            )}
          </div>

          {/* Social media icons dynamically configured with custom hover actions */}
          <div className="flex justify-center gap-6 text-slate-400">
            {getSocialLinks().map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:scale-110 transition-all"
                title={link.name}
              >
                {renderSocialIcon(link.icon)}
              </a>
            ))}
          </div>

          <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row justify-between items-center text-xs gap-4 max-w-5xl mx-auto">
            {!settings.copyrightTextHide && (
              <p 
                className="opacity-70"
                style={settings.copyrightTextColor ? { color: settings.copyrightTextColor } : undefined}
              >
                {settings.copyrightText || "صنع بحب في قرية المسقي - جميع الحقوق محفوظة © 2026"}
              </p>
            )}
            <div className="flex gap-4">
              <button onClick={() => setCurrentTab("reference")} className="hover:underline">اللوائح المرجعية</button>
              <button onClick={() => setCurrentTab("faqs")} className="hover:underline">الأسئلة الشائعة</button>
              <button onClick={() => setCurrentTab("contact")} className="hover:underline">تواصل معنا</button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
