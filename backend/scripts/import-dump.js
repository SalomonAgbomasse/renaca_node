const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 1. Recherche du fichier .env
function findEnv() {
  let dir = __dirname;
  while (dir) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    const parentDir = path.dirname(dir);
    if (parentDir === dir) break;
    dir = parentDir;
  }
  return null;
}

const hasEnvVars = process.env.DB_HOST && process.env.DB_DATABASE;
let envPath = null;

if (!hasEnvVars) {
  envPath = findEnv();
  if (!envPath) {
    console.error('❌ Impossible de trouver le fichier .env.');
    process.exit(1);
  }
  // Charger les variables d'environnement
  require('dotenv').config({ path: envPath });
  console.log(`📝 Configuration chargée depuis : ${envPath}`);
} else {
  console.log('📝 Configuration chargée depuis les variables d\'environnement système (Docker)');
}

// 2. Déterminer le fichier SQL à importer
let sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  sqlFilePath = path.resolve(__dirname, '../Sql/fnda_node.sql');
} else {
  if (!path.isAbsolute(sqlFilePath)) {
    sqlFilePath = path.resolve(process.cwd(), sqlFilePath);
  }
}

if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ Le fichier SQL n'existe pas : ${sqlFilePath}`);
  process.exit(1);
}

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '3306';
const dbUser = process.env.DB_USERNAME || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_DATABASE || 'fnda_node';

// Machine à états pour découper le fichier SQL en requêtes individuelles
function parseSqlFile(filePath) {
  console.log(`📖 Lecture et découpage du fichier SQL : ${filePath}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  const queries = [];
  let current = '';
  let state = 'NORMAL';

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    if (state === 'NORMAL') {
      if (c === "'") {
        state = 'SINGLE_QUOTE';
        current += c;
      } else if (c === '"') {
        state = 'DOUBLE_QUOTE';
        current += c;
      } else if (c === '`') {
        state = 'BACKTICK';
        current += c;
      } else if (c === '-' && sql[i + 1] === '-') {
        state = 'COMMENT_LINE';
        i++; // Sauter le deuxième '-'
      } else if (c === '#') {
        state = 'COMMENT_LINE';
      } else if (c === '/' && sql[i + 1] === '*') {
        state = 'COMMENT_BLOCK';
        i++; // Sauter le '*'
      } else if (c === ';') {
        const trimmed = current.trim();
        if (trimmed) {
          queries.push(trimmed);
        }
        current = '';
      } else {
        current += c;
      }
    } else if (state === 'SINGLE_QUOTE') {
      current += c;
      if (c === '\\') {
        i++;
        if (i < sql.length) current += sql[i];
      } else if (c === "'") {
        state = 'NORMAL';
      }
    } else if (state === 'DOUBLE_QUOTE') {
      current += c;
      if (c === '\\') {
        i++;
        if (i < sql.length) current += sql[i];
      } else if (c === '"') {
        state = 'NORMAL';
      }
    } else if (state === 'BACKTICK') {
      current += c;
      if (c === '`') {
        state = 'NORMAL';
      }
    } else if (state === 'COMMENT_LINE') {
      if (c === '\n' || c === '\r') {
        state = 'NORMAL';
      }
    } else if (state === 'COMMENT_BLOCK') {
      if (c === '*' && sql[i + 1] === '/') {
        state = 'NORMAL';
        i++; // Sauter le '/'
      }
    }
  }

  const trimmed = current.trim();
  if (trimmed) {
    queries.push(trimmed);
  }

  return queries;
}

// Analyseur des valeurs d'une clause VALUES (ligne par ligne de valeurs parenthesées)
function parseValuesString(str) {
  const rows = [];
  let currentVal = '';
  let inString = false;
  let quoteChar = null;
  let inRow = false;
  let currentRow = [];
  let wasQuoted = false;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];

    if (!inRow) {
      if (c === '(') {
        inRow = true;
        currentRow = [];
        currentVal = '';
        wasQuoted = false;
      }
    } else {
      if (inString) {
        if (c === '\\') {
          i++;
          if (i < str.length) {
            currentVal += str[i];
          }
        } else if (c === quoteChar) {
          inString = false;
          quoteChar = null;
        } else {
          currentVal += c;
        }
      } else {
        if (c === "'" || c === '"') {
          inString = true;
          quoteChar = c;
          wasQuoted = true;
        } else if (c === ')') {
          currentRow.push({ value: currentVal.trim(), isQuoted: wasQuoted });
          rows.push(currentRow);
          inRow = false;
        } else if (c === ',') {
          currentRow.push({ value: currentVal.trim(), isQuoted: wasQuoted });
          currentVal = '';
          wasQuoted = false;
        } else {
          currentVal += c;
        }
      }
    }
  }
  return rows;
}

