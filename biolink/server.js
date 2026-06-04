// ===========================================================================
//  PLATEFORME BIO-LINK MULTI-UTILISATEURS  (style guns.lol, auto-hebergeable)
//  Lancer :  npm install  puis  npm start
// ===========================================================================
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Dossiers ---
// DATA_DIR = dossier persistant (en local : le projet ; sur Railway : /data via un volume)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --- Vues / statique ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

// --- Sessions (stockees en SQLite, persistantes apres redemarrage) ---
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR }),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'lax' } // 30 jours
}));

// Rend l'utilisateur courant dispo dans toutes les vues
app.use((req, res, next) => {
  res.locals.me = req.session.userId
    ? db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.session.userId)
    : null;
  res.locals.isAdmin = isAdmin(req);
  res.locals.siteName = SITE_NAME;
  next();
});

// ===========================================================================
//  UPLOADS (multer)
// ===========================================================================
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  }
});
const ALLOWED = {
  avatar:       ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  background:   ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
  song:         ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'],
  cursor_image: ['image/png', 'image/gif', 'image/webp']
};
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 Mo max par fichier
  fileFilter: (req, file, cb) => {
    const list = ALLOWED[file.fieldname] || [];
    cb(null, list.includes(file.mimetype));
  }
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
  { name: 'song', maxCount: 1 },
  { name: 'cursor_image', maxCount: 1 }
]);

// ===========================================================================
//  HELPERS / VALIDATION
// ===========================================================================
const RESERVED = new Set([
  'login', 'register', 'logout', 'dashboard', 'static', 'uploads', 'api',
  'admin', 'about', 'terms', 'privacy', 'settings', 'account', 'home', 'forgot',
  'explore', 'discover', 'index', 'favicon.ico', 'robots.txt'
]);

// Compte admin : defini par la variable d'environnement ADMIN_USERNAME
function isAdmin(req) {
  if (!req.session.userId) return false;
  const u = db.prepare('SELECT username_lower FROM users WHERE id = ?').get(req.session.userId);
  return !!u && process.env.ADMIN_USERNAME && u.username_lower === process.env.ADMIN_USERNAME.toLowerCase();
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(403).send('Acces refuse.');
  next();
}
// Code de recuperation (mot de passe oublie, version sans e-mail)
function makeRecoveryCode() {
  return crypto.randomBytes(15).toString('hex').match(/.{1,5}/g).join('-').toUpperCase(); // ex: A1B2C-3D4E5-...
}

const ALLOWED_CURSORS = ['none', 'glow', 'ring', 'dot', 'trail', 'sparkle', 'comet', 'neon', 'rainbow', 'cross', 'orbit', 'image', 'image-trail'];
const ALLOWED_CARD_STYLE = ['glass', 'solid', 'none'];
const ALLOWED_CARD_SHAPE = ['rounded', 'square', 'round'];
const ALLOWED_AVATAR_SHAPE = ['circle', 'rounded', 'square'];
const ALLOWED_USERNAME_EFFECT = ['none', 'gradient', 'glow', 'shine'];

