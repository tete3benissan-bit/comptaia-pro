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
  pt:{nom:'Português',dir:'ltr'}
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