// Convertit la valeur SQL textuelle brute en type Javascript adéquat
function getVal(item) {
  if (!item) return null;
  if (!item.isQuoted) {
    const v = item.value;
    if (v === 'NULL' || v === 'null' || v === '') return null;
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    return v;
  }
  return item.value;
}

// Formate les dates bordéliques du dump en format MySQL standard YYYY-MM-DD HH:MM:SS
function parseDumpDate(dateStr) {
  if (!dateStr) return null;
  
  // Enlever les guillemets et antislashs éventuels
  const cleanStr = dateStr.toString().replace(/['"`\\]/g, '').trim();
  if (!cleanStr || cleanStr === 'NULL' || cleanStr === 'null') {
    return null;
  }

  // Format: '04/04/2024 à 08:51:44'
  const matchDateTime = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*à\s*(\d{2}):(\d{2}):(\d{2})/);
  if (matchDateTime) {
    const [, day, month, year, hours, minutes, seconds] = matchDateTime;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // Format: '18/07/2024'
  const matchDate = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchDate) {
    const [, day, month, year] = matchDate;
    return `${year}-${month}-${day}`;
  }
  
  // Format déjà MySQL: YYYY-MM-DD HH:MM:SS ou YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/.test(cleanStr)) {
    return cleanStr;
  }
  
  // Fallback avec Date Javascript
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  return null;
}