// Catalogue de badges (cle -> libelle). Attribues depuis le panneau admin.
const BADGE_CATALOG = [
  { key: 'verified',  label: 'Vérifié' },
  { key: 'staff',     label: 'Staff' },
  { key: 'owner',     label: 'Fondateur' },
  { key: 'developer', label: 'Développeur' },
  { key: 'premium',   label: 'Premium' },
  { key: 'donator',   label: 'Donateur' },
  { key: 'booster',   label: 'Booster' },
  { key: 'partner',   label: 'Partenaire' },
  { key: 'early',     label: 'Early User' },
  { key: 'og',        label: 'OG' },
  { key: 'winner',    label: 'Gagnant' },
  { key: 'bughunter', label: 'Bug Hunter' }
];
const BADGE_KEYS = BADGE_CATALOG.map(b => b.key);
// Badges effectifs d'un user (avec compat ascendante verified/staff)
function userBadges(u) {
  let list = [];
  try { list = JSON.parse(u.badges || '[]'); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  if (!list.length) { if (u.verified) list.push('verified'); if (u.staff) list.push('staff'); }
  return list.filter(k => BADGE_KEYS.includes(k));
}

// Nom du site (rebrandable) — defini par SITE_NAME, sinon "shrxk.lol"
const SITE_NAME = process.env.SITE_NAME || 'shrxk.lol';

// Logos des competences (CDN Devicon, charge cote navigateur)
const DEVICON = {
  'JavaScript':'javascript/javascript-original.svg','TypeScript':'typescript/typescript-original.svg',
  'Python':'python/python-original.svg','Java':'java/java-original.svg','C++':'cplusplus/cplusplus-original.svg',
  'C#':'csharp/csharp-original.svg','Go':'go/go-original-wordmark.svg','Rust':'rust/rust-original.svg',
  'PHP':'php/php-original.svg','React':'react/react-original.svg','Next.js':'nextjs/nextjs-original.svg',
  'Vue':'vuejs/vuejs-original.svg','Node.js':'nodejs/nodejs-original.svg','HTML':'html5/html5-original.svg',
  'CSS':'css3/css3-original.svg','Tailwind CSS':'tailwindcss/tailwindcss-original.svg',
  'MongoDB':'mongodb/mongodb-original.svg','SQL':'mysql/mysql-original.svg','Git':'git/git-original.svg',
  'Docker':'docker/docker-original.svg','Figma':'figma/figma-original.svg','Photoshop':'photoshop/photoshop-original.svg'
};

function validUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{1,20}$/.test(u) && !RESERVED.has(u.toLowerCase());
}

// --- Filtre de pseudos injurieux / haineux ---
// Normalise pour attraper les variantes : leetspeak (n3gr0), separateurs (n_e_g), etc.
function normalizeForFilter(s) {
  return String(s).toLowerCase()
    .replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/[3]/g, 'e')
    .replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/[7]/g, 't')
    .replace(/[8]/g, 'b').replace(/[^a-z]/g, ''); // enleve chiffres / _ / espaces
}
// Liste de base (NON exhaustive) — a completer selon tes besoins.
// La moderation humaine reste indispensable : aucun filtre n'attrape tout.
const BANNED_WORDS = [
  'nigger','nigga','negro','negre','bougnoul','bamboula','chink','kike','spic',
  'wetback','coon','gook','paki','raghead','sandnigger',
  'hitler','nazi','heilhitler','sieghei','kkk','holocaust',
  'faggot','tapette','pede','pedale','retard','mongol','tranny',
  'rape','rapist','pedo','pedophile','childporn','loli',
  'bitch','whore','slut','cunt','pute','salope','connard'
];
function isOffensiveUsername(u) {
  const n = normalizeForFilter(u);
  return BANNED_WORDS.some(w => n.includes(w));
}
function safeHex(c, fallback) {
  return (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c)) ? c : fallback;
}
function safeUrl(u) {
  if (typeof u !== 'string') return '';
  u = u.trim();
  if (!u) return '';
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return 'https://' + u; // on prefixe par defaut
}
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}
function toArray(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }

// Listes autorisees (widgets)
const ALLOWED_TZ = [
  '', 'UTC', 'Europe/Paris', 'Europe/London', 'Europe/Madrid', 'Europe/Berlin',
  'Europe/Moscow', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'America/Sao_Paulo',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Asia/Kolkata',
  'Australia/Sydney', 'Pacific/Auckland'
];
const ALLOWED_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP',
  'React', 'Next.js', 'Vue', 'Node.js', 'HTML', 'CSS', 'Tailwind CSS',
  'MongoDB', 'SQL', 'Git', 'Docker', 'Figma', 'Photoshop'
];

// ===========================================================================
//  ROUTES — PUBLIC
// ===========================================================================
app.get('/', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const recent = db.prepare(
    'SELECT username, avatar, title FROM users ORDER BY created_at DESC LIMIT 12'
  ).all();
  res.render('index', { count, recent });
});

