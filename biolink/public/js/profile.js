// ===========================================================================
//  Moteur de la page profil. Lit la config JSON injectee par le serveur.
//  Securite : les donnees utilisateur sont posees via textContent / attributs
//  valides, jamais via innerHTML. Seules les icones (constantes) sont en HTML.
// ===========================================================================
const CONFIG = JSON.parse(document.getElementById('cfg').textContent);
const $ = id => document.getElementById(id);

// --- Icones (constantes de confiance) ---
const ICONS = {
  discord:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.3 4.4A19 19 0 0 0 15.6 3l-.2.4a14 14 0 0 1 4.1 2 14 14 0 0 0-12 0 14 14 0 0 1 4.2-2L11.4 3A19 19 0 0 0 6.7 4.4 19.7 19.7 0 0 0 3.3 18a19 19 0 0 0 5.8 2.9l.7-1.1a12 12 0 0 1-1.9-.9l.5-.4a13.6 13.6 0 0 0 11.6 0l.5.4a12 12 0 0 1-1.9.9l.7 1.1A19 19 0 0 0 26 18l-.3-.5A19.7 19.7 0 0 0 20.3 4.4ZM9.7 15.1c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm4.6 0c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z"/></svg>',
  github:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 8.8 21.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2h3.3l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.6 2h6.8l4.7 6.2L18.2 2Zm-1.2 18h1.8L7.1 3.9H5.2L17 20Z"/></svg>',
  youtube:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .6 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .4-4.5 31 31 0 0 0-.4-4.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z"/></svg>',
  spotify:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.6.6 0 0 1-.9.2c-2.4-1.5-5.4-1.8-9-1a.6.6 0 1 1-.3-1.2c3.9-.9 7.3-.5 10 1.1a.6.6 0 0 1 .2.9Zm1.2-2.7a.8.8 0 0 1-1 .3c-2.7-1.7-6.9-2.2-10.1-1.2a.8.8 0 1 1-.4-1.5c3.7-1.1 8.3-.6 11.4 1.4a.8.8 0 0 1 .1 1Zm.1-2.8C14.7 9 8.9 8.8 5.7 9.8a.9.9 0 1 1-.6-1.8c3.8-1.1 10.1-.9 14 1.4a.9.9 0 1 1-1 1.6Z"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2c.3 2.2 1.6 3.6 3.7 3.8v2.5c-1.3.1-2.5-.3-3.7-1v6.4c0 3.4-2.1 5.8-5.4 5.8-3 0-5.1-2.3-5.1-5.2 0-3.1 2.4-5.2 5.6-4.9v2.7c-.5-.1-1-.2-1.5-.1-1.3.2-2 1-1.9 2.4.1 1.3 1 2 2.2 1.9 1.3-.1 2-1 2-2.6V2h3.6Z"/></svg>',
  telegram:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.5 20c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.4-.1-.6-.6-.2L6 13.4l-4.7-1.5c-1-.3-1-1 .2-1.5L20.6 3c.9-.3 1.6.2 1.3 1.3Z"/></svg>',
  email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>'
};
const STATUS_COLORS = { online:'#22c55e', idle:'#f59e0b', dnd:'#ef4444', offline:'#6b7280' };

// --- Theme ---
const root = document.documentElement.style;
root.setProperty('--accent', CONFIG.accent || '#8b5cf6');
root.setProperty('--accent-2', CONFIG.accent2 || '#22d3ee');

// --- Forme de la carte et de l'avatar ---
const cardEl = $('card');
cardEl.classList.add('cs-' + (CONFIG.cardStyle || 'glass'), 'csh-' + (CONFIG.cardShape || 'rounded'));
const avWrap = document.querySelector('.avatar-wrap');
if (avWrap) avWrap.classList.add('av-' + (CONFIG.avatarShape || 'circle'));

// --- Fond ---
if (CONFIG.bgIsVideo && CONFIG.background){
  const v = $('bg-video'); v.src = CONFIG.background; v.style.display = 'block'; $('bg').style.display = 'none';
} else if (CONFIG.background){
  $('bg').style.backgroundImage = "url(" + JSON.stringify(CONFIG.background) + ")";
}

