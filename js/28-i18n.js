// GEST Africa — Internationalisation (i18n).
// 2e tranche du chantier "Paramètres > Langue" - le français reste la
// langue source (clé de traduction = la chaîne française elle-même,
// c'est le retrofit le plus praticable sur une app déjà entièrement
// écrite en français en dur, plutôt que d'inventer un espace de clés
// abstrait et de réécrire chaque site d'appel). Langues construites
// cette passe (confiance de traduction élevée, y compris le
// vocabulaire comptable) : anglais, arabe, finnois, allemand, espagnol,
// portugais. Le yoruba/l'éwé/le fon/d'autres langues africaines sont
// volontairement remis à plus tard (voir la discussion) - ma confiance
// sur la terminologie comptable dans ces langues est trop faible pour
// livrer quelque chose de fiable sans relecture native.
//
// Couverture RÉELLE de cette passe (à annoncer honnêtement) : le
// "chrome" de l'app - barre latérale (tous les libellés de modules,
// tous hubs confondus), barre du bas, écran d'accueil, écrans de
// connexion/inscription, panneau Paramètres. PAS COUVERT : le contenu
// détaillé à l'intérieur de chaque module (en-têtes de tableaux,
// libellés de formulaires, messages toast/alert, texte des PDF) - un
// chantier bien plus large, à faire progressivement module par module.
// Ce fichier doit être chargé après js/15-v19-specializations.js et
// js/27-parametres.js (dernier de la liste dans index.html) puisqu'il
// re-déclenche leurs rendus.
(function(){
'use strict';

var LS_LANG='comptaia_langue';

var LANGUES={
  fr:{nom:'Français',dir:'ltr'},
  en:{nom:'English',dir:'ltr'},
  ar:{nom:'العربية',dir:'rtl'},
  fi:{nom:'Suomi',dir:'ltr'},
  de:{nom:'Deutsch',dir:'ltr'},
  es:{nom:'Español',dir:'ltr'},
  pt:{nom:'Português',dir:'ltr'},
  zh:{nom:'中文',dir:'ltr'},
  ja:{nom:'日本語',dir:'ltr'}
};

var I18N={
en:{
  // Barre du bas
  'Accueil':'Home','Trésorerie':'Treasury','Déclarations':'Filings','Chat IA':'AI Chat','Utilisateurs':'Users','Paramètres':'Settings',
  'Accueil — spécialisations':'Home — workspaces','Outils IA':'AI Tools',
  // Hubs
  'Exploitant':'Operations','Comptable':'Accounting','Fiscalité':'Tax','Ressources Humaines':'Human Resources','Trésorier':'Treasurer','IA':'AI',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'Daily operations: sales, customers, stock, production and company.',
  'Journal, grand livre, balance et travaux de clôture.':'Journal, general ledger, trial balance and closing work.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'Simulator and tax calendar - filings are now under the Filings tab.',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'Full employee lifecycle: records, contracts, attendance, leave, payroll, career, documents.',
  'Soldes, banques et suivi.':'Balances, banks and tracking.',
  'Outils intelligents.':'Smart tools.',
  'Déclarations fiscales et administratives, états financiers.':'Tax and administrative filings, financial statements.',
  // Écran d'accueil
  'Choisissez votre espace de travail':'Choose your workspace',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'Each workspace groups its modules in the side menu.',
  // Libellés de modules (barre latérale, tous hubs)
  'Tableau de bord':'Dashboard','Ventes':'Sales','Factures':'Invoices','Devis':'Quotes','Bons de commande':'Purchase orders',
  'Bons de livraison':'Delivery notes','Factures récurrentes':'Recurring invoices','Caisse / PDV':'Cash register / POS',
  'Clients / Fournisseurs':'Customers / Suppliers','Stock':'Inventory',"Entrées de stock":'Stock in','Sorties de stock':'Stock out',
  'Alertes stock':'Stock alerts','Rapport de stock':'Stock report','Production':'Production','Entreprise':'Company',
  'Journal':'Journal','Grand livre':'General ledger','Lettrage':'Reconciliation (accounts)','Balance':'Trial balance',
  'Immobilisations':'Fixed assets','Inventaire':'Physical inventory','Provisions':'Provisions','Multi-devises':'Multi-currency',
  'Rapprochement bancaire':'Bank reconciliation','Comptabilité analytique':'Cost accounting','Emprunts':'Loans',
  'Simulateur fiscal':'Tax simulator','Calendrier fiscal':'Tax calendar','Exercice fiscal':'Fiscal year',
  'Déclaration de TVA':'VAT return','Déclaration IS':'Corporate tax return','Retenues à la source':'Withholding tax',
  'Salaires & cotisations sociales':'Payroll & social contributions','Liasse fiscale annuelle':'Annual tax package',
  'Bilan':'Balance sheet','Compte de résultat':'Income statement','Flux de trésorerie':'Cash flow statement','Notes annexes':'Notes to accounts',
  'Employés':'Employees','Contrats':'Contracts','Présence & pointage':'Attendance & time tracking','Congés':'Leave',
  'Paie & bulletins':'Payroll & payslips','Performance':'Performance','Formation':'Training','Recrutement':'Recruitment',
  'Santé & sécurité':'Health & safety','Discipline':'Discipline','Documents RH':'HR documents','Tableau de bord RH':'HR dashboard',
  'Solde':'Balance','Suivi de trésorerie':'Cash tracking','Prévisions':'Forecasts','Score financier':'Financial score','Benchmarks':'Benchmarks',
  'OCR':'OCR',
  // Auth
  'E-mail':'Email','Mot de passe':'Password','Se connecter':'Log in','Mot de passe oublié ?':'Forgot password?','Réinitialiser':'Reset',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'Forgot/disabled account? Contact your administrator — accounts can only be created from "User management".',
  'Première utilisation ?':'First time here?','Créer votre entreprise':'Create your company',
  'Créer votre entreprise et votre compte administrateur':'Create your company and admin account',
  'Pays':'Country',"Secteur d'activité":'Industry','Forme juridique':'Legal form',"Nom de l'entreprise":'Company name',
  'Votre nom complet':'Your full name','Créer l\'entreprise':'Create company','Déjà un compte ?':'Already have an account?',
  'Choisissez votre mot de passe pour activer votre compte':'Choose your password to activate your account','Activer mon compte':'Activate my account',
  // Paramètres
  'Apparence':'Appearance','Luminosité':'Brightness',"Couleur d'accent":'Accent color','Police':'Font','Intensité des ombres':'Shadow intensity',
  'Compte':'Account','Nom complet':'Full name','Enregistrer le nom':'Save name','Changer le mot de passe':'Change password',
  'Votre avis':'Your feedback','Commentaire (facultatif)':'Comment (optional)','Envoyer mon avis':'Send feedback','Langue':'Language'
},
ar:{
  'Accueil':'الرئيسية','Trésorerie':'الخزينة','Déclarations':'التصريحات','Chat IA':'محادثة الذكاء الاصطناعي','Utilisateurs':'المستخدمون','Paramètres':'الإعدادات',
  'Accueil — spécialisations':'الرئيسية — مساحات العمل','Outils IA':'أدوات الذكاء الاصطناعي',
  'Exploitant':'الاستغلال','Comptable':'المحاسبة','Fiscalité':'الضرائب','Ressources Humaines':'الموارد البشرية','Trésorier':'أمين الخزينة','IA':'الذكاء الاصطناعي',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'العمليات اليومية: المبيعات، العملاء، المخزون، الإنتاج والشركة.',
  'Journal, grand livre, balance et travaux de clôture.':'اليومية، دفتر الأستاذ، ميزان المراجعة وأعمال الإقفال.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'محاكي وتقويم ضريبي - أصبحت التصريحات الآن ضمن علامة التبويب "التصريحات".',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'دورة حياة الموظف الكاملة: الملفات، العقود، الحضور، الإجازات، الرواتب، المسار المهني، الوثائق.',
  'Soldes, banques et suivi.':'الأرصدة، البنوك والمتابعة.',
  'Outils intelligents.':'أدوات ذكية.',
  'Déclarations fiscales et administratives, états financiers.':'التصريحات الضريبية والإدارية، القوائم المالية.',
  'Choisissez votre espace de travail':'اختر مساحة عملك',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'كل مساحة عمل تجمع وحداتها في القائمة الجانبية.',
  'Tableau de bord':'لوحة القيادة','Ventes':'المبيعات','Factures':'الفواتير','Devis':'عروض الأسعار','Bons de commande':'أوامر الشراء',
  'Bons de livraison':'إشعارات التسليم','Factures récurrentes':'الفواتير المتكررة','Caisse / PDV':'الصندوق / نقطة البيع',
  'Clients / Fournisseurs':'العملاء / الموردون','Stock':'المخزون',"Entrées de stock":'إدخالات المخزون','Sorties de stock':'إخراجات المخزون',
  'Alertes stock':'تنبيهات المخزون','Rapport de stock':'تقرير المخزون','Production':'الإنتاج','Entreprise':'الشركة',
  'Journal':'اليومية','Grand livre':'دفتر الأستاذ','Lettrage':'المطابقة المحاسبية','Balance':'ميزان المراجعة',
  'Immobilisations':'الأصول الثابتة','Inventaire':'الجرد المادي','Provisions':'المخصصات','Multi-devises':'متعدد العملات',
  'Rapprochement bancaire':'التسوية البنكية','Comptabilité analytique':'محاسبة التكاليف','Emprunts':'القروض',
  'Simulateur fiscal':'المحاكي الضريبي','Calendrier fiscal':'التقويم الضريبي','Exercice fiscal':'السنة المالية',
  'Déclaration de TVA':'تصريح ضريبة القيمة المضافة','Déclaration IS':'تصريح ضريبة الشركات','Retenues à la source':'الاقتطاع من المصدر',
  'Salaires & cotisations sociales':'الرواتب والاشتراكات الاجتماعية','Liasse fiscale annuelle':'الملف الضريبي السنوي',
  'Bilan':'الميزانية العمومية','Compte de résultat':'حساب النتائج','Flux de trésorerie':'قائمة التدفقات النقدية','Notes annexes':'الملاحظات الملحقة',
  'Employés':'الموظفون','Contrats':'العقود','Présence & pointage':'الحضور والانصراف','Congés':'الإجازات',
  'Paie & bulletins':'الرواتب وقسائم الأجر','Performance':'الأداء','Formation':'التدريب','Recrutement':'التوظيف',
  'Santé & sécurité':'الصحة والسلامة','Discipline':'الانضباط','Documents RH':'وثائق الموارد البشرية','Tableau de bord RH':'لوحة قيادة الموارد البشرية',
  'Solde':'الرصيد','Suivi de trésorerie':'متابعة الخزينة','Prévisions':'التوقعات','Score financier':'المؤشر المالي','Benchmarks':'المقارنات المرجعية',
  'OCR':'التعرف الضوئي على الحروف',
  'E-mail':'البريد الإلكتروني','Mot de passe':'كلمة المرور','Se connecter':'تسجيل الدخول','Mot de passe oublié ?':'نسيت كلمة المرور؟','Réinitialiser':'إعادة التعيين',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'حساب منسي أو معطل؟ تواصل مع المسؤول — إنشاء الحسابات يتم فقط من "إدارة المستخدمين".',
  'Première utilisation ?':'أول استخدام؟','Créer votre entreprise':'أنشئ شركتك',
  'Créer votre entreprise et votre compte administrateur':'أنشئ شركتك وحساب المسؤول الخاص بك',
  'Pays':'البلد',"Secteur d'activité":'قطاع النشاط','Forme juridique':'الشكل القانوني',"Nom de l'entreprise":'اسم الشركة',
  'Votre nom complet':'اسمك الكامل','Créer l\'entreprise':'إنشاء الشركة','Déjà un compte ?':'لديك حساب بالفعل؟',
  'Choisissez votre mot de passe pour activer votre compte':'اختر كلمة المرور لتفعيل حسابك','Activer mon compte':'تفعيل حسابي',
  'Apparence':'المظهر','Luminosité':'السطوع',"Couleur d'accent":'لون التمييز','Police':'الخط','Intensité des ombres':'شدة الظلال',
  'Compte':'الحساب','Nom complet':'الاسم الكامل','Enregistrer le nom':'حفظ الاسم','Changer le mot de passe':'تغيير كلمة المرور',
  'Votre avis':'رأيك','Commentaire (facultatif)':'تعليق (اختياري)','Envoyer mon avis':'إرسال رأيي','Langue':'اللغة'
},
fi:{
  'Accueil':'Etusivu','Trésorerie':'Kassavarat','Déclarations':'Ilmoitukset','Chat IA':'Tekoälychat','Utilisateurs':'Käyttäjät','Paramètres':'Asetukset',
  'Accueil — spécialisations':'Etusivu — työtilat','Outils IA':'Tekoälytyökalut',
  'Exploitant':'Toiminta','Comptable':'Kirjanpito','Fiscalité':'Verotus','Ressources Humaines':'Henkilöstöhallinto','Trésorier':'Kassanhoitaja','IA':'Tekoäly',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'Päivittäinen toiminta: myynti, asiakkaat, varasto, tuotanto ja yritys.',
  'Journal, grand livre, balance et travaux de clôture.':'Päiväkirja, pääkirja, tase-erittely ja tilinpäätöstyöt.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'Verosimulaattori ja verokalenteri - ilmoitukset löytyvät nyt Ilmoitukset-välilehdeltä.',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'Koko henkilöstön elinkaari: tiedot, sopimukset, läsnäolo, lomat, palkanlaskenta, ura, asiakirjat.',
  'Soldes, banques et suivi.':'Saldot, pankit ja seuranta.',
  'Outils intelligents.':'Älykkäät työkalut.',
  'Déclarations fiscales et administratives, états financiers.':'Vero- ja hallintoilmoitukset, tilinpäätökset.',
  'Choisissez votre espace de travail':'Valitse työtilasi',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'Jokainen työtila kokoaa moduulinsa sivuvalikkoon.',
  'Tableau de bord':'Kojelauta','Ventes':'Myynti','Factures':'Laskut','Devis':'Tarjoukset','Bons de commande':'Ostotilaukset',
  'Bons de livraison':'Lähetteet','Factures récurrentes':'Toistuvat laskut','Caisse / PDV':'Kassa / Myyntipiste',
  'Clients / Fournisseurs':'Asiakkaat / Toimittajat','Stock':'Varasto',"Entrées de stock":'Varastoon saapuvat','Sorties de stock':'Varastosta lähtevät',
  'Alertes stock':'Varastohälytykset','Rapport de stock':'Varastoraportti','Production':'Tuotanto','Entreprise':'Yritys',
  'Journal':'Päiväkirja','Grand livre':'Pääkirja','Lettrage':'Tilien täsmäytys','Balance':'Tase-erittely',
  'Immobilisations':'Käyttöomaisuus','Inventaire':'Fyysinen inventaario','Provisions':'Varaukset','Multi-devises':'Monivaluutta',
  'Rapprochement bancaire':'Pankkitäsmäytys','Comptabilité analytique':'Kustannuslaskenta','Emprunts':'Lainat',
  'Simulateur fiscal':'Verosimulaattori','Calendrier fiscal':'Verokalenteri','Exercice fiscal':'Tilikausi',
  'Déclaration de TVA':'ALV-ilmoitus','Déclaration IS':'Yhteisöveroilmoitus','Retenues à la source':'Lähdevero',
  'Salaires & cotisations sociales':'Palkat ja sosiaalimaksut','Liasse fiscale annuelle':'Vuotuinen veroaineisto',
  'Bilan':'Tase','Compte de résultat':'Tuloslaskelma','Flux de trésorerie':'Rahavirtalaskelma','Notes annexes':'Liitetiedot',
  'Employés':'Työntekijät','Contrats':'Sopimukset','Présence & pointage':'Läsnäolo ja työajanseuranta','Congés':'Lomat',
  'Paie & bulletins':'Palkanlaskenta ja palkkalaskelmat','Performance':'Suorituskyky','Formation':'Koulutus','Recrutement':'Rekrytointi',
  'Santé & sécurité':'Työterveys ja -turvallisuus','Discipline':'Kurinpito','Documents RH':'HR-asiakirjat','Tableau de bord RH':'HR-kojelauta',
  'Solde':'Saldo','Suivi de trésorerie':'Kassaseuranta','Prévisions':'Ennusteet','Score financier':'Talousindeksi','Benchmarks':'Vertailuarvot',
  'OCR':'OCR-tunnistus',
  'E-mail':'Sähköposti','Mot de passe':'Salasana','Se connecter':'Kirjaudu sisään','Mot de passe oublié ?':'Unohditko salasanan?','Réinitialiser':'Nollaa',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'Unohtunut tai poistettu käyttäjätili? Ota yhteyttä pääkäyttäjään — tilit luodaan vain "Käyttäjähallinta"-osiosta.',
  'Première utilisation ?':'Ensimmäinen kerta?','Créer votre entreprise':'Luo yrityksesi',
  'Créer votre entreprise et votre compte administrateur':'Luo yrityksesi ja pääkäyttäjätilisi',
  'Pays':'Maa',"Secteur d'activité":'Toimiala','Forme juridique':'Yhtiömuoto',"Nom de l'entreprise":'Yrityksen nimi',
  'Votre nom complet':'Koko nimesi','Créer l\'entreprise':'Luo yritys','Déjà un compte ?':'Onko sinulla jo tili?',
  'Choisissez votre mot de passe pour activer votre compte':'Valitse salasana aktivoidaksesi tilisi','Activer mon compte':'Aktivoi tilini',
  'Apparence':'Ulkoasu','Luminosité':'Kirkkaus',"Couleur d'accent":'Korostusväri','Police':'Fontti','Intensité des ombres':'Varjojen voimakkuus',
  'Compte':'Tili','Nom complet':'Koko nimi','Enregistrer le nom':'Tallenna nimi','Changer le mot de passe':'Vaihda salasana',
  'Votre avis':'Palautteesi','Commentaire (facultatif)':'Kommentti (valinnainen)','Envoyer mon avis':'Lähetä palaute','Langue':'Kieli'
},
de:{
  'Accueil':'Start','Trésorerie':'Liquidität','Déclarations':'Meldungen','Chat IA':'KI-Chat','Utilisateurs':'Benutzer','Paramètres':'Einstellungen',
  'Accueil — spécialisations':'Start — Arbeitsbereiche','Outils IA':'KI-Werkzeuge',
  'Exploitant':'Betrieb','Comptable':'Buchhaltung','Fiscalité':'Steuern','Ressources Humaines':'Personalwesen','Trésorier':'Kassenwart','IA':'KI',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'Tägliches Geschäft: Verkauf, Kunden, Lager, Produktion und Unternehmen.',
  'Journal, grand livre, balance et travaux de clôture.':'Journal, Hauptbuch, Saldenliste und Abschlussarbeiten.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'Steuersimulator und Steuerkalender - Meldungen befinden sich jetzt im Reiter Meldungen.',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'Vollständiger Mitarbeiterlebenszyklus: Akten, Verträge, Anwesenheit, Urlaub, Gehaltsabrechnung, Laufbahn, Dokumente.',
  'Soldes, banques et suivi.':'Salden, Banken und Überwachung.',
  'Outils intelligents.':'Intelligente Werkzeuge.',
  'Déclarations fiscales et administratives, états financiers.':'Steuerliche und behördliche Meldungen, Jahresabschlüsse.',
  'Choisissez votre espace de travail':'Wählen Sie Ihren Arbeitsbereich',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'Jeder Arbeitsbereich bündelt seine Module im Seitenmenü.',
  'Tableau de bord':'Übersicht','Ventes':'Verkauf','Factures':'Rechnungen','Devis':'Angebote','Bons de commande':'Bestellungen',
  'Bons de livraison':'Lieferscheine','Factures récurrentes':'Wiederkehrende Rechnungen','Caisse / PDV':'Kasse / Kassensystem',
  'Clients / Fournisseurs':'Kunden / Lieferanten','Stock':'Lager',"Entrées de stock":'Wareneingänge','Sorties de stock':'Warenausgänge',
  'Alertes stock':'Lagerwarnungen','Rapport de stock':'Lagerbericht','Production':'Produktion','Entreprise':'Unternehmen',
  'Journal':'Journal','Grand livre':'Hauptbuch','Lettrage':'Kontenabstimmung','Balance':'Saldenliste',
  'Immobilisations':'Anlagevermögen','Inventaire':'Inventur','Provisions':'Rückstellungen','Multi-devises':'Mehrere Währungen',
  'Rapprochement bancaire':'Bankabstimmung','Comptabilité analytique':'Kostenrechnung','Emprunts':'Darlehen',
  'Simulateur fiscal':'Steuersimulator','Calendrier fiscal':'Steuerkalender','Exercice fiscal':'Geschäftsjahr',
  'Déclaration de TVA':'Umsatzsteuervoranmeldung','Déclaration IS':'Körperschaftsteuererklärung','Retenues à la source':'Quellensteuer',
  'Salaires & cotisations sociales':'Löhne & Sozialabgaben','Liasse fiscale annuelle':'Jährliche Steuerunterlagen',
  'Bilan':'Bilanz','Compte de résultat':'Gewinn- und Verlustrechnung','Flux de trésorerie':'Kapitalflussrechnung','Notes annexes':'Anhang',
  'Employés':'Mitarbeiter','Contrats':'Verträge','Présence & pointage':'Anwesenheit & Zeiterfassung','Congés':'Urlaub',
  'Paie & bulletins':'Lohn- & Gehaltsabrechnung','Performance':'Leistung','Formation':'Weiterbildung','Recrutement':'Rekrutierung',
  'Santé & sécurité':'Gesundheit & Sicherheit','Discipline':'Disziplin','Documents RH':'Personalunterlagen','Tableau de bord RH':'Personal-Übersicht',
  'Solde':'Saldo','Suivi de trésorerie':'Liquiditätsüberwachung','Prévisions':'Prognosen','Score financier':'Finanz-Score','Benchmarks':'Vergleichswerte',
  'OCR':'Texterkennung (OCR)',
  'E-mail':'E-Mail','Mot de passe':'Passwort','Se connecter':'Anmelden','Mot de passe oublié ?':'Passwort vergessen?','Réinitialiser':'Zurücksetzen',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'Konto vergessen/deaktiviert? Wenden Sie sich an Ihren Administrator — Konten werden nur über "Benutzerverwaltung" angelegt.',
  'Première utilisation ?':'Erste Nutzung?','Créer votre entreprise':'Unternehmen erstellen',
  'Créer votre entreprise et votre compte administrateur':'Erstellen Sie Ihr Unternehmen und Ihr Administratorkonto',
  'Pays':'Land',"Secteur d'activité":'Branche','Forme juridique':'Rechtsform',"Nom de l'entreprise":'Firmenname',
  'Votre nom complet':'Ihr vollständiger Name','Créer l\'entreprise':'Unternehmen erstellen','Déjà un compte ?':'Bereits ein Konto?',
  'Choisissez votre mot de passe pour activer votre compte':'Wählen Sie Ihr Passwort, um Ihr Konto zu aktivieren','Activer mon compte':'Konto aktivieren',
  'Apparence':'Erscheinungsbild','Luminosité':'Helligkeit',"Couleur d'accent":'Akzentfarbe','Police':'Schriftart','Intensité des ombres':'Schattenintensität',
  'Compte':'Konto','Nom complet':'Vollständiger Name','Enregistrer le nom':'Namen speichern','Changer le mot de passe':'Passwort ändern',
  'Votre avis':'Ihr Feedback','Commentaire (facultatif)':'Kommentar (optional)','Envoyer mon avis':'Feedback senden','Langue':'Sprache'
},
es:{
  'Accueil':'Inicio','Trésorerie':'Tesorería','Déclarations':'Declaraciones','Chat IA':'Chat IA','Utilisateurs':'Usuarios','Paramètres':'Configuración',
  'Accueil — spécialisations':'Inicio — espacios de trabajo','Outils IA':'Herramientas IA',
  'Exploitant':'Operaciones','Comptable':'Contabilidad','Fiscalité':'Fiscalidad','Ressources Humaines':'Recursos Humanos','Trésorier':'Tesorero','IA':'IA',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'Operaciones diarias: ventas, clientes, stock, producción y empresa.',
  'Journal, grand livre, balance et travaux de clôture.':'Diario, libro mayor, balance de comprobación y cierre contable.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'Simulador y calendario fiscal - las declaraciones ahora están en la pestaña Declaraciones.',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'Ciclo de vida completo del personal: expedientes, contratos, asistencia, vacaciones, nómina, carrera, documentos.',
  'Soldes, banques et suivi.':'Saldos, bancos y seguimiento.',
  'Outils intelligents.':'Herramientas inteligentes.',
  'Déclarations fiscales et administratives, états financiers.':'Declaraciones fiscales y administrativas, estados financieros.',
  'Choisissez votre espace de travail':'Elige tu espacio de trabajo',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'Cada espacio de trabajo agrupa sus módulos en el menú lateral.',
  'Tableau de bord':'Panel','Ventes':'Ventas','Factures':'Facturas','Devis':'Presupuestos','Bons de commande':'Órdenes de compra',
  'Bons de livraison':'Albaranes','Factures récurrentes':'Facturas recurrentes','Caisse / PDV':'Caja / TPV',
  'Clients / Fournisseurs':'Clientes / Proveedores','Stock':'Inventario',"Entrées de stock":'Entradas de stock','Sorties de stock':'Salidas de stock',
  'Alertes stock':'Alertas de stock','Rapport de stock':'Informe de stock','Production':'Producción','Entreprise':'Empresa',
  'Journal':'Diario','Grand livre':'Libro mayor','Lettrage':'Conciliación de cuentas','Balance':'Balance de comprobación',
  'Immobilisations':'Activos fijos','Inventaire':'Inventario físico','Provisions':'Provisiones','Multi-devises':'Multidivisa',
  'Rapprochement bancaire':'Conciliación bancaria','Comptabilité analytique':'Contabilidad de costos','Emprunts':'Préstamos',
  'Simulateur fiscal':'Simulador fiscal','Calendrier fiscal':'Calendario fiscal','Exercice fiscal':'Ejercicio fiscal',
  'Déclaration de TVA':'Declaración de IVA','Déclaration IS':'Declaración del impuesto de sociedades','Retenues à la source':'Retenciones en la fuente',
  'Salaires & cotisations sociales':'Salarios y cotizaciones sociales','Liasse fiscale annuelle':'Expediente fiscal anual',
  'Bilan':'Balance general','Compte de résultat':'Cuenta de resultados','Flux de trésorerie':'Estado de flujos de efectivo','Notes annexes':'Notas a los estados financieros',
  'Employés':'Empleados','Contrats':'Contratos','Présence & pointage':'Asistencia y control horario','Congés':'Vacaciones',
  'Paie & bulletins':'Nómina y recibos','Performance':'Desempeño','Formation':'Formación','Recrutement':'Contratación',
  'Santé & sécurité':'Salud y seguridad','Discipline':'Disciplina','Documents RH':'Documentos de RR.HH.','Tableau de bord RH':'Panel de RR.HH.',
  'Solde':'Saldo','Suivi de trésorerie':'Seguimiento de tesorería','Prévisions':'Previsiones','Score financier':'Puntuación financiera','Benchmarks':'Comparativas',
  'OCR':'OCR',
  'E-mail':'Correo electrónico','Mot de passe':'Contraseña','Se connecter':'Iniciar sesión','Mot de passe oublié ?':'¿Olvidaste tu contraseña?','Réinitialiser':'Restablecer',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'¿Cuenta olvidada o desactivada? Contacta a tu administrador — las cuentas solo se crean desde "Gestión de usuarios".',
  'Première utilisation ?':'¿Primera vez aquí?','Créer votre entreprise':'Crea tu empresa',
  'Créer votre entreprise et votre compte administrateur':'Crea tu empresa y tu cuenta de administrador',
  'Pays':'País',"Secteur d'activité":'Sector de actividad','Forme juridique':'Forma jurídica',"Nom de l'entreprise":'Nombre de la empresa',
  'Votre nom complet':'Tu nombre completo','Créer l\'entreprise':'Crear empresa','Déjà un compte ?':'¿Ya tienes una cuenta?',
  'Choisissez votre mot de passe pour activer votre compte':'Elige tu contraseña para activar tu cuenta','Activer mon compte':'Activar mi cuenta',
  'Apparence':'Apariencia','Luminosité':'Brillo',"Couleur d'accent":'Color de acento','Police':'Tipografía','Intensité des ombres':'Intensidad de sombras',
  'Compte':'Cuenta','Nom complet':'Nombre completo','Enregistrer le nom':'Guardar nombre','Changer le mot de passe':'Cambiar contraseña',
  'Votre avis':'Tu opinión','Commentaire (facultatif)':'Comentario (opcional)','Envoyer mon avis':'Enviar opinión','Langue':'Idioma'
},
pt:{
  'Accueil':'Início','Trésorerie':'Tesouraria','Déclarations':'Declarações','Chat IA':'Chat IA','Utilisateurs':'Usuários','Paramètres':'Configurações',
  'Accueil — spécialisations':'Início — espaços de trabalho','Outils IA':'Ferramentas de IA',
  'Exploitant':'Operações','Comptable':'Contabilidade','Fiscalité':'Fiscalidade','Ressources Humaines':'Recursos Humanos','Trésorier':'Tesoureiro','IA':'IA',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'Operações diárias: vendas, clientes, estoque, produção e empresa.',
  'Journal, grand livre, balance et travaux de clôture.':'Diário, razão geral, balancete e trabalhos de encerramento.',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'Simulador e calendário fiscal - as declarações agora estão na aba Declarações.',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'Ciclo de vida completo do pessoal: cadastros, contratos, presença, férias, folha de pagamento, carreira, documentos.',
  'Soldes, banques et suivi.':'Saldos, bancos e acompanhamento.',
  'Outils intelligents.':'Ferramentas inteligentes.',
  'Déclarations fiscales et administratives, états financiers.':'Declarações fiscais e administrativas, demonstrações financeiras.',
  'Choisissez votre espace de travail':'Escolha seu espaço de trabalho',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'Cada espaço de trabalho agrupa seus módulos no menu lateral.',
  'Tableau de bord':'Painel','Ventes':'Vendas','Factures':'Faturas','Devis':'Orçamentos','Bons de commande':'Pedidos de compra',
  'Bons de livraison':'Guias de remessa','Factures récurrentes':'Faturas recorrentes','Caisse / PDV':'Caixa / PDV',
  'Clients / Fournisseurs':'Clientes / Fornecedores','Stock':'Estoque',"Entrées de stock":'Entradas de estoque','Sorties de stock':'Saídas de estoque',
  'Alertes stock':'Alertas de estoque','Rapport de stock':'Relatório de estoque','Production':'Produção','Entreprise':'Empresa',
  'Journal':'Diário','Grand livre':'Razão geral','Lettrage':'Conciliação de contas','Balance':'Balancete',
  'Immobilisations':'Ativos imobilizados','Inventaire':'Inventário físico','Provisions':'Provisões','Multi-devises':'Multi-moeda',
  'Rapprochement bancaire':'Conciliação bancária','Comptabilité analytique':'Contabilidade de custos','Emprunts':'Empréstimos',
  'Simulateur fiscal':'Simulador fiscal','Calendrier fiscal':'Calendário fiscal','Exercice fiscal':'Exercício fiscal',
  'Déclaration de TVA':'Declaração de IVA','Déclaration IS':'Declaração de imposto sobre sociedades','Retenues à la source':'Retenção na fonte',
  'Salaires & cotisations sociales':'Salários e contribuições sociais','Liasse fiscale annuelle':'Dossiê fiscal anual',
  'Bilan':'Balanço patrimonial','Compte de résultat':'Demonstração de resultados','Flux de trésorerie':'Demonstração de fluxo de caixa','Notes annexes':'Notas explicativas',
  'Employés':'Funcionários','Contrats':'Contratos','Présence & pointage':'Presença e controle de ponto','Congés':'Férias',
  'Paie & bulletins':'Folha de pagamento e holerites','Performance':'Desempenho','Formation':'Treinamento','Recrutement':'Recrutamento',
  'Santé & sécurité':'Saúde e segurança','Discipline':'Disciplina','Documents RH':'Documentos de RH','Tableau de bord RH':'Painel de RH',
  'Solde':'Saldo','Suivi de trésorerie':'Acompanhamento de tesouraria','Prévisions':'Previsões','Score financier':'Índice financeiro','Benchmarks':'Referências comparativas',
  'OCR':'OCR',
  'E-mail':'E-mail','Mot de passe':'Senha','Se connecter':'Entrar','Mot de passe oublié ?':'Esqueceu a senha?','Réinitialiser':'Redefinir',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'Conta esquecida ou desativada? Contate seu administrador — contas só são criadas em "Gestão de usuários".',
  'Première utilisation ?':'Primeira vez aqui?','Créer votre entreprise':'Crie sua empresa',
  'Créer votre entreprise et votre compte administrateur':'Crie sua empresa e sua conta de administrador',
  'Pays':'País',"Secteur d'activité":'Setor de atividade','Forme juridique':'Forma jurídica',"Nom de l'entreprise":'Nome da empresa',
  'Votre nom complet':'Seu nome completo','Créer l\'entreprise':'Criar empresa','Déjà un compte ?':'Já tem uma conta?',
  'Choisissez votre mot de passe pour activer votre compte':'Escolha sua senha para ativar sua conta','Activer mon compte':'Ativar minha conta',
  'Apparence':'Aparência','Luminosité':'Brilho',"Couleur d'accent":'Cor de destaque','Police':'Fonte','Intensité des ombres':'Intensidade das sombras',
  'Compte':'Conta','Nom complet':'Nome completo','Enregistrer le nom':'Salvar nome','Changer le mot de passe':'Alterar senha',
  'Votre avis':'Sua opinião','Commentaire (facultatif)':'Comentário (opcional)','Envoyer mon avis':'Enviar opinião','Langue':'Idioma'
},
zh:{
  'Accueil':'首页','Trésorerie':'资金','Déclarations':'申报','Chat IA':'AI 聊天','Utilisateurs':'用户','Paramètres':'设置',
  'Accueil — spécialisations':'首页 — 工作区','Outils IA':'AI 工具',
  'Exploitant':'运营','Comptable':'会计','Fiscalité':'税务','Ressources Humaines':'人力资源','Trésorier':'资金主管','IA':'AI',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'日常运营：销售、客户、库存、生产和公司信息。',
  'Journal, grand livre, balance et travaux de clôture.':'日记账、总账、试算表和结账工作。',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'税务模拟器和税务日历 - 申报现已移至"申报"标签页。',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'完整的员工生命周期：档案、合同、考勤、请假、薪资、职业发展、文件。',
  'Soldes, banques et suivi.':'余额、银行和跟踪。',
  'Outils intelligents.':'智能工具。',
  'Déclarations fiscales et administratives, états financiers.':'税务和行政申报、财务报表。',
  'Choisissez votre espace de travail':'选择您的工作区',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'每个工作区将其模块归组在侧边菜单中。',
  'Tableau de bord':'仪表盘','Ventes':'销售','Factures':'发票','Devis':'报价单','Bons de commande':'采购订单',
  'Bons de livraison':'送货单','Factures récurrentes':'定期发票','Caisse / PDV':'收银台 / POS',
  'Clients / Fournisseurs':'客户 / 供应商','Stock':'库存',"Entrées de stock":'入库','Sorties de stock':'出库',
  'Alertes stock':'库存预警','Rapport de stock':'库存报告','Production':'生产','Entreprise':'公司',
  'Journal':'日记账','Grand livre':'总账','Lettrage':'账目核销','Balance':'试算表',
  'Immobilisations':'固定资产','Inventaire':'实物盘点','Provisions':'准备金','Multi-devises':'多币种',
  'Rapprochement bancaire':'银行对账','Comptabilité analytique':'成本会计','Emprunts':'借款',
  'Simulateur fiscal':'税务模拟器','Calendrier fiscal':'税务日历','Exercice fiscal':'财政年度',
  'Déclaration de TVA':'增值税申报','Déclaration IS':'企业所得税申报','Retenues à la source':'预扣税',
  'Salaires & cotisations sociales':'工资与社会保险','Liasse fiscale annuelle':'年度税务档案',
  'Bilan':'资产负债表','Compte de résultat':'损益表','Flux de trésorerie':'现金流量表','Notes annexes':'附注',
  'Employés':'员工','Contrats':'合同','Présence & pointage':'考勤打卡','Congés':'休假',
  'Paie & bulletins':'薪资与工资单','Performance':'绩效','Formation':'培训','Recrutement':'招聘',
  'Santé & sécurité':'健康与安全','Discipline':'纪律','Documents RH':'人力资源文件','Tableau de bord RH':'人力资源仪表盘',
  'Solde':'余额','Suivi de trésorerie':'资金跟踪','Prévisions':'预测','Score financier':'财务评分','Benchmarks':'对标分析',
  'OCR':'光学字符识别',
  'E-mail':'电子邮箱','Mot de passe':'密码','Se connecter':'登录','Mot de passe oublié ?':'忘记密码？','Réinitialiser':'重置',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'账号遗忘或已停用？请联系您的管理员 — 账号只能通过"用户管理"创建。',
  'Première utilisation ?':'首次使用？','Créer votre entreprise':'创建您的公司',
  'Créer votre entreprise et votre compte administrateur':'创建您的公司和管理员账号',
  'Pays':'国家',"Secteur d'activité":'行业','Forme juridique':'法律形式',"Nom de l'entreprise":'公司名称',
  'Votre nom complet':'您的全名','Créer l\'entreprise':'创建公司','Déjà un compte ?':'已有账号？',
  'Choisissez votre mot de passe pour activer votre compte':'请设置密码以激活您的账号','Activer mon compte':'激活我的账号',
  'Apparence':'外观','Luminosité':'亮度',"Couleur d'accent":'强调色','Police':'字体','Intensité des ombres':'阴影强度',
  'Compte':'账号','Nom complet':'全名','Enregistrer le nom':'保存姓名','Changer le mot de passe':'修改密码',
  'Votre avis':'您的反馈','Commentaire (facultatif)':'评论（选填）','Envoyer mon avis':'发送反馈','Langue':'语言'
},
ja:{
  'Accueil':'ホーム','Trésorerie':'資金繰り','Déclarations':'申告','Chat IA':'AIチャット','Utilisateurs':'ユーザー','Paramètres':'設定',
  'Accueil — spécialisations':'ホーム — ワークスペース','Outils IA':'AIツール',
  'Exploitant':'業務','Comptable':'経理','Fiscalité':'税務','Ressources Humaines':'人事','Trésorier':'資金管理者','IA':'AI',
  'Opérations quotidiennes : ventes, clients, stock, production et entreprise.':'日常業務：販売、顧客、在庫、生産、会社情報。',
  'Journal, grand livre, balance et travaux de clôture.':'仕訳帳、総勘定元帳、試算表、決算業務。',
  'Simulateur et calendrier fiscal - les déclarations sont désormais dans l\'onglet Déclarations.':'税務シミュレーターと税務カレンダー - 申告は「申告」タブに移動しました。',
  'Cycle de vie complet du personnel : dossiers, contrats, présence, congés, paie, carrière, documents.':'従業員のライフサイクル全体：記録、契約、勤怠、休暇、給与、キャリア、書類。',
  'Soldes, banques et suivi.':'残高、銀行、追跡。',
  'Outils intelligents.':'スマートツール。',
  'Déclarations fiscales et administratives, états financiers.':'税務・行政申告、財務諸表。',
  'Choisissez votre espace de travail':'ワークスペースを選択してください',
  'Chaque spécialisation regroupe ses modules dans le menu latéral.':'各ワークスペースはサイドメニューにモジュールをまとめます。',
  'Tableau de bord':'ダッシュボード','Ventes':'販売','Factures':'請求書','Devis':'見積書','Bons de commande':'発注書',
  'Bons de livraison':'納品書','Factures récurrentes':'定期請求書','Caisse / PDV':'レジ / POS',
  'Clients / Fournisseurs':'顧客 / 仕入先','Stock':'在庫',"Entrées de stock":'入庫','Sorties de stock':'出庫',
  'Alertes stock':'在庫アラート','Rapport de stock':'在庫レポート','Production':'生産','Entreprise':'会社',
  'Journal':'仕訳帳','Grand livre':'総勘定元帳','Lettrage':'消込','Balance':'試算表',
  'Immobilisations':'固定資産','Inventaire':'実地棚卸','Provisions':'引当金','Multi-devises':'複数通貨',
  'Rapprochement bancaire':'銀行残高照合','Comptabilité analytique':'原価計算','Emprunts':'借入金',
  'Simulateur fiscal':'税務シミュレーター','Calendrier fiscal':'税務カレンダー','Exercice fiscal':'会計年度',
  'Déclaration de TVA':'消費税申告','Déclaration IS':'法人税申告','Retenues à la source':'源泉徴収',
  'Salaires & cotisations sociales':'給与と社会保険料','Liasse fiscale annuelle':'年次税務書類一式',
  'Bilan':'貸借対照表','Compte de résultat':'損益計算書','Flux de trésorerie':'キャッシュフロー計算書','Notes annexes':'注記',
  'Employés':'従業員','Contrats':'契約','Présence & pointage':'勤怠管理','Congés':'休暇',
  'Paie & bulletins':'給与と給与明細','Performance':'人事評価','Formation':'研修','Recrutement':'採用',
  'Santé & sécurité':'安全衛生','Discipline':'懲戒','Documents RH':'人事書類','Tableau de bord RH':'人事ダッシュボード',
  'Solde':'残高','Suivi de trésorerie':'資金繰り管理','Prévisions':'予測','Score financier':'財務スコア','Benchmarks':'ベンチマーク',
  'OCR':'OCR（文字認識）',
  'E-mail':'メールアドレス','Mot de passe':'パスワード','Se connecter':'ログイン','Mot de passe oublié ?':'パスワードをお忘れですか？','Réinitialiser':'リセット',
  'Compte oublié/désactivé ? Contactez votre administrateur — la création de comptes se fait uniquement depuis "Gestion des utilisateurs".':'アカウントを忘れた、または無効化されましたか？管理者にお問い合わせください — アカウント作成は「ユーザー管理」からのみ可能です。',
  'Première utilisation ?':'初めてのご利用ですか？','Créer votre entreprise':'会社を作成',
  'Créer votre entreprise et votre compte administrateur':'会社と管理者アカウントを作成',
  'Pays':'国',"Secteur d'activité":'業種','Forme juridique':'法人形態',"Nom de l'entreprise":'会社名',
  'Votre nom complet':'お名前（フルネーム）','Créer l\'entreprise':'会社を作成','Déjà un compte ?':'すでにアカウントをお持ちですか？',
  'Choisissez votre mot de passe pour activer votre compte':'アカウントを有効化するパスワードを設定してください','Activer mon compte':'アカウントを有効化',
  'Apparence':'外観','Luminosité':'明るさ',"Couleur d'accent":'アクセントカラー','Police':'フォント','Intensité des ombres':'影の強さ',
  'Compte':'アカウント','Nom complet':'氏名','Enregistrer le nom':'名前を保存','Changer le mot de passe':'パスワードを変更',
  'Votre avis':'ご意見','Commentaire (facultatif)':'コメント（任意）','Envoyer mon avis':'意見を送信','Langue':'言語'
}
};

function getLangueActuelle(){try{return localStorage.getItem(LS_LANG)||'fr';}catch(e){return 'fr';}}

window.t=function(fr){
  var lang=getLangueActuelle();
  if(lang==='fr')return fr;
  var dict=I18N[lang];
  return (dict&&dict[fr])||fr;
};

window.definirLangue=function(code){
  try{localStorage.setItem(LS_LANG,code);}catch(e){}
  var dir=(LANGUES[code]||LANGUES.fr).dir;
  document.documentElement.setAttribute('lang',code);
  document.documentElement.setAttribute('dir',dir);
  // Reconstruit tout ce qui contient du texte traduit (barre latérale,
  // barre du bas, écran d'accueil) plutôt que de chercher/remplacer dans
  // le DOM existant - plus fiable, réutilise les fonctions de rendu déjà
  // en place.
  try{if(typeof construireTaskbar==='function'&&!document.getElementById('taskbar-rebuilt-once')){/* no-op: taskbar reconstruite via re-render ci-dessous */}}catch(e){}
  try{
    var oldTb=document.getElementById('taskbar');if(oldTb)oldTb.remove();
    document.querySelectorAll('.tb-menu').forEach(function(m){m.remove();});
    if(typeof construireTaskbar==='function')construireTaskbar();
  }catch(e){}
  try{
    var oldHub=document.getElementById('hub');
    var hubVisible=oldHub&&oldHub.classList.contains('visible');
    if(oldHub)oldHub.remove();
    if(typeof construireHub==='function'){construireHub();if(hubVisible){var h=document.getElementById('hub');if(h){h.classList.add('visible');if(typeof majHubInfos==='function')majHubInfos();}}}
  }catch(e){}
  try{if(typeof SPEC_ACTUELLE!=='undefined'&&SPEC_ACTUELLE&&typeof construireNav==='function')construireNav(SPEC_ACTUELLE);}catch(e){}
  appliquerTraductionStatique();
  if(typeof renderParametresPane==='function')renderParametresPane();
};

// Traduit les libellés statiques de l'écran de connexion/inscription
// (texte HTML en dur dans index.html, pas généré par une fonction JS -
// donc pas couvert par le mécanisme "reconstruire via render" ci-dessus).
function appliquerTraductionStatique(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent=t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
    el.placeholder=t(el.getAttribute('data-i18n-placeholder'));
  });
  // .brut-input-wrap utilise data-label (lu par ::before{content:attr(
  // data-label)} en CSS, voir css/01-core.css) plutôt qu'un texte visible
  // classique - data-i18n-label garde la vraie clé française séparée de
  // l'attribut affiché, qu'on écrase avec la traduction.
  document.querySelectorAll('[data-i18n-label]').forEach(function(el){
    el.setAttribute('data-label',t(el.getAttribute('data-i18n-label')));
  });
}

window.LANGUES=LANGUES;
window.getLangueActuelle=getLangueActuelle;

document.addEventListener('DOMContentLoaded',appliquerTraductionStatique);
var langueInitiale=getLangueActuelle();
if(langueInitiale!=='fr'){
  document.documentElement.setAttribute('lang',langueInitiale);
  document.documentElement.setAttribute('dir',(LANGUES[langueInitiale]||LANGUES.fr).dir);
}
appliquerTraductionStatique();

})();