// ---- Inscription ----
app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('register', { error: null, username: '' });
});
app.post('/register', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const render = (error) => res.status(400).render('register', { error, username });

  if (!validUsername(username))
    return render("Pseudo invalide (1 a 20 caracteres : lettres, chiffres, _).");
  if (isOffensiveUsername(username))
    return render("Ce pseudo n'est pas autorise. Merci d'en choisir un autre.");
  if (password.length < 6)
    return render('Le mot de passe doit faire au moins 6 caracteres.');
  const exists = db.prepare('SELECT 1 FROM users WHERE username_lower = ?').get(username.toLowerCase());
  if (exists) return render('Ce pseudo est deja pris.');

  const hash = bcrypt.hashSync(password, 10);
  const recoveryCode = makeRecoveryCode();
  const recoveryHash = bcrypt.hashSync(recoveryCode, 10);
  const info = db.prepare(
    'INSERT INTO users (username, username_lower, password, created_at, recovery_hash) VALUES (?,?,?,?,?)'
  ).run(username, username.toLowerCase(), hash, Date.now(), recoveryHash);
  req.session.userId = info.lastInsertRowid;
  // On montre le code de recuperation UNE SEULE FOIS
  res.render('recovery', { username, recoveryCode });
});

// ---- Mot de passe oublie (code de recuperation, sans e-mail) ----
app.get('/forgot', (req, res) => res.render('forgot', { error: null, done: false }));
app.post('/forgot', (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const code = (req.body.code || '').trim();
  const newPassword = req.body.password || '';
  const fail = (error) => res.status(400).render('forgot', { error, done: false });
  if (newPassword.length < 6) return fail('Le nouveau mot de passe doit faire au moins 6 caracteres.');
  const user = db.prepare('SELECT * FROM users WHERE username_lower = ?').get(username);
  if (!user || !user.recovery_hash || !bcrypt.compareSync(code, user.recovery_hash)) {
    return fail('Pseudo ou code de recuperation incorrect.');
  }
  // Nouveau mot de passe + nouveau code de recuperation
  const newCode = makeRecoveryCode();
  db.prepare('UPDATE users SET password = ?, recovery_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), bcrypt.hashSync(newCode, 10), user.id);
  res.render('forgot', { error: null, done: true });
});

// ---- Connexion ----
app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null, username: '' });
});
app.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const user = db.prepare('SELECT * FROM users WHERE username_lower = ?').get(username.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).render('login', { error: 'Pseudo ou mot de passe incorrect.', username });
  }
  req.session.userId = user.id;
  res.redirect('/dashboard');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ---- Suppression de son propre compte ----
app.post('/account/delete', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.session.userId);
  req.session.destroy(() => res.redirect('/'));
});

// ---- Panneau admin ----
app.get('/admin', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, username, created_at, views, badges, verified, staff FROM users ORDER BY created_at DESC').all();
  const users = rows.map(u => ({ id: u.id, username: u.username, views: u.views, badges: userBadges(u) }));
  res.render('admin', { users, catalog: BADGE_CATALOG });
});
app.post('/admin/badge', requireAdmin, (req, res) => {
  const key = req.body.key;
  if (!BADGE_KEYS.includes(key)) return res.status(400).send('Badge invalide');
  const id = parseInt(req.body.id, 10);
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (u) {
    let list = userBadges(u);
    list = list.includes(key) ? list.filter(k => k !== key) : list.concat(key);
    db.prepare('UPDATE users SET badges = ? WHERE id = ?').run(JSON.stringify(list), id);
  }
  res.redirect('/admin');
});
app.post('/admin/delete', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(parseInt(req.body.id, 10));
  res.redirect('/admin');
});

// ===========================================================================
//  ROUTES — DASHBOARD (edition du profil)
// ===========================================================================
app.get('/dashboard', requireAuth, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.render('dashboard', {
    u,
    bio: JSON.parse(u.bio || '[]').join('\n'),
    socials: JSON.parse(u.socials || '[]'),
    buttons: JSON.parse(u.buttons || '[]'),
    skills: JSON.parse(u.skills || '[]'),
    allowedTz: ALLOWED_TZ,
    allowedSkills: ALLOWED_SKILLS,
    allowedCursors: ALLOWED_CURSORS,
    allowedCardStyle: ALLOWED_CARD_STYLE,
    allowedCardShape: ALLOWED_CARD_SHAPE,
    allowedAvatarShape: ALLOWED_AVATAR_SHAPE,
    saved: req.query.saved === '1'
  });
});