// --- Identite (textContent => sans danger) ---
$('uname-text').textContent = CONFIG.username || '';
$('title').textContent = CONFIG.title || '';
if (CONFIG.avatar) $('avatar').src = CONFIG.avatar;
$('views').textContent = (CONFIG.views || 0).toLocaleString('fr-FR');
// Effet de pseudo
const unameEl = document.querySelector('.username');
if (unameEl && CONFIG.usernameEffect && CONFIG.usernameEffect !== 'none') unameEl.classList.add('ue-' + CONFIG.usernameEffect);
// Texte de l'ecran d'entree
if (CONFIG.enterText){ const et = $('enter-title'); if (et) et.textContent = CONFIG.enterText; }

if (CONFIG.status && STATUS_COLORS[CONFIG.status]){
  $('status').style.background = STATUS_COLORS[CONFIG.status];
  $('status').style.boxShadow = '0 0 12px ' + STATUS_COLORS[CONFIG.status];
} else { $('status').style.display = 'none'; }

// --- Liens sociaux (logos de marque via Simple Icons) ---
const SI_SLUG = { discord:'discord', github:'github', instagram:'instagram', x:'x',
  youtube:'youtube', spotify:'spotify', tiktok:'tiktok', telegram:'telegram' };
const linksBox = $('links');
(CONFIG.socials || []).forEach(s => {
  const a = document.createElement('a');
  a.className = 'link';
  let href = s.url || '';
  if (s.type === 'email' && !/^mailto:/i.test(href)) href = 'mailto:' + href;
  if (!/^(https?:|mailto:)/i.test(href)) return; // securite
  a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.title = s.type || '';
  if (SI_SLUG[s.type]){
    const img = document.createElement('img');
    img.src = 'https://cdn.simpleicons.org/' + SI_SLUG[s.type] + '/ffffff';
    img.alt = s.type; img.loading = 'lazy'; img.className = 'link-logo';
    a.appendChild(img);
  } else {
    a.innerHTML = ICONS[s.type] || ICONS.globe; // globe / email = SVG interne
  }
  linksBox.appendChild(a);
});

// --- Boutons texte ---
const btnBox = $('btn-links');
(CONFIG.buttons || []).forEach(b => {
  if (!/^(https?:|mailto:)/i.test(b.url || '')) return;
  const a = document.createElement('a');
  a.className = 'btn-link'; a.href = b.url; a.target = '_blank'; a.rel = 'noopener';
  a.textContent = b.label || 'Lien'; // textContent => sans danger
  btnBox.appendChild(a);
});

// --- Badges (catalogue, sous le pseudo, bulle au survol) ---
const LU = 'https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/';
const BADGE_DEFS = {
  verified: { label:'Vérifié',     icon:'check',     c1:'#22d3ee', c2:'#3b82f6' },
  staff:    { label:'Staff',       icon:'shield',    c1:'#8b5cf6', c2:'#6366f1' },
  owner:    { label:'Fondateur',   icon:'crown',     c1:'#f59e0b', c2:'#ef4444' },
  developer:{ label:'Développeur', icon:'code',      c1:'#22c55e', c2:'#06b6d4' },
  premium:  { label:'Premium',     icon:'gem',       c1:'#fbbf24', c2:'#f59e0b' },
  donator:  { label:'Donateur',    icon:'heart',     c1:'#ec4899', c2:'#f472b6' },
  booster:  { label:'Booster',     icon:'rocket',    c1:'#a855f7', c2:'#ec4899' },
  partner:  { label:'Partenaire',  icon:'handshake', c1:'#6366f1', c2:'#22d3ee' },
  early:    { label:'Early User',  icon:'clock',     c1:'#14b8a6', c2:'#06b6d4' },
  og:       { label:'OG',          icon:'star',      c1:'#f59e0b', c2:'#fb7185' },
  winner:   { label:'Gagnant',     icon:'trophy',    c1:'#fbbf24', c2:'#f59e0b' },
  bughunter:{ label:'Bug Hunter',  icon:'bug',       c1:'#84cc16', c2:'#22c55e' }
};
const BADGE_ORDER = ['verified','staff','owner','developer','premium','donator','booster','partner','early','og','winner','bughunter'];
const badgesBox = $('badges');
const myBadges = CONFIG.badges || [];
BADGE_ORDER.forEach(key => {
  if (myBadges.indexOf(key) < 0) return;
  const d = BADGE_DEFS[key]; if (!d) return;
  const b = document.createElement('span');
  b.className = 'badge'; b.dataset.tip = d.label;
  b.style.background = 'linear-gradient(135deg,' + d.c1 + ',' + d.c2 + ')';
  const img = document.createElement('img');
  img.src = LU + d.icon + '.svg'; img.alt = d.label; img.className = 'badge-glyph'; img.loading = 'lazy';
  b.appendChild(img);
  badgesBox.appendChild(b);
});

