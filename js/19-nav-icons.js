// Minimalist line-icon set replacing emoji throughout the specialization
// sidebar/taskbar/hub (js/15-v19-specializations.js), which is the single
// data source (SPECS/ITEMS_IA/ITEMS_TRESO) driving all visible navigation.
// Must load BEFORE js/15-v19-specializations.js since SPECS is built at parse time.
var NAV_ICON_PATHS = {
  home:'<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  dashboard:'<rect x="4" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="16" y="3" width="4" height="17"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M4 20c0-3.5 2.5-6 5-6s5 2.5 5 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 20c.1-2.6 1.4-4.6 3-5.4"/>',
  file:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><line x1="9.5" y1="12" x2="15" y2="12"/><line x1="9.5" y1="15.5" x2="15" y2="15.5"/>',
  clipboard:'<rect x="6" y="4" width="12" height="17" rx="1.5"/><rect x="9" y="2" width="6" height="3" rx="1"/><line x1="8.5" y1="10" x2="15.5" y2="10"/><line x1="8.5" y1="13.5" x2="15.5" y2="13.5"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
  wallet:'<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 10h18"/><circle cx="15.5" cy="14" r="1.6"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.3"/><circle cx="12" cy="12" r="1"/>',
  cap:'<path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5"/><path d="M21 9v6"/>',
  megaphone:'<path d="M3 10v4h3l6 4V6l-6 4z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 7a7.5 7.5 0 0 1 0 10"/>',
  health:'<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  scale:'<line x1="12" y1="3" x2="12" y2="20"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7 2 13a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0z"/>',
  cart:'<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2.5 4h2.5l2.3 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"/>',
  truck:'<rect x="2.5" y="8" width="11" height="8" rx="1"/><path d="M13.5 11h4l3 3v2h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
  refresh:'<path d="M4 9a8 8 0 0 1 14-4.5M20 5v5h-5"/><path d="M20 15a8 8 0 0 1-14 4.5M4 19v-5h5"/>',
  receipt:'<path d="M6 3h12v18l-2.5-1.5L13 21l-2-1.5L9 21l-3-1.5z"/><line x1="8.5" y1="8" x2="15.5" y2="8"/><line x1="8.5" y1="12" x2="15.5" y2="12"/>',
  factory:'<path d="M3 20V11l5 3v-3l5 3V8l5 3v9z"/><line x1="3" y1="20" x2="21" y2="20"/>',
  building:'<rect x="5" y="3" width="14" height="18" rx="1"/><rect x="8" y="6" width="2" height="2"/><rect x="14" y="6" width="2" height="2"/><rect x="8" y="11" width="2" height="2"/><rect x="14" y="11" width="2" height="2"/><rect x="10" y="16" width="4" height="5"/>',
  briefcase:'<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="3" y1="12" x2="21" y2="12"/>',
  package:'<path d="M3.5 7.5 12 3l8.5 4.5L12 12z"/><path d="M3.5 7.5V16l8.5 4.5V12"/><path d="M20.5 7.5V16L12 20.5"/>',
  arrowDown:'<line x1="12" y1="4" x2="12" y2="18"/><polyline points="6,12 12,18 18,12"/>',
  arrowUp:'<line x1="12" y1="20" x2="12" y2="6"/><polyline points="6,12 12,6 18,12"/>',
  alertTriangle:'<path d="M12 4 2 20h20z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="17.7" r="0.9"/>',
  book:'<path d="M4 4.5A2 2 0 0 1 6 3h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 4.5v16"/>',
  bookOpen:'<path d="M12 6c-2-1.2-5-1.5-8-1v14c3-.5 6-.2 8 1 2-1.2 5-1.5 8-1V5c-3-.5-6-.2-8 1z"/><line x1="12" y1="6" x2="12" y2="20"/>',
  link:'<path d="M9 15 15 9"/><path d="M8 13 5.5 15.5a3 3 0 0 0 4 4.5L12 17"/><path d="M16 11l2.5-2.5a3 3 0 0 0-4-4.5L12 7"/>',
  hash:'<line x1="9" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="15" y2="21"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="3" y1="15" x2="19" y2="15"/>',
  trendUp:'<polyline points="3,17 9,11 13,15 21,6"/><polyline points="15,6 21,6 21,12"/>',
  droplet:'<path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3z"/>',
  layers:'<polygon points="12,4 21,9 12,14 3,9"/><polyline points="3,13.5 12,18.5 21,13.5"/><polyline points="3,17.5 12,22.5 21,17.5"/>',
  pencil:'<path d="M4 20l1-4L16 5l4 4L9 20z"/><line x1="14.5" y1="6.5" x2="18.5" y2="10.5"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.2" y2="15.2"/>',
  landmark:'<line x1="3" y1="20" x2="21" y2="20"/><line x1="5" y1="20" x2="5" y2="10"/><line x1="9.5" y1="20" x2="9.5" y2="10"/><line x1="14.5" y1="20" x2="14.5" y2="10"/><line x1="19" y1="20" x2="19" y2="10"/><polygon points="12,3 21,9 3,9"/>',
  calc:'<rect x="6" y="2.5" width="12" height="19" rx="1.5"/><line x1="8.5" y1="6.5" x2="15.5" y2="6.5"/><circle cx="9" cy="11" r="0.8"/><circle cx="12" cy="11" r="0.8"/><circle cx="15" cy="11" r="0.8"/><circle cx="9" cy="14.5" r="0.8"/><circle cx="12" cy="14.5" r="0.8"/><circle cx="15" cy="14.5" r="0.8"/>',
  chat:'<rect x="3.5" y="4.5" width="17" height="11" rx="2.5"/><path d="M8 15.5v4l4-4"/>',
  camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7 9.5 4h5L16 7"/><circle cx="12" cy="13.5" r="3.6"/>',
  star:'<polygon points="12,3 14.6,9 21,9.6 16.2,13.9 17.6,20.2 12,16.9 6.4,20.2 7.8,13.9 3,9.6 9.4,9"/>',
  alertOctagon:'<polygon points="7.5,3 16.5,3 21,7.5 21,16.5 16.5,21 7.5,21 3,16.5 3,7.5"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.9"/>',
  bot:'<rect x="5" y="8" width="14" height="10" rx="2.5"/><line x1="12" y1="3" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/><line x1="3" y1="11" x2="5" y2="11"/><line x1="19" y1="11" x2="21" y2="11"/>',
  bell:'<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
  percent:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7.5" cy="7.5" r="2.3"/><circle cx="16.5" cy="16.5" r="2.3"/>',
  chevronRight:'<polyline points="9,5 16,12 9,19"/>',
  shield:'<path d="M12 3 4.5 6v6c0 5 3.2 8.2 7.5 9 4.3-.8 7.5-4 7.5-9V6z"/><path d="M9 12l2 2 4-4"/>'
};
function ico(name){
  var p = NAV_ICON_PATHS[name];
  if (!p) return '';
  return '<svg class="uiv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}