app.post('/dashboard', requireAuth, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).send('Erreur d\'upload : ' + err.message + ' (taille max 25 Mo, formats image/video/audio).');
    }
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
    const b = req.body;
    const files = req.files || {};

    // Champs texte
    const title = (b.title || '').slice(0, 80);
    const bioLines = JSON.stringify((b.bio || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6));
    const songName = (b.song_name || '').slice(0, 80);
    const accent = safeHex(b.accent, '#8b5cf6');
    const accent2 = safeHex(b.accent2, '#22d3ee');
    const effect = ['snow', 'rain', 'stars', 'none'].includes(b.effect) ? b.effect : 'none';
    const status = ['online', 'idle', 'dnd', 'offline', ''].includes(b.status) ? b.status : '';
    const cursorStyle = ALLOWED_CURSORS.includes(b.cursor_style) ? b.cursor_style : 'none';
    const cursor = cursorStyle !== 'none' ? 1 : 0;

    // Nouveaux champs : fuseau horaire, competences, localisation, serveur Discord, presence Discord
    const timezone = ALLOWED_TZ.includes(b.timezone) ? b.timezone : '';
    const skills = JSON.stringify(toArray(b.skills).filter(s => ALLOWED_SKILLS.includes(s)).slice(0, 12));
    const location = (b.location || '').slice(0, 40);
    const discordGuild = /^[0-9]{5,25}$/.test((b.discord_guild || '').trim()) ? b.discord_guild.trim() : '';
    const discordUser = /^[0-9]{5,25}$/.test((b.discord_user || '').trim()) ? b.discord_user.trim() : '';
    const cardStyle = ALLOWED_CARD_STYLE.includes(b.card_style) ? b.card_style : 'glass';
    const cardShape = ALLOWED_CARD_SHAPE.includes(b.card_shape) ? b.card_shape : 'rounded';
    const avatarShape = ALLOWED_AVATAR_SHAPE.includes(b.avatar_shape) ? b.avatar_shape : 'circle';
    const enterText = (b.enter_text || '').slice(0, 40);
    const usernameEffect = ALLOWED_USERNAME_EFFECT.includes(b.username_effect) ? b.username_effect : 'none';

    // Liens sociaux + boutons (champs repetes)
    const sTypes = toArray(b.social_type), sUrls = toArray(b.social_url);
    const socials = [];
    for (let i = 0; i < sTypes.length; i++) {
      const url = safeUrl(sUrls[i]);
      if (url && sTypes[i]) socials.push({ type: String(sTypes[i]).slice(0, 20), url });
    }
    const bLabels = toArray(b.btn_label), bUrls = toArray(b.btn_url);
    const buttons = [];
    for (let i = 0; i < bLabels.length; i++) {
      const url = safeUrl(bUrls[i]);
      const label = String(bLabels[i] || '').trim().slice(0, 40);
      if (url && label) buttons.push({ label, url });
    }

    // Fichiers (on remplace seulement si un nouveau est envoye)
    let avatar = u.avatar, background = u.background, bgIsVideo = u.bg_is_video, song = u.song;
    let songArt = u.song_art || '';
    if (files.avatar)     avatar = '/uploads/' + files.avatar[0].filename;
    if (files.background) {
      background = '/uploads/' + files.background[0].filename;
      bgIsVideo = files.background[0].mimetype.startsWith('video/') ? 1 : 0;
    }
    if (files.song) {
      song = '/uploads/' + files.song[0].filename; // fichier uploade : pas de pochette
      songArt = '';
    } else if (b.song_url && /^https?:\/\//i.test(b.song_url)) {
      song = b.song_url;                            // musique choisie via la recherche
      songArt = (b.song_art && /^https?:\/\//i.test(b.song_art)) ? b.song_art : '';
    }
    let cursorImage = u.cursor_image || '';
    if (files.cursor_image) cursorImage = '/uploads/' + files.cursor_image[0].filename;
    else if (b.cursor_image_url && /^https?:\/\//i.test(b.cursor_image_url.trim())) cursorImage = b.cursor_image_url.trim();

    db.prepare(`UPDATE users SET
      title=?, bio=?, song_name=?, accent=?, accent2=?, effect=?, status=?, cursor=?,
      socials=?, buttons=?, avatar=?, background=?, bg_is_video=?, song=?, song_art=?,
      timezone=?, skills=?, location=?, discord_guild=?, discord_user=?, cursor_style=?,
      card_style=?, card_shape=?, avatar_shape=?, cursor_image=?, enter_text=?, username_effect=?
      WHERE id=?`).run(
      title, bioLines, songName, accent, accent2, effect, status, cursor,
      JSON.stringify(socials), JSON.stringify(buttons),
      avatar, background, bgIsVideo, song, songArt,
      timezone, skills, location, discordGuild, discordUser, cursorStyle,
      cardStyle, cardShape, avatarShape, cursorImage, enterText, usernameEffect, u.id
    );

    res.redirect('/dashboard?saved=1');
  });
});