// --- Localisation ---
if (CONFIG.location){
  $('location').textContent = CONFIG.location;
  $('location-wrap').style.display = 'inline';
}

// --- Badges de competences (avec logos Devicon) ---
const skillsBox = $('skills');
const ICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';
(CONFIG.skills || []).forEach(s => {
  const chip = document.createElement('span');
  chip.className = 'skill-chip';
  const path = (CONFIG.skillIcons || {})[s];
  if (path){
    const img = document.createElement('img');
    img.src = ICON_BASE + path; img.alt = ''; img.loading = 'lazy';
    chip.appendChild(img);
  }
  const txt = document.createElement('span'); txt.textContent = s; // textContent => sans danger
  chip.appendChild(txt);
  skillsBox.appendChild(chip);
});

// --- Widget horloge (heure en direct dans le fuseau choisi) ---
if (CONFIG.timezone){
  const card = document.createElement('div');
  card.className = 'widget';
  const label = document.createElement('div'); label.className = 'widget-label'; label.textContent = '🕐 ' + CONFIG.timezone.replace('_', ' ');
  const time = document.createElement('div'); time.className = 'widget-main';
  card.appendChild(label); card.appendChild(time);
  $('widgets').appendChild(card);
  const tick = () => {
    try {
      time.textContent = new Intl.DateTimeFormat('fr-FR', {
        timeZone: CONFIG.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date());
    } catch (e) { card.remove(); return; }
  };
  tick(); setInterval(tick, 1000);
}

// --- Widget serveur Discord (API widget publique) ---
if (CONFIG.discordGuild && /^[0-9]+$/.test(CONFIG.discordGuild)){
  fetch('https://discord.com/api/guilds/' + CONFIG.discordGuild + '/widget.json')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      const card = document.createElement('a');
      card.className = 'widget discord-widget';
      if (d.instant_invite){ card.href = d.instant_invite; card.target = '_blank'; card.rel = 'noopener'; }
      const name = document.createElement('div'); name.className = 'widget-main'; name.textContent = d.name || 'Discord';
      const online = (d.presence_count != null) ? d.presence_count : (d.members ? d.members.length : 0);
      const sub = document.createElement('div'); sub.className = 'widget-label';
      sub.textContent = '🟢 ' + online.toLocaleString('fr-FR') + ' en ligne';
      card.appendChild(name); card.appendChild(sub);
      if (d.instant_invite){
        const join = document.createElement('span'); join.className = 'discord-join'; join.textContent = 'Rejoindre';
        card.appendChild(join);
      }
      $('widgets').appendChild(card);
    })
    .catch(() => {}); // widget desactive cote serveur ou ID invalide : on n'affiche rien
}