// Nettoie et convertit les taux (ex: '12%' -> 12.00)
function parseTaux(tauxStr) {
  if (!tauxStr || tauxStr === 'NULL' || tauxStr === 'null') return 0;
  const cleaned = tauxStr.toString().replace(/%/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Convertit un tableau de cellules brutes en objet clé-valeur
function rowToObj(columns, row) {
  const obj = {};
  columns.forEach((col, idx) => {
    obj[col] = getVal(row[idx]);
  });
  return obj;
}

// Configuration des rôles du seeder
const defaultRoles = [
  { id: 1, libelle: 'ADMIN', desc: 'Administrateur système' },
  { id: 2, libelle: 'MANAGER', desc: 'Gestionnaire' },
  { id: 4, libelle: 'USER', desc: 'Utilisateur standard' },
  { id: 5, libelle: 'SUPER ADMIN', desc: 'Super administrateur' },
  { id: 6, libelle: 'AGENCY MANAGER', desc: 'Gestionnaire d\'agence' }
];

// Map globale pour stocker la relation idContract -> idContractState
const contractStateMap = new Map();

// Sets pour garantir l'unicité des colonnes avec contrainte unique
const insertedPolices = new Set();
const insertedReferences = new Set();
const insertedKeyConts = new Set();
const insertedCotationReferences = new Set();
const insertedEmails = new Set();
const insertedPhones = new Set();
const insertedSubscriberNames = new Set();

function getUniqueValue(val, id, set, maxLength) {
  if (val === null || val === undefined) return null;
  let uniqueVal = val.toString().trim();
  if (set.has(uniqueVal)) {
    uniqueVal = `${uniqueVal}_${id}`;
  }
  if (uniqueVal.length > maxLength) {
    const suffix = `_${id}`;
    uniqueVal = uniqueVal.slice(0, maxLength - suffix.length) + suffix;
  }
  let counter = 1;
  while (set.has(uniqueVal)) {
    const suffix = `_${id}_${counter}`;
    uniqueVal = val.toString().trim().slice(0, maxLength - suffix.length) + suffix;
    counter++;
  }
  set.add(uniqueVal);
  return uniqueVal;
}

// Mappage de chaque ligne d'application vers son nouveau schéma TypeORM
function mapRow(tableName, obj) {
  if (tableName === 'roles') {
    return null; // Skip - géré manuellement
  }

  if (tableName === 'subscriber') {
    const subscriberName = obj.name ? getUniqueValue(obj.name, obj.id, insertedSubscriberNames, 100) : `SUBSCRIBER_${obj.id}`;
    return {
      id: obj.id,
      name: subscriberName,
      address: obj.address,
      email: obj.email,
      phone: obj.phone,
      phone2: null,
      fax: obj.fax,
      createdAt: parseDumpDate(obj.created_at) || new Date(),
      updatedAt: parseDumpDate(obj.update_at) || new Date(),
      deletedAt: null
    };
  }

  if (tableName === 'office') {
    return {
      id: obj.id,
      idAgency: obj.idAgency,
      officeName: obj.officeName,
      address_bureau: obj.address_bureau,
      phone_bureau: obj.phone_bureau,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
  }

  if (tableName === 'agency') {
    return {
      id: obj.id,
      idSubscriber: obj.idSubscriber,
      createdBy: 1,
      updatedBy: null,
      deletedBy: null,
      name: obj.name,
      address: obj.address,
      email: obj.email,
      phone: obj.phone || 'N/A',
      fax: obj.fax,
      createdAt: parseDumpDate(obj.created_at) || new Date(),
      updatedAt: parseDumpDate(obj.updated_at) || new Date(),
      deletedAt: null
    };
  }

  if (tableName === 'users') {
    // Aligner le rôle avec les rôles autorisés du seeder
    let newRoleId = obj.idRole;
    if (![1, 2, 4, 5, 6].includes(newRoleId)) {
      newRoleId = 4; // Par défaut USER
    }

    let email = obj.email;
    if (email === 'NULL' || email === 'null' || !email || email.trim() === '') {
      email = null;
    } else {
      email = getUniqueValue(email, obj.id, insertedEmails, 255);
    }

    let phone = obj.phone;
    if (phone === 'NULL' || phone === 'null' || !phone || phone.trim() === '') {
      phone = null;
    } else {
      // Normalisation : trim les espaces
      let rawPhone = phone.trim();
      // Séparer un éventuel préfixe spécial (ex: 'desactive_', 'DES') du numéro réel
      const prefixMatch = rawPhone.match(/^([a-zA-Z_]+)(\d+)$/);
      if (prefixMatch) {
        // Cas 'desactive_67858159' ou 'DES66269319' : normaliser la partie numérique
        const specialPrefix = prefixMatch[1];
        const digits = prefixMatch[2];
        const normalizedDigits = digits.length === 8 ? '01' + digits : digits;
        rawPhone = specialPrefix + normalizedDigits;
      } else if (/^\d{8}$/.test(rawPhone)) {
        // Exactement 8 chiffres → préfixer avec '01'
        rawPhone = '01' + rawPhone;
      }
      phone = getUniqueValue(rawPhone, obj.id, insertedPhones, 30);
    }

    return {
      id: obj.id,
      idRole: newRoleId,
      idAgency: obj.idAgency,
      idOffice: obj.idOffice,
      lastname: obj.lastname,
      firstname: obj.firstname,
      email: email,
      address: obj.address,
      phone: phone,
      birthdate: obj.birthdate,
      gender: obj.gender,
      fonction: obj.fonction,
      password: obj.password,
      salt: obj.salt,
      avatar: obj.avatar,
      created_at: parseDumpDate(obj.created_at) || new Date(),
      updated_at: parseDumpDate(obj.updated_at) || new Date(),
      deleted_at: null,
      deletedBy: null,
      version: parseInt(obj.version, 10) || 0,
      status: (obj.status || 'ACTIVE').toUpperCase(),
      dateSaisie: parseDumpDate(obj.dateSaisie) || new Date(),
      sms_token: null,
      sms_token_expires: null,
      is_verified: true,
      two_factor_enabled: false,
      two_factor_secret: null,
      last_login: null,
      login_attempts: 0,
      locked_until: null
    };
  }

  if (tableName === 'customers') {
    return {
      id: obj.id,
      idTypeCustomer: obj.idTypeCustomer,
      idUser: obj.idUser,
      updatedBy: null,
      deletedBy: null,
      numCustomer: obj.numCustomer || '0',
      lastname: obj.lastname,
      firstname: obj.firstname,
      email: obj.email,
      address: obj.address || 'N/A',
      phone: obj.phone || 'N/A',
      place_of_birth: obj.place_of_birth || 'N/A',
      birthdate: parseDumpDate(obj.birthdate) || '1970-01-01',
      occupation: obj.occupation || 'N/A',
      gender: obj.gender || 'M',
      isActive: true,
      created_at: parseDumpDate(obj.created_at) || new Date(),
      updated_at: parseDumpDate(obj.updated_at) || new Date(),
      deleted_at: null,
      version: parseInt(obj.version, 10) || 0
    };
  }

  if (tableName === 'cotation') {
    let typeCredit = 'AMORT';
    if (obj.idCreditType && obj.idCreditType !== 'A') {
      typeCredit = obj.idCreditType;
    }
    let reference = `${typeCredit}-${obj.id}`;
    reference = getUniqueValue(reference, obj.id, insertedCotationReferences, 50);

    return {
      id: obj.id,
      idUser: obj.idUser,
      idAgency: obj.idAgency,
      idCustomer: obj.idCustomer === 0 ? null : obj.idCustomer,
      idNatureCredit: 1, // AMORTISSABLE
      idPeriodicite: obj.idPeriodicite || 1,
      typeAss: obj.typeAss || '1',
      capital: parseInt(obj.capital, 10) || 0,
      capital_interet: parseInt(obj.capital_interet, 10) || 0,
      duration: parseInt(obj.duration, 10) || 0,
      differe: parseInt(obj.differe, 10) || 0,
      garantieCompl: obj.garantieCompl || 'NON',
      pd: parseInt(obj.pd, 10) || 0,
      pc: parseInt(obj.pc, 10) || 0,
      surp: parseInt(obj.surp, 10) || 0,
      acc: parseInt(obj.acc, 10) || 0,
      fm: parseInt(obj.fm, 10) || 0,
      puttc: parseInt(obj.puttc, 10) || 0,
      reference: reference,
      status: 'PENDING',
      amount: null,
      lastname: obj.lastname,
      firstname: obj.firstname,
      birthdate: obj.birthdate,
      etablissement: obj.etablissement,
      dateSaisie: parseDumpDate(obj.dateSaisie) || new Date(),
      dateModif: parseDumpDate(obj.dateSaisie) || new Date(),
      updatedAt: parseDumpDate(obj.dateSaisie) || new Date(),
      deletedAt: null
    };
  }

  if (tableName === 'contracts') {
    const stateId = contractStateMap.get(obj.id) || 1;

    let police = obj.police || `TEMP_POL_${obj.id}`;
    police = getUniqueValue(police, obj.id, insertedPolices, 50);

    let reference = obj.reference || `TEMP_REF_${obj.id}`;
    reference = getUniqueValue(reference, obj.id, insertedReferences, 100);

    let keyCont = obj.keyCont || `TEMP_KEY_${obj.id}`;
    keyCont = getUniqueValue(keyCont, obj.id, insertedKeyConts, 50);

    return {
      id: obj.id,
      idCustomer: obj.idCustomer === 0 ? null : obj.idCustomer,
      idUser: obj.idUser,
      updatedBy: null,
      deletedBy: null,
      idProduct: obj.idProduct,
      idContractState: stateId,
      idAgency: obj.idAgency,
      idNatureCredit: 1, // AMORTISSABLE
      capital: parseInt(obj.capital, 10) || 0,
      duration: parseInt(obj.duration, 10) || 0,
      differe: parseInt(obj.differe, 10) || 0,
      idPeriodicite: obj.idPeriodicite || 1,
      taux: parseTaux(obj.taux),
      dateEff: parseDumpDate(obj.dateEff) || new Date(),
      dateEch1: parseDumpDate(obj.dateEch1) || new Date(),
      dateEch: parseDumpDate(obj.dateEch) || new Date(),
      pd: parseInt(obj.pd, 10) || 0,
      pc: parseInt(obj.pc, 10) || 0,
      surp: parseInt(obj.surp, 10) || 0,
      acc: parseInt(obj.acc, 10) || 0,
      fm: parseInt(obj.fm, 10) || 0,
      puttc: parseInt(obj.puttc, 10) || 0,
      police: police,
      reference: reference,
      garantieCompl: obj.garantieCompl || 'NON',
      etablissement: obj.etablissement,
      description: null,
      keyCont: keyCont,
      isActive: true,
      contractType: (obj.other && obj.other.toString().toLowerCase() === 'hla') ? 'HLA' : 'STANDARD',
      created_at: parseDumpDate(obj.dateSaisie) || parseDumpDate(obj.dateEff) || new Date(),
      updated_at: parseDumpDate(obj.updated_at) || parseDumpDate(obj.dateSaisie) || new Date(),
      deleted_at: null
    };
  }

  if (tableName === 'products') {
    return {
      id: obj.id,
      title: obj.title,
      code: obj.code,
      name: obj.title,
      isActive: true,
      category: 'INSURANCE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
  }

  if (tableName === 'type_customer') {
    console.log('DEBUG type_customer: raw obj =', JSON.stringify(obj));
    const result = {
      id: obj.id,
      libelle: obj.libelle || obj.title,
      description: obj.description || obj.title,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    console.log('DEBUG type_customer: mapped obj =', JSON.stringify(result));
    return result;
  }

  if (tableName === 'periodicite') {
    const codes = { 1: 'M', 2: 'B', 3: 'T', 4: 'Q', 5: 'QQ', 6: 'S', 12: 'A' };
    const months = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 12: 12 };
    const libelleVal = obj.libelle || obj.libelPer || '';
    return {
      id: obj.id,
      libelle: libelleVal,
      code: codes[obj.id] || 'M',
      nombreMois: months[obj.id] || 1,
      description: `Paiement ${libelleVal.toLowerCase()}`,
      isActive: true
    };
  }

  if (tableName === 'contract_state') {
    return {
      id: obj.id,
      libelle: obj.libelle || obj.title,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
  }

  return null;
}

// Effectue une insertion paramétrée propre
async function insertMappedRow(connection, tableName, mappedObj) {
  const keys = Object.keys(mappedObj);
  const values = Object.values(mappedObj);
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO \`${tableName}\` (\`${keys.join('`, `')}\`) VALUES (${placeholders})`;
  await connection.query(sql, values);
}

const ignoredTables = [
  'compte_parraine',
  'bouclier_emprunteur',
  'bouclier_emprunteur_audit_log',
  'tarif_a',
  'tarif_c',
  'tarif_homme_cle',
  'tarif_emprunteur'
];

const appTables = [
  'subscriber',
  'agency',
  'office',
  'users',
  'customers',
  'cotation',
  'contracts',
  'roles',
  'periodicite',
  'products',
  'type_customer',
  'credit_type',
  'nature_credits',
  'production_states',
  'quotations',
  'contract_state',
  'contract_history',
  'customer_history',
  'bi_alert_thresholds',
  'user_activities',
  'user_sessions',
  'email_notifications',
  'audit_logs'
];

async function run() {
  let connection;
  try {
    console.log(`🔌 Connexion au serveur MySQL ${dbHost}:${dbPort}...`);
    connection = await mysql.createConnection({
      host: dbHost,
      port: parseInt(dbPort, 10),
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true
    });
    console.log(`✅ Connecté à la base de données "${dbName}".`);

    // Analyse du dump SQL
    const queries = parseSqlFile(sqlFilePath);
    console.log(`🔍 ${queries.length} requêtes SQL extraites du fichier.`);

    // Réinitialiser les Sets de dédoublonnage pour éviter les fuites d'états
    insertedPolices.clear();
    insertedReferences.clear();
    insertedKeyConts.clear();
    insertedCotationReferences.clear();
    insertedEmails.clear();
    insertedPhones.clear();
    insertedSubscriberNames.clear();

    // Pass 1 : Analyse de compte_parraine pour extraire les états des contrats
    console.log("🔍 Pass 1 : Analyse de la table compte_parraine...");
    for (const query of queries) {
      const match = query.match(/^INSERT\s+INTO\s+`?compte_parraine`?\s*\(([^)]+)\)\s*VALUES\s*(.*)$/is);
      if (match) {
        const columns = match[1].split(',').map(c => c.replace(/`/g, '').trim());
        const valuesStr = match[2].trim();
        const cleanValuesStr = valuesStr.endsWith(';') ? valuesStr.slice(0, -1) : valuesStr;
        const rows = parseValuesString(cleanValuesStr);
        rows.forEach(row => {
          const obj = rowToObj(columns, row);
          if (obj.idContract && obj.idContractState) {
            contractStateMap.set(parseInt(obj.idContract, 10), parseInt(obj.idContractState, 10));
          }
        });
      }
    }
    console.log(`   -> ${contractStateMap.size} états de contrat extraits.`);

    // Désactiver les clés étrangères
    console.log(`⚡ Désactivation des contraintes (FOREIGN_KEY_CHECKS = 0)...`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('SET UNIQUE_CHECKS = 0;');

    // Vider les tables et réinitialiser les compteurs d'auto-incrément
    console.log(`🗑️ Vidage (TRUNCATE) des tables applicatives locales...`);
    const tablesToTruncate = [
      'contract_history',
      'customer_history',
      'audit_logs',
      'cotation',
      'contracts',
      'customers',
      'users',
      'office',
      'agency',
      'subscriber',
      'roles',
      'products',
      'type_customer',
      'periodicite',
      'contract_state',
      'nature_credits'
    ];
    for (const table of tablesToTruncate) {
      try {
        await connection.query(`TRUNCATE TABLE \`${table}\`;`);
        console.log(`   -> Table \`${table}\` vidée.`);
      } catch (err) {
        console.warn(`   ⚠️ Impossible de vider \`${table}\` (peut-être inexistante).`);
      }
    }

    // Supprimer les tables de logs et annexes existantes pour éviter les conflits de clés étrangères lors de la recréation
    console.log(`🗑️ Suppression des tables de logs et annexes existantes...`);
    const tablesToDrop = [
      'comments',
      'sinistres',
      'sinistre_deces',
      'sinistre_iad',
      'sinistre_pe',
      'status',
      'typesinistre',
      'customer_audit_log',
      'contract_audit_log'
    ];
    for (const table of tablesToDrop) {
      try {
        await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
        console.log(`   -> Table \`${table}\` supprimée.`);
      } catch (err) {
        console.warn(`   ⚠️ Impossible de supprimer \`${table}\` (${err.message}).`);
      }
    }

    // Ré-insérer les rôles du seeder
    console.log(`🌱 Ré-insertion des rôles conformes au seeder applicatif...`);
    for (const role of defaultRoles) {
      await connection.query(
        'INSERT INTO `roles` (`id`, `libelle`, `desc`, `createdAt`, `updatedAt`, `deletedAt`) VALUES (?, ?, ?, NOW(), NOW(), NULL)',
        [role.id, role.libelle, role.desc]
      );
    }
    console.log('   -> Rôles ré-initialisés avec succès.');

    // Ré-insérer les natures de crédit conformes à l'application
    console.log(`🌱 Ré-insertion des natures de crédit (AMORT, CP, OBA)...`);
    const defaultNatureCredits = [
      { id: 1, libelle: 'AMORTISSABLE', code: 'AMORT', description: 'Crédit amortissable', isActive: true },
      { id: 2, libelle: 'PADME PROTECTION', code: 'CP', description: 'PADME PROTECTION', isActive: true },
      { id: 3, libelle: 'OBSÈQUES ALAFIA', code: 'OBA', description: 'Obsèques Alafia', isActive: true }
    ];
    for (const nc of defaultNatureCredits) {
      await connection.query(
        'INSERT INTO `nature_credits` (`id`, `libelle`, `code`, `description`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `libelle` = VALUES(`libelle`), `code` = VALUES(`code`), `description` = VALUES(`description`), `isActive` = VALUES(`isActive`)',
        [nc.id, nc.libelle, nc.code, nc.description, nc.isActive]
      );
    }
    console.log('   -> Natures de crédit ré-initialisées avec succès.');

    const startTime = Date.now();
    let insertCount = 0;
    let otherCount = 0;

    // Pass 2 : Traitement et insertion des données
    console.log("🚀 Pass 2 : Début de l'insertion des données de production...");
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      // 1. Gérer les CREATE TABLE
      const createMatch = query.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (createMatch) {
        const tableName = createMatch[1];
        if (ignoredTables.includes(tableName)) {
          continue; // Ignorer la création des tables supprimées
        }
        // Si c'est une table applicative ou gérée, on garde le schéma TypeORM actuel
        if (appTables.includes(tableName) || tableName === 'roles') {
          // Ignorer la création, on utilise le schéma existant propre de l'app
          continue;
        }
        // Sinon (tables de logs de prod ou autres tables annexes), on recrée verbatim
        console.log(`🔨 Recréation de la table annexe/log: \`${tableName}\``);
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\`;`);
        await connection.query(query);
        continue;
      }

      // 2. Gérer les INSERT INTO
      const insertMatch = query.match(/^INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES\s*(.*)$/is);
      if (insertMatch) {
        const tableName = insertMatch[1];

        // Ignorer les tables supprimées ou de relation fusionnées ou obsolètes
        if (ignoredTables.includes(tableName)) {
          continue;
        }

        // Si c'est une table applicative mappée
        if (appTables.includes(tableName)) {
          const columns = insertMatch[2].split(',').map(c => c.replace(/`/g, '').trim());
          const valuesStr = insertMatch[3].trim();
          const cleanValuesStr = valuesStr.endsWith(';') ? valuesStr.slice(0, -1) : valuesStr;
          
          const rows = parseValuesString(cleanValuesStr);
          console.log(`📥 Importation de ${rows.length} lignes dans la table applicative: \`${tableName}\`...`);
          
          for (const row of rows) {
            const rawObj = rowToObj(columns, row);
            const mappedObj = mapRow(tableName, rawObj);
            if (mappedObj) {
              try {
                await insertMappedRow(connection, tableName, mappedObj);
                insertCount++;
              } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                  // Doublon ignoré silencieusement (UPSERT implicite)
                  continue;
                }
                console.error(`❌ Erreur lors de l'insertion dans \`${tableName}\` (ID: ${rawObj.id}) :`);
                console.error(err.message);
                throw err;
              }
            }
          }
          continue;
        }

        // Si c'est une table de rôles (déjà seedée)
        if (tableName === 'roles') {
          continue;
        }

        // Pour les tables de logs de prod ou annexes, on exécute verbatim
        try {
          await connection.query(query);
          otherCount++;
        } catch (err) {
          console.error(`❌ Erreur sur requête verbatim pour \`${tableName}\` :`, err.message);
          throw err;
        }
        continue;
      }

      // 3. Gérer les requêtes génériques (ALTER TABLE, etc.)
      const isAlterOrIndex = /^(ALTER\s+TABLE|CREATE\s+(UNIQUE\s+)?INDEX)/i.test(query);
      if (isAlterOrIndex) {
        // Ne pas exécuter les contraintes de clés étrangères ou d'index sur les tables applicatives (TypeORM gère déjà ça)
        const matchAlterTable = query.match(/^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?/i);
        if (matchAlterTable) {
          const targetTable = matchAlterTable[1];
          if (ignoredTables.includes(targetTable)) {
            continue; // Skip alter sur tables supprimées
          }
          if (appTables.includes(targetTable) || targetTable === 'roles') {
            continue; // Skip alter sur tables applicatives
          }
        }
      }

      // Exécuter les autres requêtes d'init verbatim (ex: configurations de session, alter sur logs, etc.)
      // Ignorer les blocs DELIMITER (triggers du dump) — ils sont recréés proprement à la fin du script
      if (/^DELIMITER/i.test(query) || /^END\s*\$\$/i.test(query)) {
        continue;
      }
      if (!/^(START\s+TRANSACTION|COMMIT|ROLLBACK)/i.test(query)) {
        try {
          await connection.query(query);
          otherCount++;
        } catch (err) {
          // On ignore les erreurs non critiques de configuration globale
          if (!query.includes('CHARACTER_SET') && !query.includes('COLLATION')) {
            console.warn(`⚠️ Requête ignorée ou échouée : ${query.substring(0, 100)}... (${err.message})`);
          }
        }
      }
    }

    // Réactiver les contraintes
    console.log(`💾 Ré-activation des contraintes de clés étrangères (FOREIGN_KEY_CHECKS = 1)...`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.query('SET UNIQUE_CHECKS = 1;');

    // Recréer les triggers compatibles
    console.log(`⚙️ Recréation des triggers d'audit (contracts et customers)...`);
    try {
      await connection.query('DROP TRIGGER IF EXISTS `before_contract_delete`;');
      await connection.query(`
        CREATE TRIGGER \`before_contract_delete\` BEFORE DELETE ON \`contracts\` FOR EACH ROW BEGIN
            INSERT INTO contract_audit_log (
                action_type, contract_id, action_time, idCustomer, idUser, idProduct, idAgency,
                idPeriodicite, reference, police, capital, capitalPE, dateEff, dateEch1, dateEch,
                duration, differe, idCreditType, garantieCompl, pd, pc, surp, acc, fm, taux, puttc,
                updated_at, dateMisePlace, datePaiement, version, etablissement, dateSaisie, insert_at, other
            )
            VALUES (
                'DELETE', OLD.id, NOW(), OLD.idCustomer, OLD.idUser, OLD.idProduct, OLD.idAgency,
                OLD.idPeriodicite, OLD.reference, OLD.police, OLD.capital, NULL, OLD.dateEff,
                OLD.dateEch1, OLD.dateEch, OLD.duration, OLD.differe, NULL, OLD.garantieCompl, 
                OLD.pd, OLD.pc, OLD.surp, OLD.acc, OLD.fm, OLD.taux, OLD.puttc, 
                OLD.updated_at, NULL, NULL, 0, OLD.etablissement, 
                OLD.created_at, NULL, NULL
            );
        END
      `);

      await connection.query('DROP TRIGGER IF EXISTS `before_contract_update`;');
      await connection.query(`
        CREATE TRIGGER \`before_contract_update\` BEFORE UPDATE ON \`contracts\` FOR EACH ROW BEGIN
            INSERT INTO contract_audit_log (
                action_type, contract_id, action_time, idCustomer, idUser, idProduct, idAgency,
                idPeriodicite, reference, police, capital, capitalPE, dateEff, dateEch1, dateEch,
                duration, differe, idCreditType, garantieCompl, pd, pc, surp, acc, fm, taux, puttc,
                updated_at, dateMisePlace, datePaiement, version, etablissement, dateSaisie, insert_at, other
            )
            VALUES (
                'UPDATE', OLD.id, NOW(), OLD.idCustomer, OLD.idUser, OLD.idProduct, OLD.idAgency,
                OLD.idPeriodicite, OLD.reference, OLD.police, OLD.capital, NULL, OLD.dateEff,
                OLD.dateEch1, OLD.dateEch, OLD.duration, OLD.differe, NULL, OLD.garantieCompl, 
                OLD.pd, OLD.pc, OLD.surp, OLD.acc, OLD.fm, OLD.taux, OLD.puttc, 
                OLD.updated_at, NULL, NULL, 0, OLD.etablissement, 
                OLD.created_at, NULL, NULL
            );
        END
      `);

      await connection.query('DROP TRIGGER IF EXISTS `before_customer_delete`;');
      await connection.query(`
        CREATE TRIGGER \`before_customer_delete\` BEFORE DELETE ON \`customers\` FOR EACH ROW BEGIN
            INSERT INTO customer_audit_log (
                action_type, customer_id, action_time, lastname, firstname, email, address, phone,
                place_of_birth, birthdate, occupation, gender, created_at, updated_at,
                version
            )
            VALUES (
                'DELETE', OLD.id, NOW(), OLD.lastname, OLD.firstname, OLD.email, OLD.address, OLD.phone,
                OLD.place_of_birth, OLD.birthdate, OLD.occupation, OLD.gender, OLD.created_at,
                OLD.updated_at, OLD.version
            );
        END
      `);

      await connection.query('DROP TRIGGER IF EXISTS `before_customer_update`;');
      await connection.query(`
        CREATE TRIGGER \`before_customer_update\` BEFORE UPDATE ON \`customers\` FOR EACH ROW BEGIN
            INSERT INTO customer_audit_log (
                action_type, customer_id, action_time, lastname, firstname, email, address, phone,
                place_of_birth, birthdate, occupation, gender, created_at, updated_at,
                version
            )
            VALUES (
                'UPDATE', OLD.id, NOW(), OLD.lastname, OLD.firstname, OLD.email, OLD.address, OLD.phone,
                OLD.place_of_birth, OLD.birthdate, OLD.occupation, OLD.gender, OLD.created_at,
                OLD.updated_at, OLD.version
            );
        END
      `);
      console.log('   -> Triggers recréés avec succès.');
    } catch (triggerErr) {
      console.error('   ⚠️ Erreur lors de la création des triggers:', triggerErr.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Importation réussie !`);
    console.log(`   -> ${insertCount} lignes insérées dans les tables applicatives.`);
    console.log(`   -> ${otherCount} requêtes exécutées verbatim (logs de prod, tables annexes, etc.).`);
    console.log(`   -> Temps total : ${duration} secondes.`);
    
    process.exit(0);

  } catch (err) {
    console.error(`\n❌ Erreur critique lors de l'importation :`, err.message);
    if (connection) {
      try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
        await connection.query('SET UNIQUE_CHECKS = 1;');
      } catch (e) {}
      await connection.end();
    }
    process.exit(1);
  }
}

run();
