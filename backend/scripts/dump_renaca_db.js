const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function dump() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'renaca_db',
  });

  console.log('Connected to local renaca_db');
  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log(`Found ${tableNames.length} tables.`);

  const outputPath = path.join(__dirname, '../Sql/renaca_init_290926.sql');
  const stream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

  stream.write(`-- Dump complet de la base renaca_db pour renaca_290926\n`);
  stream.write(`-- Généré le ${new Date().toISOString()}\n\n`);
  stream.write(`SET NAMES utf8mb4;\n`);
  stream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

  for (const table of tableNames) {
    console.log(`Exporting table ${table}...`);
    stream.write(`-- ----------------------------\n`);
    stream.write(`-- Table structure for ${table}\n`);
    stream.write(`-- ----------------------------\n`);
    stream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);

    const [[createRes]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    stream.write(`${createRes['Create Table']};\n\n`);

    // Fetch data
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      stream.write(`-- Records of ${table} (${rows.length} rows)\n`);
      const chunkSize = 200;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const insertHead = `INSERT INTO \`${table}\` VALUES `;
        const valuesList = chunk.map(row => {
          const vals = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) {
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (Buffer.isBuffer(val)) {
              return `0x${val.toString('hex')}`;
            }
            return conn.escape(val);
          });
          return `(${vals.join(', ')})`;
        });
        stream.write(`${insertHead}\n  ${valuesList.join(',\n  ')};\n`);
      }
      stream.write(`\n`);
    }
  }

  stream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  stream.end();

  await conn.end();
  console.log(`Dump successfully written to ${outputPath}`);
}

dump().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