// --- Presence Discord en direct (Lanyard) ---
if (CONFIG.discordUser && /^[0-9]+$/.test(CONFIG.discordUser)){
  const COLORS = { online:'#22c55e', idle:'#f59e0b', dnd:'#ef4444', offline:'#6b7280' };
  fetch('https://api.lanyard.rest/v1/users/' + CONFIG.discordUser)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(j => {
      if (!j.success) return;
      const d = j.data;
      const card = document.createElement('div'); card.className = 'widget';
      const top = document.createElement('div'); top.className = 'widget-main';
      const dot = document.createElement('span');
      dot.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;background:' + (COLORS[d.discord_status] || COLORS.offline);
      top.appendChild(dot);
      top.appendChild(document.createTextNode((d.discord_user && d.discord_user.username) || 'Discord'));
      const sub = document.createElement('div'); sub.className = 'widget-label';
      const act = (d.activities || []).find(a => a.type !== 4); // 4 = custom status
      if (d.listening_to_spotify && d.spotify){
        sub.textContent = '🎧 ' + d.spotify.song + ' — ' + d.spotify.artist;
      } else if (act){
        sub.textContent = '🎮 ' + act.name;
      } else {
        sub.textContent = ({online:'En ligne',idle:'Inactif',dnd:'Ne pas déranger',offline:'Hors ligne'})[d.discord_status] || '';
      }
      card.appendChild(top); card.appendChild(sub);
      $('widgets').appendChild(card);
    })
    .catch(() => {}); // utilisateur pas dans le serveur Lanyard, ou ID invalide
}