// ===========================================================================
//  API — RECHERCHE DE MUSIQUE (proxy iTunes Search, gratuit, sans cle)
//  Renvoie des apercus de ~30s. Doit etre AVANT la route /:username.
// ===========================================================================
app.get('/api/music/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 2) return res.json([]);
  try {
    const url = 'https://itunes.apple.com/search?media=music&entity=song&limit=8&term=' + encodeURIComponent(q);
    const r = await fetch(url);
    const data = await r.json();
    const results = (data.results || [])
      .filter(t => t.previewUrl)
      .map(t => ({
        name: (t.trackName + ' - ' + t.artistName).slice(0, 80),
        url:  t.previewUrl,
        art:  (t.artworkUrl100 || '').replace('100x100', '300x300')
      }));
    res.json(results);
  } catch (e) {
    res.status(502).json([]);
  }
});

// ===========================================================================
//  ROUTE — PROFIL PUBLIC  (tonsite.com/pseudo)  -> doit rester EN DERNIER
// ===========================================================================
app.get('/:username', (req, res, next) => {
  const name = req.params.username;
  if (RESERVED.has(name.toLowerCase())) return next();
  const u = db.prepare('SELECT * FROM users WHERE username_lower = ?').get(name.toLowerCase());
  if (!u) return res.status(404).render('404');

  // Compteur de vues "intelligent" :
  //  - on ne compte pas les visites du proprietaire du profil
  //  - une vue par visiteur n'est comptee qu'une fois toutes les 6h (anti-rechargement)
  let viewsCount = u.views;
  const isOwner = req.session.userId === u.id;
  if (!isOwner) {
    if (!req.session.viewed) req.session.viewed = {};
    const last = req.session.viewed[u.username_lower] || 0;
    if (Date.now() - last > 6 * 3600 * 1000) {
      db.prepare('UPDATE users SET views = views + 1 WHERE id = ?').run(u.id);
      req.session.viewed[u.username_lower] = Date.now();
      viewsCount = u.views + 1;
    }
  }

  const cfg = {
    username:   u.username,
    title:      u.title,
    bio:        JSON.parse(u.bio || '[]'),
    avatar:     u.avatar,
    background: u.background,
    bgIsVideo:  !!u.bg_is_video,
    song:       u.song,
    songName:   u.song_name,
    songArt:    u.song_art || '',
    accent:     u.accent,
    accent2:    u.accent2,
    effect:     u.effect,
    status:     u.status,
    cursor:     !!u.cursor,
    socials:    JSON.parse(u.socials || '[]'),
    buttons:    JSON.parse(u.buttons || '[]'),
    timezone:     u.timezone || '',
    skills:       JSON.parse(u.skills || '[]'),
    skillIcons:   DEVICON,
    location:     u.location || '',
    discordGuild: u.discord_guild || '',
    discordUser:  u.discord_user || '',
    cursorStyle:  u.cursor_style || 'none',
    cursorImage:  u.cursor_image || '',
    cardStyle:    u.card_style || 'glass',
    cardShape:    u.card_shape || 'rounded',
    avatarShape:  u.avatar_shape || 'circle',
    verified:     !!u.verified,
    staff:        !!u.staff,
    badges:       userBadges(u),
    enterText:    u.enter_text || '',
    usernameEffect: u.username_effect || 'none',
    views:      viewsCount
  };
  // Serialisation JSON sure (empeche la cassure de la balise </script>)
  const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c');
  res.render('profile', { cfg, cfgJson });
});

app.use((req, res) => res.status(404).render('404'));

app.listen(PORT, () => console.log(`✅ En ligne sur http://localhost:${PORT}`));