// --- Curseur personnalise (styles elabores) ---
const cursorStyle = CONFIG.cursorStyle || (CONFIG.cursor ? 'glow' : 'none');
if (cursorStyle && cursorStyle !== 'none'){
  root.setProperty('--cursor', 'none');
  const c = $('cursor'); c.style.display = 'block'; c.dataset.style = cursorStyle;
  let mx = innerWidth / 2, my = innerHeight / 2;     // position souris
  let cx = mx, cy = my;                              // position lissee du curseur
  let hue = 0, lastSpawn = 0;

  // Curseur image personnalise
  const isImage = (cursorStyle === 'image' || cursorStyle === 'image-trail');
  if (isImage && CONFIG.cursorImage){
    c.style.background = 'center/contain no-repeat url(' + JSON.stringify(CONFIG.cursorImage) + ')';
    c.style.width = '40px'; c.style.height = '40px'; c.style.boxShadow = 'none'; c.style.mixBlendMode = 'normal';
  } else if (isImage){
    c.dataset.style = 'dot'; // pas d'image fournie : repli sur un point
  }

  // Orbite : petit satellite qui tourne autour du curseur
  let orbiter = null, orbitAngle = 0;
  if (cursorStyle === 'orbit'){
    orbiter = document.createElement('div');
    orbiter.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;border-radius:50%;pointer-events:none;'
      + 'z-index:99;transform:translate(-50%,-50%);background:var(--accent-2);box-shadow:0 0 12px var(--accent-2);mix-blend-mode:screen;';
    document.body.appendChild(orbiter);
  }

  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  addEventListener('mousedown', () => c.classList.add('down'));
  addEventListener('mouseup',   () => c.classList.remove('down'));

  // Chaines de suiveurs pour trail / comet / image-trail
  let followers = [];
  const followerCount = cursorStyle === 'comet' ? 14 : (cursorStyle === 'trail' ? 7 : (cursorStyle === 'image-trail' ? 8 : 0));
  for (let i = 0; i < followerCount; i++){
    const f = document.createElement('div');
    f.className = 'cursor-follow';
    const scale = 1 - i / (followerCount + 2);
    let extra = '';
    if (cursorStyle === 'image-trail' && CONFIG.cursorImage){
      extra = 'background:center/contain no-repeat url(' + JSON.stringify(CONFIG.cursorImage) + ');border-radius:0;box-shadow:none;mix-blend-mode:normal;';
    }
    const sz = cursorStyle === 'image-trail' ? (34 * scale) : (cursorStyle === 'comet' ? (13 * scale) : 11);
    f.style.cssText = 'position:fixed;left:0;top:0;border-radius:50%;pointer-events:none;z-index:98;'
      + 'transform:translate(-50%,-50%);mix-blend-mode:screen;'
      + 'width:' + sz + 'px;height:' + sz + 'px;'
      + 'opacity:' + (cursorStyle === 'comet' || cursorStyle === 'image-trail' ? scale : (1 - i / followerCount)) + ';'
      + extra;
    document.body.appendChild(f);
    followers.push({ el: f, x: cx, y: cy });
  }

  function spawnParticle(){
    const p = document.createElement('div');
    p.className = 'cursor-particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 14 + Math.random() * 22;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - 12;
    const size = 4 + Math.random() * 5;
    let color;
    if (cursorStyle === 'rainbow'){ color = `hsl(${hue},90%,65%)`; }
    else { color = Math.random() > .5 ? 'var(--accent)' : 'var(--accent-2)'; }
    p.style.cssText = 'position:fixed;left:' + mx + 'px;top:' + my + 'px;width:' + size + 'px;height:' + size
      + 'px;border-radius:50%;pointer-events:none;z-index:98;background:' + color
      + ';box-shadow:0 0 8px ' + color + ';transform:translate(-50%,-50%);mix-blend-mode:screen;';
    document.body.appendChild(p);
    const start = performance.now(), life = 650 + Math.random() * 300;
    (function fade(t){
      const k = Math.min(1, (t - start) / life);
      p.style.transform = 'translate(calc(-50% + ' + (dx * k) + 'px), calc(-50% + ' + (dy * k) + 'px)) scale(' + (1 - k) + ')';
      p.style.opacity = String(1 - k);
      if (k < 1) requestAnimationFrame(fade); else p.remove();
    })(start);
  }

  (function loop(now){
    // lissage du curseur principal
    cx += (mx - cx) * 0.28; cy += (my - cy) * 0.28;
    const useSmooth = (cursorStyle === 'ring' || cursorStyle === 'neon');
    c.style.left = (useSmooth ? cx : mx) + 'px';
    c.style.top  = (useSmooth ? cy : my) + 'px';

    // chaine de suiveurs
    if (followers.length){
      let px = mx, py = my;
      followers.forEach(f => {
        f.x += (px - f.x) * 0.35; f.y += (py - f.y) * 0.35;
        f.el.style.left = f.x + 'px'; f.el.style.top = f.y + 'px';
        if (cursorStyle === 'rainbow'){ f.el.style.background = `hsl(${hue},90%,65%)`; f.el.style.boxShadow = `0 0 10px hsl(${hue},90%,65%)`; }
        px = f.x; py = f.y;
      });
    }

    // particules pour sparkle / rainbow
    if ((cursorStyle === 'sparkle' || cursorStyle === 'rainbow') && now - lastSpawn > 28){
      spawnParticle(); lastSpawn = now;
    }
    // satellite en orbite
    if (orbiter){
      orbitAngle += 0.12;
      orbiter.style.left = (mx + Math.cos(orbitAngle) * 16) + 'px';
      orbiter.style.top  = (my + Math.sin(orbitAngle) * 16) + 'px';
    }
    hue = (hue + 4) % 360;
    if (cursorStyle === 'rainbow') c.style.background = `hsl(${hue},90%,65%)`;
    requestAnimationFrame(loop);
  })(0);
}

// --- Machine a ecrire ---
(function typewriter(){
  const el = $('bio-text');
  const lines = (CONFIG.bio && CONFIG.bio.length) ? CONFIG.bio : [''];
  let li=0, ci=0, del=false;
  (function tick(){
    const full = lines[li] || '';
    el.textContent = full.slice(0, ci);
    if (!del && ci < full.length){ ci++; setTimeout(tick, 55); }
    else if (!del && ci === full.length){ del = true; setTimeout(tick, 1600); }
    else if (del && ci > 0){ ci--; setTimeout(tick, 28); }
    else { del = false; li = (li+1) % lines.length; setTimeout(tick, 300); }
  })();
})();

// --- Tilt 3D ---
const card = $('card');
addEventListener('mousemove', e => {
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5;
  const y = (e.clientY - r.top) / r.height - .5;
  card.style.transform = `rotateY(${x*9}deg) rotateX(${-y*9}deg)`;
});
addEventListener('mouseleave', () => card.style.transform = '');

// --- Particules ---
(function fx(){
  if (CONFIG.effect === 'none' || !CONFIG.effect) return;
  const cv = $('fx'), ctx = cv.getContext('2d');
  let W, H, P = [];
  function size(){ W = cv.width = innerWidth; H = cv.height = innerHeight; }
  size(); addEventListener('resize', size);
  const N = CONFIG.effect === 'stars' ? 120 : 90;
  for (let i=0;i<N;i++) P.push({
    x:Math.random()*W, y:Math.random()*H,
    r: CONFIG.effect==='rain'?Math.random()*1+.5:Math.random()*2.2+.6,
    s: CONFIG.effect==='rain'?Math.random()*6+5:Math.random()*1.2+.3,
    d: Math.random()*.6-.3, a: Math.random()*.6+.3, tw: Math.random()*.05
  });
  (function draw(){
    ctx.clearRect(0,0,W,H);
    for (const p of P){
      ctx.beginPath();
      if (CONFIG.effect==='rain'){
        ctx.strokeStyle=`rgba(180,200,255,${p.a})`; ctx.lineWidth=p.r;
        ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.d,p.y+p.s*2); ctx.stroke();
        p.y+=p.s*2; p.x+=p.d;
      } else if (CONFIG.effect==='stars'){
        p.a+=p.tw; if(p.a>1||p.a<.2)p.tw*=-1;
        ctx.fillStyle=`rgba(255,255,255,${p.a})`; ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();
        p.y+=p.s*.15;
      } else {
        ctx.fillStyle=`rgba(255,255,255,${p.a})`; ctx.arc(p.x,p.y,p.r,0,7); ctx.fill();
        p.y+=p.s*.4; p.x+=Math.sin(p.y*.01)*.5+p.d;
      }
      if(p.y>H){p.y=-10;p.x=Math.random()*W}
      if(p.x>W)p.x=0; if(p.x<0)p.x=W;
    }
    requestAnimationFrame(draw);
  })();
})();

// --- Lecteur audio ---
const audio = $('audio');
const ICON_PLAY = '<path d="M8 5v14l11-7z"/>', ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
const ppIcon = $('pp-icon');
if (CONFIG.song){
  audio.src = CONFIG.song;
  $('song-name').textContent = CONFIG.songName || 'Musique';
  audio.volume = 0.4;
  const player = $('player'), pp = $('pp'), bar = $('bar'), prog = $('progress'), vol = $('vol');
  if (CONFIG.songArt && player){
    const art = document.createElement('img');
    art.src = CONFIG.songArt; art.alt = '';
    art.style.cssText = 'width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0';
    player.insertBefore(art, player.firstChild);
  }
  pp.addEventListener('click', () => {
    if (audio.paused){ audio.play(); ppIcon.innerHTML = ICON_PAUSE; }
    else { audio.pause(); ppIcon.innerHTML = ICON_PLAY; }
  });
  audio.addEventListener('timeupdate', () => { if (audio.duration) bar.style.width = (audio.currentTime/audio.duration*100) + '%'; });
  prog.addEventListener('click', e => { const r = prog.getBoundingClientRect(); audio.currentTime = (e.clientX-r.left)/r.width*audio.duration; });
  vol.addEventListener('input', e => audio.volume = e.target.value);
} else {
  const player = $('player'); if (player) player.remove();
}

// --- Ecran d'entree ---
$('enter').addEventListener('click', () => {
  $('enter').classList.add('hidden');
  $('stage').classList.add('show');
  if (CONFIG.song){
    const player = $('player'); if (player) player.classList.add('show');
    audio.play().then(() => { if (ppIcon) ppIcon.innerHTML = ICON_PAUSE; }).catch(() => {});
  }
  const v = $('bg-video'); if (v && v.style.display !== 'none') v.play().catch(() => {});
}, { once:true });
