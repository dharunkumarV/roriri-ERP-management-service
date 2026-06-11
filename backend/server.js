// ═══════════════════════════════════════════════
// NexaCRM — Node.js + MySQL Backend Server
// Run: node server.js
// API: http://localhost:8080
// ═══════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const jwt     = require('jsonwebtoken');

const app        = express();
const PORT       = process.env.PORT       || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'nexacrm_secret_key_2025';

function envValue(key, fallback) {
  return Object.prototype.hasOwnProperty.call(process.env, key) ? process.env[key] : fallback;
}

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ── Create uploads folder if missing ──
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ═══════════════════════════════════════════════
// DATABASE SETUP (MySQL Connection Pool)
// ═══════════════════════════════════════════════
const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  user:            process.env.DB_USER     || 'nexacrm_user',
  password:        process.env.DB_PASSWORD || 'admin123',
  database:        process.env.DB_NAME     || 'nexacrm_db',
  port:            process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// ── Create all tables ──
const erpPool = mysql.createPool({
  host:            process.env.ERP_DB_HOST     || process.env.DB_HOST     || 'localhost',
  user:            process.env.ERP_DB_USER     || process.env.DB_USER     || 'nexacrm_user',
  password:        process.env.ERP_DB_PASSWORD || process.env.DB_PASSWORD || 'admin123',
  database:        process.env.ERP_DB_NAME     || 'db_Roriri_ERP',
  port:            process.env.ERP_DB_PORT     || process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

const collegePool = mysql.createPool({
  host:            envValue('COLLEGE_DB_HOST', process.env.DB_HOST || 'localhost'),
  user:            envValue('COLLEGE_DB_USER', process.env.DB_USER || 'nexacrm_user'),
  password:        envValue('COLLEGE_DB_PASSWORD', process.env.DB_PASSWORD || 'admin123'),
  database:        envValue('COLLEGE_DB_NAME', 'college_db'),
  port:            envValue('COLLEGE_DB_PORT', process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

const invoicePool = mysql.createPool({
  host:            envValue('INVOICE_DB_HOST', process.env.DB_HOST || 'localhost'),
  user:            envValue('INVOICE_DB_USER', process.env.DB_USER || 'nexacrm_user'),
  password:        envValue('INVOICE_DB_PASSWORD', process.env.DB_PASSWORD || 'admin123'),
  database:        envValue('INVOICE_DB_NAME', 'invoice_db'),
  port:            envValue('INVOICE_DB_PORT', process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

const mainDbName = process.env.DB_NAME || 'nexacrm_db';
const erpDbName = process.env.ERP_DB_NAME || 'db_Roriri_ERP';
const collegeDbName = envValue('COLLEGE_DB_NAME', 'college_db');
const invoiceDbName = envValue('INVOICE_DB_NAME', 'invoice_db');
const mergedCollegeTables = [mainDbName, erpDbName, invoiceDbName].includes(collegeDbName);

function collegeTable(name) {
  return `\`${mergedCollegeTables ? 'college_' : ''}${name}\``;
}

let erpWarningShown = false;
let collegeWarningShown = false;
let invoiceWarningShown = false;

function isErpAvailabilityError(err) {
  return ['ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE', 'ER_ACCESS_DENIED_ERROR', 'ECONNREFUSED'].includes(err?.code);
}

async function erpExecute(sql, params = []) {
  try {
    return await erpPool.execute(sql, params);
  } catch (err) {
    if (isErpAvailabilityError(err)) {
      if (!erpWarningShown) {
        console.warn(`ERP database unavailable; falling back to local CRM tables where possible. ${err.message}`);
        erpWarningShown = true;
      }
      return null;
    }
    throw err;
  }
}

async function getErpClients({ search = '', status = '', payment = '', clientId = null } = {}) {
  const params = [clientId, clientId];
  let having = '';
  if (search) {
    const s = `%${search}%`;
    having += ` HAVING (name LIKE ? OR email LIKE ? OR company_name LIKE ? OR project_name LIKE ?)`;
    params.push(s, s, s, s);
  } else if (status) {
    having += ` HAVING project_status = ?`;
    params.push(status);
  } else if (payment) {
    having += ` HAVING payment_status = ?`;
    params.push(payment);
  }

  const result = await erpExecute(`
    SELECT
      c.client_id AS id,
      c.client_name AS name,
      c.client_email AS email,
      c.client_phone AS phone,
      c.client_company AS company_name,
      COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.project_name ORDER BY p.project_id SEPARATOR ', '), ''), '') AS project_name,
      CASE
        WHEN SUM(CASE WHEN p.project_status = 'In Progress' THEN 1 ELSE 0 END) > 0 THEN 'In Progress'
        WHEN SUM(CASE WHEN p.project_status = 'Completed' THEN 1 ELSE 0 END) > 0 THEN 'Completed'
        ELSE 'Pending'
      END AS project_status,
      COALESCE(SUM(p.total_pay), 0) AS quotation_amount,
      COALESCE(SUM(pa.paid_amount), 0) AS paid_amount,
      CASE
        WHEN COALESCE(SUM(p.total_pay), 0) > 0 AND COALESCE(SUM(pa.paid_amount), 0) >= COALESCE(SUM(p.total_pay), 0) THEN 'Paid'
        WHEN COALESCE(SUM(pa.paid_amount), 0) > 0 THEN 'Partial'
        ELSE 'Due'
      END AS payment_status,
      c.client_name AS client_username,
      CONCAT(c.client_name, '123') AS client_password,
      c.client_created_date AS created_at,
      c.client_updated_date AS updated_at,
      'erp' AS source
    FROM client_tbl c
    LEFT JOIN project_tbl p ON p.client = c.client_id AND p.status = 'Active'
    LEFT JOIN (
      SELECT project_id, SUM(amnt_received) AS paid_amount
      FROM project_amount
      GROUP BY project_id
    ) pa ON pa.project_id = p.project_id
    WHERE c.client_status = 'Active'
      AND (? IS NULL OR c.client_id = ?)
    GROUP BY c.client_id
    ${having}
    ORDER BY c.client_created_date DESC, c.client_id DESC
  `, params);
  return result ? result[0] : null;
}

async function getLocalClients({ search = '', status = '', payment = '', clientId = null } = {}) {
  const where = [];
  const params = [];

  if (clientId !== null && clientId !== undefined) {
    where.push('id = ?');
    params.push(clientId);
  }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ? OR company_name LIKE ? OR project_name LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (status) {
    where.push('project_status = ?');
    params.push(status);
  }
  if (payment) {
    where.push('payment_status = ?');
    params.push(payment);
  }

  const sql = `
    SELECT *, 'local' AS source
    FROM clients
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY created_at DESC, id DESC
  `;
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function mergeClients(erpClients = [], localClients = []) {
  const seen = new Set();
  const merged = [];
  for (const client of erpClients || []) {
    seen.add(Number(client.id));
    merged.push(client);
  }
  for (const client of localClients || []) {
    if (seen.has(Number(client.id))) continue;
    merged.push({ ...client, source: client.source || 'local' });
  }
  return merged.sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at || 0).getTime() || 0;
    const bTime = new Date(b.created_at || b.updated_at || 0).getTime() || 0;
    return bTime - aTime;
  });
}

async function ensureLocalClientForMessage(clientId) {
  const id = Number(clientId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const [[existing]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
  if (existing) return existing;

  const erpClients = await getErpClients({ clientId: id });
  const erpClient = erpClients?.[0];
  if (!erpClient) return null;

  const email = erpClient.email || `erp-client-${id}@local.invalid`;
  const username = `erp_client_${id}`;

  try {
    await pool.execute(
      `INSERT INTO clients
       (id,name,email,phone,company_name,project_name,project_status,quotation_amount,paid_amount,payment_status,client_username,client_password)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        erpClient.name || `Client ${id}`,
        email,
        erpClient.phone || '',
        erpClient.company_name || '',
        erpClient.project_name || '',
        erpClient.project_status || 'Pending',
        erpClient.quotation_amount || 0,
        erpClient.paid_amount || 0,
        erpClient.payment_status || 'Due',
        username,
        erpClient.client_password || `${erpClient.name || username}123`,
      ]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const [[createdByRace]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
      if (createdByRace) return createdByRace;

      await pool.execute(
        `INSERT INTO clients
         (id,name,email,phone,company_name,project_name,project_status,quotation_amount,paid_amount,payment_status,client_username,client_password)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          erpClient.name || `Client ${id}`,
          `erp-client-${id}@local.invalid`,
          erpClient.phone || '',
          erpClient.company_name || '',
          erpClient.project_name || '',
          erpClient.project_status || 'Pending',
          erpClient.quotation_amount || 0,
          erpClient.paid_amount || 0,
          erpClient.payment_status || 'Due',
          username,
          erpClient.client_password || `${erpClient.name || username}123`,
        ]
      );
    } else {
      throw err;
    }
  }

  const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [id]);
  return client || null;
}

async function collegeExecute(sql, params = []) {
  try {
    return await collegePool.execute(sql, params);
  } catch (err) {
    if (isErpAvailabilityError(err)) {
      if (!collegeWarningShown) {
        console.warn(`College database unavailable. ${err.message}`);
        collegeWarningShown = true;
      }
      return null;
    }
    throw err;
  }
}

async function invoiceExecute(sql, params = []) {
  try {
    return await invoicePool.execute(sql, params);
  } catch (err) {
    if (isErpAvailabilityError(err)) {
      if (!invoiceWarningShown) {
        console.warn(`Invoice database unavailable. ${err.message}`);
        invoiceWarningShown = true;
      }
      return null;
    }
    throw err;
  }
}

function firstSaturdayExpr(columnName) {
  return `DATE_ADD(DATE_FORMAT(${columnName}, '%Y-%m-01'), INTERVAL ((14 - DAYOFWEEK(DATE_FORMAT(${columnName}, '%Y-%m-01'))) % 7) DAY)`;
}

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        name              VARCHAR(255) NOT NULL,
        email             VARCHAR(255) NOT NULL UNIQUE,
        phone             VARCHAR(50),
        company_name      VARCHAR(255),
        project_name      VARCHAR(255),
        project_status    VARCHAR(50)  DEFAULT 'Pending',
        quotation_amount  DECIMAL(10,2) DEFAULT 0,
        paid_amount       DECIMAL(10,2) DEFAULT 0,
        payment_status    VARCHAR(50)  DEFAULT 'Due',
        client_username   VARCHAR(255) UNIQUE,
        client_password   VARCHAR(255),
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        client_id   INT NOT NULL,
        title       VARCHAR(255) NOT NULL,
        file_name   VARCHAR(255) NOT NULL,
        file_path   VARCHAR(255) NOT NULL,
        file_type   VARCHAR(100),
        file_size   INT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        client_id  INT NOT NULL,
        text       TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        action      VARCHAR(255) NOT NULL,
        detail      TEXT,
        action_type VARCHAR(100),
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255),
        phone      VARCHAR(50),
        service    VARCHAR(255),
        message    TEXT,
        status     VARCHAR(50) DEFAULT 'New',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        client_id  INT NOT NULL,
        sender     VARCHAR(50) NOT NULL,
        content    TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        client_id   INT NOT NULL,
        project_id  VARCHAR(80),
        title       VARCHAR(255) NOT NULL,
        date        VARCHAR(50),
        status      VARCHAR(50) DEFAULT 'Pending',
        description TEXT,
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    try {
      await conn.query(`ALTER TABLE milestones ADD COLUMN project_id VARCHAR(80) NULL AFTER client_id`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        client_id  INT NOT NULL,
        rating     INT NOT NULL,
        feedback   TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        client_id      INT NOT NULL,
        project_name   VARCHAR(255) NOT NULL,
        project_status VARCHAR(50)   DEFAULT 'Pending',
        budget         DECIMAL(10,2) DEFAULT 0,
        paid_amount    DECIMAL(10,2) DEFAULT 0,
        payment_status VARCHAR(50)   DEFAULT 'Due',
        start_date     VARCHAR(50),
        deadline       VARCHAR(50),
        description    TEXT,
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS interns (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        email           VARCHAR(255),
        phone           VARCHAR(50),
        role            VARCHAR(100),
        current_project VARCHAR(255),
        duration        VARCHAR(100),
        start_date      VARCHAR(50),
        status          VARCHAR(50) DEFAULT 'Active',
        college_name    VARCHAR(255),
        skills          TEXT,
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        name            VARCHAR(255) NOT NULL,
        role            VARCHAR(100),
        email           VARCHAR(255),
        phone           VARCHAR(50),
        department      VARCHAR(100),
        current_project VARCHAR(255),
        status          VARCHAR(50) DEFAULT 'Active',
        created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS business_groups (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        group_name  VARCHAR(150) NOT NULL,
        icon        VARCHAR(50),
        description TEXT,
        status      VARCHAR(50) DEFAULT 'Active',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS entities (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        group_id    INT NOT NULL,
        entity_name VARCHAR(150) NOT NULL,
        entity_type VARCHAR(100),
        description TEXT,
        status      VARCHAR(50) DEFAULT 'Active',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES business_groups(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ── Insert sample data only if empty ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roshan_products (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        unit         VARCHAR(30) NOT NULL
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS roshan_suppliers (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        supplier_name VARCHAR(150) NOT NULL,
        phone         VARCHAR(30),
        address       TEXT,
        UNIQUE KEY uq_roshan_supplier_name (supplier_name)
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS roshan_clients (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(150) NOT NULL,
        phone       VARCHAR(30),
        address     TEXT,
        UNIQUE KEY uq_roshan_client_name (client_name)
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS roshan_transactions (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        transaction_type  ENUM('PURCHASE', 'SALE') NOT NULL,
        product_id        INT NOT NULL,
        supplier_id       INT NULL,
        client_id         INT NULL,
        quantity          DECIMAL(12,2) NOT NULL,
        rate              DECIMAL(12,2) NOT NULL,
        total_amount      DECIMAL(12,2) NOT NULL,
        paid_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
        pending_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_status    ENUM('PAID', 'PARTIAL', 'PENDING') NOT NULL,
        payment_mode      ENUM('Cash', 'UPI', 'Bank') NOT NULL,
        transaction_date  DATE NOT NULL,
        note              TEXT,
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES roshan_products(id),
        FOREIGN KEY (supplier_id) REFERENCES roshan_suppliers(id),
        FOREIGN KEY (client_id) REFERENCES roshan_clients(id)
      ) ENGINE=InnoDB;
    `);

    const [[{ c: adminCount }]] = await conn.query('SELECT COUNT(*) as c FROM admins');
    if (adminCount === 0) {
      await conn.query(
        'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
        ['Super Admin', 'admin@gmail.com', 'admin']
      );

      const clients = [
        ['Mrs Agnes Daniel',     'school@kingsschools.in', '+91 8220020084', 'Kings School',           '', 'Completed', 0, 0, 'Paid', 'Mrs Agnes Daniel',     'Mrs Agnes Daniel123'],
        ['Mr Kannan Nambirajan', 'kannan@srikannan.com',   '+91 9585500181', 'SRI KANNAN ENTERPRISES', '', 'Completed', 0, 0, 'Paid', 'Mr Kannan Nambirajan', 'Mr Kannan Nambirajan123'],
        ['Mr client',            'client@example.com',    '+91 9999999999', '',                        '', 'Pending',   0, 0, 'Due',  'Mr client',            'Mr client123'],
        ['RKS Chamber',          'rks@chamber.com',       '',               'RKS Chamber',            '', 'Pending',   0, 0, 'Due',  'RKS Chamber',          'RKS Chamber123'],
        ['New',                  'new@roriri.com',        '',               'New',                    '', 'Pending',   0, 0, 'Due',  'New',                  'New123'],
      ];
      for (const c of clients) {
        await conn.query(
          `INSERT INTO clients (name,email,phone,company_name,project_name,project_status,quotation_amount,paid_amount,payment_status,client_username,client_password)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          c
        );
      }

      const activities = [
        ['Client Added',      'Arjun Sharma from TechCorp India',              'client'],
        ['Payment Updated',   '₹75,000 received from TechCorp India',          'payment'],
        ['Client Added',      'Ravi Kumar from Enterprise Solutions',           'client'],
        ['Project Completed', 'ERP Integration marked as completed',            'project'],
        ['Payment Received',  '₹3,00,000 fully paid by Enterprise Solutions',  'payment'],
      ];
      for (const a of activities) {
        await conn.query(
          'INSERT INTO activity_logs (action, detail, action_type) VALUES (?,?,?)', a
        );
      }

      const notes = [
        [1, 'Client prefers weekly status updates via email. Follow up on payment by end of month.'],
        [2, 'Initial discovery call done. Awaiting signed agreement. Budget is flexible.'],
        [3, 'Project delivered successfully. Client is very satisfied. Ask for referral.'],
      ];
      for (const n of notes) {
        await conn.query('INSERT INTO notes (client_id, text) VALUES (?,?)', n);
      }

      await seedInterns(conn);

      console.log('✅ Sample data inserted!');
    }

    const [[{ c: internCount }]] = await conn.query('SELECT COUNT(*) as c FROM interns');
    if (internCount <= 1) await seedInterns(conn);

    const [[{ c: employeeCount }]] = await conn.query('SELECT COUNT(*) as c FROM employees');
    if (employeeCount <= 1) await seedEmployees(conn);

    const [[{ c: businessGroupCount }]] = await conn.query('SELECT COUNT(*) as c FROM business_groups');
    if (businessGroupCount === 0) {
      const groups = [
        [1, 'Technology & Employment', 'fa-laptop-code', 'Software, training, placement, and consulting businesses', 'Active'],
        [2, 'Manufacturing & Trading', 'fa-industry', 'Trading, materials, chambers, and stock-based operations', 'Active'],
        [3, 'Agriculture & Wellness', 'fa-seedling', 'Farm, food, and wellness-focused businesses', 'Active'],
        [4, 'Social & Charitable', 'fa-hand-holding-heart', 'Foundation, outreach, and charitable initiatives', 'Active'],
      ];
      for (const group of groups) {
        await conn.query(
          'INSERT INTO business_groups (id, group_name, icon, description, status) VALUES (?,?,?,?,?)',
          group
        );
      }
    }

    const [[{ c: entityCount }]] = await conn.query('SELECT COUNT(*) as c FROM entities');
    if (entityCount === 0) {
      const entities = [
        [1, 1, 'Roriri Software Solutions', 'Technology', 'Software services, client projects, enquiries, websites, interns, and employees', 'Active'],
        [2, 1, 'Nexgen IT Academy', 'Training', 'Training and academy entity. Modules not added yet.', 'Active'],
        [3, 1, 'Riya Consultancy', 'Consultancy', 'Consultancy entity. Modules not added yet.', 'Active'],
        [4, 2, 'Roshan Traders', 'Trading', 'Purchase, sales, stock, invoice, and ledger operations', 'Active'],
        [5, 2, 'RN Chamber', 'Manufacturing', 'Expenses, bricks income, salary, and invoice operations', 'Active'],
        [6, 3, 'Rithish Farms', 'Agriculture', 'Agriculture and wellness entity. Modules not added yet.', 'Active'],
        [7, 4, 'Roriri Foundation', 'Foundation', 'Social and charitable entity. Modules not added yet.', 'Active'],
      ];
      for (const entity of entities) {
        await conn.query(
          'INSERT INTO entities (id, group_id, entity_name, entity_type, description, status) VALUES (?,?,?,?,?,?)',
          entity
        );
      }
    }

    await conn.query(
      `INSERT IGNORE INTO business_groups (id, group_name, icon, description, status)
       VALUES (4, 'Social & Charitable', 'fa-hand-holding-heart', 'Foundation, outreach, and charitable initiatives', 'Active')`
    );
    await conn.query(
      `INSERT IGNORE INTO entities (id, group_id, entity_name, entity_type, description, status)
       VALUES (7, 4, 'Roriri Foundation', 'Foundation', 'Social and charitable entity. Modules not added yet.', 'Active')`
    );

    const [[{ c: roshanProductCount }]] = await conn.query('SELECT COUNT(*) as c FROM roshan_products');
    if (roshanProductCount === 0) {
      await conn.query(
        'INSERT INTO roshan_products (product_name, unit) VALUES (?,?), (?,?), (?,?)',
        ['Bricks', 'pcs', 'Firewood', 'kg', 'Oil', 'ltr']
      );
    }

    console.log('✅ All tables ready!');
  } finally {
    conn.release();
  }
}

// ═══════════════════════════════════════════════
// HELPER — Log Activity (async)
// ═══════════════════════════════════════════════
const seedInternRows = [
  ['Hasmath Kathun H', 'harmathhachu@gmail.com', '9791992539', 'Full Stack Intern', 'NexaCRM', '1 Month', '', 'Active', '', ''],
  ['Maharasi K', 'kmaharasi6@gmail.com', '7502448976', 'Frontend Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
  ['Sutherson Issac', 'Issac@gmail.com', '9361000479', 'Full Stack Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
  ['Rahul Selva', 'rahulselva773@gmail.com', '9751876460', 'Full Stack Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
  ['Barani Kumar', 'Barani@gmail.com', '9342449257', 'Full Stack Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
  ['Hari Hara Sudhan', 'hari@gmail.com', '9344667861', 'Full Stack Intern', 'ERP', '3 Months', '', 'Active', '', ''],
  ['Antony Amal Rekshin', 'rekshin@gmail.com', '6383792232', 'Full Stack Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
  ['Madasamy', 'ymas10132017@gmail.com', '7708689565', 'Full Stack Intern', 'CRM Project', '3 Months', '', 'Active', '', ''],
  ['Mohan S', 'mohansm1002@gmail.com', '6380751915', 'Full Stack Intern', 'Hospital Website', '3 Months', '', 'Active', '', ''],
  ['DharunKumar V', 'dharunkumarv486@gmail.com', '8825896874', 'Full Stack Intern', 'NexaCRM', '3 Months', '', 'Active', '', ''],
];

async function seedInterns(conn) {
  for (const intern of seedInternRows) {
    const [name, email] = intern;
    const [[existing]] = await conn.query(
      'SELECT id FROM interns WHERE email = ? OR name = ? LIMIT 1',
      [email, name]
    );
    if (!existing) {
      await conn.query(
        `INSERT INTO interns (name,email,phone,role,current_project,duration,start_date,status,college_name,skills)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        intern
      );
    }
  }
}

const seedEmployeeRows = [
  ['Nambirajan', 'Developer', 'Nambi@gmail.com', '9887764545', 'Development', 'Ledger', 'Active'],
  ['Anushiya', 'Developer', 'Anushiya@gmail.com', '9876544433', 'Development', 'Ledger', 'Active'],
  ['Varsha', 'Developer', 'varsha@gmail.com', '8656546776', 'Development', 'Ledger', 'Active'],
  ['Sakthi Anand', 'Developer', 'sakthi@gmail.com', '8774549867', 'Development', 'ERP', 'Active'],
  ['Nathiya', 'Developer', 'nathiya@gmail.com', '6767677666', 'Development', 'Ledger', 'Active'],
  ['Kaniyalan', 'Developer', 'kaniyalan@gmail.com', '8777666655', 'Development', 'KingsSchool', 'Active'],
  ['Sujin', 'Developer', 'Sujin@gmail.com', '9188258968', 'Development', 'Summercamp', 'Active'],
];

async function seedEmployees(conn) {
  for (const employee of seedEmployeeRows) {
    const [name, , email] = employee;
    const [[existing]] = await conn.query(
      'SELECT id FROM employees WHERE email = ? OR name = ? LIMIT 1',
      [email, name]
    );
    if (!existing) {
      await conn.query(
        `INSERT INTO employees (name,role,email,phone,department,current_project,status)
         VALUES (?,?,?,?,?,?,?)`,
        employee
      );
    }
  }
}

async function logActivity(action, detail, type) {
  await pool.execute(
    'INSERT INTO activity_logs (action, detail, action_type) VALUES (?, ?, ?)',
    [action, detail, type]
  );
}

// ═══════════════════════════════════════════════
// HELPER — Auth Middleware (JWT check)
// ═══════════════════════════════════════════════
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
}

// ═══════════════════════════════════════════════
// FILE UPLOAD CONFIG (Multer)
// ═══════════════════════════════════════════════
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '_' + file.originalname.replace(/\s/g, '_');
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOC files allowed'));
  }
});

// ═══════════════════════════════════════════════
// ROUTES — AUTH
// ═══════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const [[admin]] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (admin && admin.password === password) {
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin', name: admin.name },
        JWT_SECRET, { expiresIn: '24h' }
      );
      return res.json({ token, role: 'admin', name: admin.name, email: admin.email });
    }

    const [[client]] = await pool.execute(
      'SELECT * FROM clients WHERE client_username = ? OR email = ?',
      [email, email]
    );
    if (client && client.client_password === password) {
      const token = jwt.sign(
        { id: client.id, email: client.email, role: 'client', name: client.name },
        JWT_SECRET, { expiresIn: '24h' }
      );
      return res.json({ token, role: 'client', name: client.name, email: client.email, clientId: client.id });
    }

    return res.status(401).json({ message: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// GET /api/client/dashboard
app.get('/api/client/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Client access only' });
    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.user.id]);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const [notes] = await pool.execute('SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC', [req.user.id]);
    const [docs]  = await pool.execute('SELECT * FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC', [req.user.id]);
    const { client_password, ...safeClient } = client;
    res.json({ client: safeClient, notes, documents: docs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ═══════════════════════════════════════════════
// ROUTES — COLLEGE PORTAL PREVIEW
// ═══════════════════════════════════════════════

function collegeUnavailableResponse(res) {
  return res.json({
    available: false,
    message: 'College database is not available. Check COLLEGE_DB_* settings or import college_db.'
  });
}

// GET /api/college/summary
app.get('/api/college/summary', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await collegeExecute(`
      SELECT
        (SELECT COUNT(*) FROM ${collegeTable('colleges')}) as colleges,
        (SELECT COUNT(*) FROM ${collegeTable('iv_data')}) as ivRecords,
        (SELECT COUNT(*) FROM ${collegeTable('gallery_images')}) as galleryImages,
        (SELECT COUNT(*) FROM ${collegeTable('enquiries')}) as enquiries,
        (SELECT COUNT(*) FROM ${collegeTable('internship_data')}) as internships,
        (SELECT COUNT(*) FROM ${collegeTable('placement_data')}) as placements,
        (SELECT COUNT(*) FROM ${collegeTable('workshop_data')}) as workshops
    `);
    if (!result) return collegeUnavailableResponse(res);
    res.json({ available: true, stats: result[0][0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/college/colleges
app.get('/api/college/colleges', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await collegeExecute(`
      SELECT id, name, location, students_count, logo, street, city, state, pin,
             phone, email, principal_name, mou_status
      FROM ${collegeTable('colleges')}
      ORDER BY name ASC
    `);
    if (!result) return collegeUnavailableResponse(res);
    res.json({ available: true, colleges: result[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/college/iv-data
app.get('/api/college/iv-data', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await collegeExecute(`
      SELECT iv.id, iv.college_id, c.name as college_name, iv.student_name, iv.department,
             iv.date, iv.time, iv.student_count, iv.phone_number, iv.mail_id
      FROM ${collegeTable('iv_data')} iv
      LEFT JOIN ${collegeTable('colleges')} c ON c.id = iv.college_id
      ORDER BY iv.date DESC, iv.time DESC, iv.id DESC
      LIMIT 200
    `);
    if (!result) return collegeUnavailableResponse(res);
    res.json({ available: true, records: result[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/college/gallery
app.get('/api/college/gallery', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await collegeExecute(`
      SELECT g.id, g.college_id, c.name as college_name, g.image_path, g.uploaded_at
      FROM ${collegeTable('gallery_images')} g
      LEFT JOIN ${collegeTable('colleges')} c ON c.id = g.college_id
      ORDER BY g.uploaded_at DESC, g.id DESC
      LIMIT 60
    `);
    if (!result) return collegeUnavailableResponse(res);
    res.json({ available: true, images: result[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/college/enquiries
app.get('/api/college/enquiries', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await collegeExecute(`
      SELECT e.id, e.user_id, u.username, u.college_id, c.name as college_name,
             e.category, e.message, e.status, e.created_at,
             r.message as reply_message, r.file_path as reply_file, r.created_at as replied_at
      FROM ${collegeTable('enquiries')} e
      LEFT JOIN ${collegeTable('users')} u ON u.id = e.user_id
      LEFT JOIN ${collegeTable('colleges')} c ON c.id = u.college_id
      LEFT JOIN ${collegeTable('enquiry_replies')} r ON r.enquiry_id = e.id
      ORDER BY e.created_at DESC
      LIMIT 100
    `);
    if (!result) return collegeUnavailableResponse(res);
    res.json({ available: true, enquiries: result[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — SAVED INVOICES
// ═══════════════════════════════════════════════

function invoiceUnavailableResponse(res) {
  return res.json({
    available: false,
    message: 'Invoice database is not available. Check INVOICE_DB_* settings or import invoice_db.'
  });
}

function invoiceNumberFromSetting(value) {
  const next = Number(value || 1);
  return `INV-${String(Number.isFinite(next) && next > 0 ? next : 1).padStart(4, '0')}`;
}

// GET /api/invoices/next-number
app.get('/api/invoices/next-number', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await invoiceExecute("SELECT setting_value FROM app_settings WHERE setting_key = 'invoice_next'");
    if (!result) return invoiceUnavailableResponse(res);
    const next = result[0][0]?.setting_value || '1';
    res.json({ available: true, invoice_number: invoiceNumberFromSetting(next), next: Number(next) || 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices
app.get('/api/invoices', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await invoiceExecute(`
      SELECT id, invoice_number, invoice_title, invoice_date, bill_to, company_name,
             subtotal, total, payment_made, balance_due, created_at
      FROM invoices
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `);
    if (!result) return invoiceUnavailableResponse(res);
    res.json({ available: true, invoices: result[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/invoices/:id
app.get('/api/invoices/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const invoiceResult = await invoiceExecute('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!invoiceResult) return invoiceUnavailableResponse(res);
    const invoice = invoiceResult[0][0];
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const itemResult = await invoiceExecute('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY line_no ASC', [req.params.id]);
    res.json({ available: true, invoice, items: itemResult ? itemResult[0] : [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/invoices
app.post('/api/invoices', authMiddleware, adminOnly, async (req, res) => {
  const conn = await invoicePool.getConnection();
  try {
    const { invoice, items = [] } = req.body;
    if (!invoice?.invoice_number || !invoice?.invoice_date) {
      return res.status(400).json({ message: 'invoice_number and invoice_date are required' });
    }

    await conn.beginTransaction();
    const [result] = await conn.execute(`
      INSERT INTO invoices (
        invoice_number, template, invoice_title, invoice_date, bill_to, bill_to_address,
        vehicle_number, company_name, company_logo, company_address, gst_number,
        company_phone, company_email, bank_account, bank_ifsc, bank_branch,
        bank_ledger_title, bank_footer_title, proprietor, subtotal, cgst_total,
        sgst_total, total, payment_made, balance_due, amount_words, notes, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    `, [
      invoice.invoice_number,
      invoice.template || 't01',
      invoice.invoice_title || 'Tax Invoice',
      invoice.invoice_date,
      invoice.bill_to || '',
      invoice.bill_to_address || '',
      invoice.vehicle_number || '',
      invoice.company_name || 'Roriri Software Solutions',
      invoice.company_logo || '',
      invoice.company_address || '',
      invoice.gst_number || '',
      invoice.company_phone || '+91 98765 43210',
      invoice.company_email || 'contact@roriri.com',
      invoice.bank_account || '',
      invoice.bank_ifsc || '',
      invoice.bank_branch || '',
      invoice.bank_ledger_title || '',
      invoice.bank_footer_title || '',
      invoice.proprietor || '',
      invoice.subtotal || 0,
      invoice.cgst_total || 0,
      invoice.sgst_total || 0,
      invoice.total || 0,
      invoice.payment_made || 0,
      invoice.balance_due || 0,
      invoice.amount_words || '',
      invoice.notes || ''
    ]);

    const invoiceId = result.insertId;
    for (const [idx, item] of items.entries()) {
      await conn.execute(`
        INSERT INTO invoice_items (
          invoice_id, line_no, description, hsn, quantity, per_unit, rate,
          base_amount, cgst, sgst, line_total
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `, [
        invoiceId,
        idx + 1,
        item.description || 'Project Services',
        item.hsn || '',
        item.quantity || 1,
        item.per_unit || '',
        item.rate || 0,
        item.base_amount || 0,
        item.cgst || 0,
        item.sgst || 0,
        item.line_total || 0
      ]);
    }

    const match = String(invoice.invoice_number).match(/(\d+)$/);
    if (match) {
      const next = Number(match[1]) + 1;
      await conn.execute(`
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES ('invoice_next', ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `, [String(next)]);
    }

    await conn.commit();
    const [[saved]] = await conn.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    res.status(201).json({ available: true, invoice: saved });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Invoice number already exists' });
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

// ═══════════════════════════════════════════════
// ROUTES — CLIENTS
// ═══════════════════════════════════════════════

// GET /api/clients
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.user.id]);
      return res.json(client ? [client] : []);
    }
    const { search, status, payment } = req.query;
    const [erpClients, localClients] = await Promise.all([
      getErpClients({ search, status, payment }),
      getLocalClients({ search, status, payment })
    ]);
    res.json(erpClients ? mergeClients(erpClients, localClients) : localClients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clients/dashboard-stats
app.get('/api/clients/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      const [erpClients, localClients] = await Promise.all([
        getErpClients(),
        getLocalClients()
      ]);
      if (erpClients) {
        const mergedClients = mergeClients(erpClients, localClients);
        const stats = mergedClients.reduce((acc, c) => {
          const quotation = Number(c.quotation_amount || 0);
          const paid = Number(c.paid_amount || 0);
          acc.totalClients += 1;
          acc.totalRevenue += paid;
          acc.pendingPayments += Math.max(quotation - paid, 0);
          if (c.project_status === 'In Progress') acc.activeProjects += 1;
          return acc;
        }, { totalClients: 0, totalRevenue: 0, pendingPayments: 0, activeProjects: 0 });
        return res.json(stats);
      }
    }

    const where  = req.user.role === 'client' ? 'WHERE id = ?' : '';
    const params = req.user.role === 'client' ? [req.user.id] : [];
    const [[stats]] = await pool.execute(`
      SELECT
        COUNT(*) as totalClients,
        COALESCE(SUM(paid_amount), 0) as totalRevenue,
        COALESCE(SUM(quotation_amount - paid_amount), 0) as pendingPayments,
        COUNT(CASE WHEN project_status = 'In Progress' THEN 1 END) as activeProjects
      FROM clients ${where}
    `, params);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/clients/:id
app.get('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client' && Number(req.params.id) !== req.user.id)
      return res.status(403).json({ message: 'Client access denied' });
    if (req.user.role !== 'client') {
      const erpClients = await getErpClients({ clientId: req.params.id });
      if (erpClients?.[0]) return res.json(erpClients[0]);
    }

    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/clients
app.post('/api/clients', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, company_name, project_name, project_status, quotation_amount, paid_amount, payment_status } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const autoUsername = name.trim();
    const autoPassword = `${name.trim()}123`;

    const [result] = await pool.execute(
      `INSERT INTO clients (name,email,phone,company_name,project_name,project_status,quotation_amount,paid_amount,payment_status,client_username,client_password)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [name, email, phone||'', company_name||'', project_name||'',
       project_status||'Pending', quotation_amount||0, paid_amount||0,
       payment_status||'Due', autoUsername, autoPassword]
    );
    const [[newClient]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [result.insertId]);
    await logActivity('Client Added', `${name} from ${company_name || 'Unknown'}`, 'client');
    res.status(201).json(newClient);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email or username already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/clients/:id
app.put('/api/clients/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, company_name, project_name, project_status, quotation_amount, paid_amount, payment_status } = req.body;
    const [[existing]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Client not found' });

    await pool.execute(
      `UPDATE clients SET
        name=?, email=?, phone=?, company_name=?, project_name=?,
        project_status=?, quotation_amount=?, paid_amount=?, payment_status=?,
        client_username=?, client_password=?
       WHERE id=?`,
      [name, email, phone, company_name, project_name,
       project_status, quotation_amount, paid_amount, payment_status,
       name ? name.trim() : existing.client_username,
       name ? `${name.trim()}123` : existing.client_password,
       req.params.id]
    );
    await logActivity('Client Updated', `${name} — profile updated`, 'client');
    const [[updated]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/clients/:id
app.delete('/api/clients/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    await pool.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    await logActivity('Client Deleted', `${client.name} removed from system`, 'client');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — DOCUMENTS
// ═══════════════════════════════════════════════

// GET /api/documents
app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    const where  = req.user.role === 'client' ? 'WHERE d.client_id = ?' : '';
    const params = req.user.role === 'client' ? [req.user.id] : [];
    const [docs] = await pool.execute(`
      SELECT d.*, c.name as client_name, c.company_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      ${where}
      ORDER BY d.uploaded_at DESC
    `, params);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/documents/client/:clientId
app.get('/api/documents/client/:clientId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client' && Number(req.params.clientId) !== req.user.id)
      return res.status(403).json({ message: 'Client access denied' });
    const [docs] = await pool.execute(
      'SELECT * FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC',
      [req.params.clientId]
    );
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/documents/upload
app.post('/api/documents/upload', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { clientId, title } = req.body;
    if (!clientId || !title) return res.status(400).json({ message: 'clientId and title required' });

    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const [result] = await pool.execute(
      'INSERT INTO documents (client_id,title,file_name,file_path,file_type,file_size) VALUES (?,?,?,?,?,?)',
      [clientId, title, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size]
    );
    await logActivity('File Uploaded', `"${title}" uploaded for ${client.name}`, 'file');
    const [[doc]] = await pool.execute('SELECT * FROM documents WHERE id = ?', [result.insertId]);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/documents/:id/download
app.get('/api/documents/:id/download', authMiddleware, async (req, res) => {
  try {
    const [[doc]] = await pool.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (req.user.role === 'client' && doc.client_id !== req.user.id)
      return res.status(403).json({ message: 'Client access denied' });
    const filePath = path.join(__dirname, 'uploads', doc.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server' });
    res.download(filePath, doc.file_name);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/documents/:id
app.delete('/api/documents/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[doc]] = await pool.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const filePath = path.join(__dirname, 'uploads', doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.execute('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — NOTES
// ═══════════════════════════════════════════════

// GET /api/notes
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const where  = req.user.role === 'client' ? 'WHERE n.client_id = ?' : '';
    const params = req.user.role === 'client' ? [req.user.id] : [];
    const [notes] = await pool.execute(`
      SELECT n.*, c.name as client_name, c.company_name
      FROM notes n
      LEFT JOIN clients c ON n.client_id = c.id
      ${where}
      ORDER BY n.created_at DESC
    `, params);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notes/client/:clientId
app.get('/api/notes/client/:clientId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client' && Number(req.params.clientId) !== req.user.id)
      return res.status(403).json({ message: 'Client access denied' });
    const [notes] = await pool.execute(
      'SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC',
      [req.params.clientId]
    );
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes
app.post('/api/notes', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { clientId, text } = req.body;
    if (!clientId || !text) return res.status(400).json({ message: 'clientId and text required' });
    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const [result] = await pool.execute(
      'INSERT INTO notes (client_id, text) VALUES (?, ?)',
      [clientId, text]
    );
    await logActivity('Note Added', `Note added for ${client.name}`, 'client');
    const [[note]] = await pool.execute('SELECT * FROM notes WHERE id = ?', [result.insertId]);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.execute('DELETE FROM notes WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — ACTIVITY LOG
// ═══════════════════════════════════════════════

// GET /api/activity
app.get('/api/activity', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const [[client]] = await pool.execute('SELECT name FROM clients WHERE id = ?', [req.user.id]);
      const [logs] = await pool.execute(
        'SELECT * FROM activity_logs WHERE detail LIKE ? ORDER BY created_at DESC',
        [`%${client?.name || ''}%`]
      );
      return res.json(logs);
    }
    const [logs] = await pool.execute('SELECT * FROM activity_logs ORDER BY created_at DESC');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/activity/recent
app.get('/api/activity/recent', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const [[client]] = await pool.execute('SELECT name FROM clients WHERE id = ?', [req.user.id]);
      const [logs] = await pool.execute(
        'SELECT * FROM activity_logs WHERE detail LIKE ? ORDER BY created_at DESC LIMIT 10',
        [`%${client?.name || ''}%`]
      );
      return res.json(logs);
    }
    const [logs] = await pool.execute('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — ENQUIRIES
// ═══════════════════════════════════════════════

// GET /api/enquiries
app.get('/api/enquiries', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT DISTINCT
        e.event_id AS id,
        e.event_id AS enquiry_id,
        e.name,
        e.email,
        e.phone,
        e.enq_category_id AS source_id,
        COALESCE(c.category_name, '') AS source_name,
        COALESCE(c.category_name, '') AS service,
        e.description AS message,
        CASE
          WHEN e.follow_status = 'Confirmed' THEN 'Converted'
          WHEN e.follow_status = 'Interested' THEN 'Contacted'
          WHEN e.follow_status = 'Non-Interested' THEN 'Closed'
          ELSE 'New'
        END AS status,
        e.enquiry_date AS created_at,
        e.created_at AS original_created_at,
        'erp' AS source
      FROM allenquiry_tbl e
      LEFT JOIN enq_category c ON c.enq_category_id = e.enq_category_id
      WHERE e.status = 'Active'
      ORDER BY e.enquiry_date DESC, e.event_id DESC
    `);
    if (erpResult) return res.json(erpResult[0]);

    const [rows] = await pool.execute('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/enquiries
app.post('/api/enquiries', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, service, message, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const [result] = await pool.execute(
      'INSERT INTO enquiries (name,email,phone,service,message,status) VALUES (?,?,?,?,?,?)',
      [name, email||'', phone||'', service||'', message||'', status||'New']
    );
    await logActivity('Enquiry Added', `${name} enquired about ${service||'services'}`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM enquiries WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/enquiries/:id
app.put('/api/enquiries/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, service, message, status } = req.body;
    await pool.execute(
      'UPDATE enquiries SET name=?,email=?,phone=?,service=?,message=?,status=? WHERE id=?',
      [name, email, phone, service, message, status, req.params.id]
    );
    const [[row]] = await pool.execute('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/enquiries/:id
app.delete('/api/enquiries/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.execute('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — MESSAGES
// ═══════════════════════════════════════════════

// GET /api/messages/:clientId
app.get('/api/messages/:clientId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client' && Number(req.params.clientId) !== req.user.id)
      return res.status(403).json({ message: 'Client access denied' });
    if (req.user.role !== 'client') {
      const client = await ensureLocalClientForMessage(req.params.clientId);
      if (!client) return res.status(404).json({ message: 'Client not found' });
    }
    const [rows] = await pool.execute(
      'SELECT * FROM messages WHERE client_id = ? ORDER BY created_at ASC',
      [req.params.clientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const [rows] = await pool.execute(`
        SELECT c.id, c.name, c.company_name,
               COUNT(m.id) as msg_count,
               MAX(m.created_at) as last_message
        FROM clients c
        LEFT JOIN messages m ON c.id = m.client_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [req.user.id]);
      return res.json(rows);
    }
    // MySQL fix: use IS NULL instead of NULLS LAST
    const [rows] = await pool.execute(`
      SELECT c.id, c.name, c.company_name,
             COUNT(m.id) as msg_count,
             MAX(m.created_at) as last_message
      FROM clients c
      LEFT JOIN messages m ON c.id = m.client_id
      GROUP BY c.id
      ORDER BY last_message IS NULL, last_message DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages
app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    let { client_id, content } = req.body;
    const sender = req.user.role === 'admin' ? 'admin' : 'client';
    if (req.user.role === 'client') client_id = req.user.id;
    content = String(content || '').trim();
    if (!client_id || !content) return res.status(400).json({ message: 'client_id and content required' });

    const client = await ensureLocalClientForMessage(client_id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const [result] = await pool.execute(
      'INSERT INTO messages (client_id, sender, content) VALUES (?, ?, ?)',
      [client.id, sender, content]
    );
    const [[msg]] = await pool.execute('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — MILESTONES
// ═══════════════════════════════════════════════

app.get('/api/milestones', authMiddleware, async (req, res) => {
  try {
    const { clientId, projectId } = req.query;
    const queryClientId = req.user.role === 'client' ? req.user.id : clientId;

    if (req.user.role === 'client') {
      if (projectId) {
        const [rows] = await pool.execute(
          'SELECT * FROM milestones WHERE client_id = ? AND project_id = ? ORDER BY date ASC',
          [req.user.id, projectId]
        );
        return res.json(rows);
      }
      const [rows] = await pool.execute(
        'SELECT * FROM milestones WHERE client_id = ? ORDER BY date ASC',
        [req.user.id]
      );
      return res.json(rows);
    }
    if (projectId) {
      const [rows] = await pool.execute(
        queryClientId
          ? 'SELECT * FROM milestones WHERE client_id = ? AND project_id = ? ORDER BY date ASC'
          : 'SELECT * FROM milestones WHERE project_id = ? ORDER BY date ASC',
        queryClientId ? [queryClientId, projectId] : [projectId]
      );
      return res.json(rows);
    }
    if (clientId) {
      const [rows] = await pool.execute(
        'SELECT * FROM milestones WHERE client_id = ? ORDER BY date ASC',
        [clientId]
      );
      return res.json(rows);
    }
    const [rows] = await pool.execute(
      'SELECT m.*, c.name as client_name FROM milestones m LEFT JOIN clients c ON m.client_id = c.id ORDER BY m.date ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/milestones', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { client_id, project_id, title, date, status, description } = req.body;
    if (!client_id || !title) return res.status(400).json({ message: 'client_id and title required' });
    const [result] = await pool.execute(
      'INSERT INTO milestones (client_id,project_id,title,date,status,description) VALUES (?,?,?,?,?,?)',
      [client_id, project_id||null, title, date||'', status||'Pending', description||'']
    );
    await logActivity('Milestone Added', `"${title}" added`, 'project');
    const [[row]] = await pool.execute('SELECT * FROM milestones WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/milestones/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { project_id, title, date, status, description } = req.body;
    await pool.execute(
      'UPDATE milestones SET project_id=?,title=?,date=?,status=?,description=? WHERE id=?',
      [project_id||null, title, date, status, description||'', req.params.id]
    );
    const [[row]] = await pool.execute('SELECT * FROM milestones WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/milestones/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.execute('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — RATINGS
// ═══════════════════════════════════════════════

app.get('/api/ratings', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'client') {
      const [rows] = await pool.execute(
        'SELECT r.*, c.name as client_name, c.company_name as company FROM ratings r LEFT JOIN clients c ON r.client_id = c.id WHERE r.client_id = ? ORDER BY r.created_at DESC',
        [req.user.id]
      );
      return res.json(rows);
    }
    const [rows] = await pool.execute(
      'SELECT r.*, c.name as client_name, c.company_name as company FROM ratings r LEFT JOIN clients c ON r.client_id = c.id ORDER BY r.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/ratings', authMiddleware, async (req, res) => {
  try {
    const client_id = req.user.role === 'client' ? req.user.id : req.body.client_id;
    const { rating, feedback } = req.body;
    if (!rating) return res.status(400).json({ message: 'Rating required' });
    const [result] = await pool.execute(
      'INSERT INTO ratings (client_id,rating,feedback) VALUES (?,?,?)',
      [client_id, rating, feedback||'']
    );
    const [[client]] = await pool.execute('SELECT name FROM clients WHERE id = ?', [client_id]);
    await logActivity('Rating Submitted', `${client?.name||'Client'} gave ${rating}★`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM ratings WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — PROJECTS
// ═══════════════════════════════════════════════

app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const requestedClientId = req.query.clientId;
    const clientId = req.user.role === 'client' ? req.user.id : requestedClientId;
    const erpResult = await erpExecute(`
      SELECT
        p.project_id AS id,
        p.client AS client_id,
        c.client_name AS client_name,
        c.client_company AS company_name,
        p.project_name,
        CASE WHEN p.project_status = 'New' THEN 'Pending' ELSE p.project_status END AS project_status,
        p.total_pay AS budget,
        COALESCE((SELECT SUM(pa.amnt_received) FROM project_amount pa WHERE pa.project_id = p.project_id), 0) AS paid_amount,
        CASE WHEN p.pay_status = 'Completed' THEN 'Paid' ELSE 'Due' END AS payment_status,
        DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(DATE_ADD(p.start_date, INTERVAL p.duration DAY), '%Y-%m-%d') AS deadline,
        p.description,
        p.created_at,
        p.updated_at,
        'erp' AS source
      FROM project_tbl p
      LEFT JOIN client_tbl c ON c.client_id = p.client
      WHERE p.status = 'Active'
        AND (? IS NULL OR p.client = ?)
      ORDER BY p.start_date DESC, p.created_at DESC
    `, [clientId || null, clientId || null]);
    if (erpResult) return res.json(erpResult[0]);

    if (req.user.role === 'client') {
      const [rows] = await pool.execute(
        'SELECT p.*, c.name as client_name, c.company_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.client_id = ? ORDER BY p.created_at DESC',
        [req.user.id]
      );
      return res.json(rows);
    }
    if (clientId) {
      const [rows] = await pool.execute(
        'SELECT p.*, c.name as client_name, c.company_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.client_id = ? ORDER BY p.created_at DESC',
        [clientId]
      );
      return res.json(rows);
    }
    const [rows] = await pool.execute(
      'SELECT p.*, c.name as client_name, c.company_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id ORDER BY p.deadline ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const [[proj]] = await pool.execute(
      'SELECT p.*, c.name as client_name, c.company_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    if (req.user.role === 'client' && proj.client_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(proj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { client_id, project_name, project_status, budget, paid_amount, payment_status, start_date, deadline, description } = req.body;
    if (!client_id || !project_name) return res.status(400).json({ message: 'client_id and project_name required' });
    const [[client]] = await pool.execute('SELECT * FROM clients WHERE id = ?', [client_id]);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const [result] = await pool.execute(
      'INSERT INTO projects (client_id,project_name,project_status,budget,paid_amount,payment_status,start_date,deadline,description) VALUES (?,?,?,?,?,?,?,?,?)',
      [client_id, project_name, project_status||'Pending', budget||0, paid_amount||0, payment_status||'Due', start_date||'', deadline||'', description||'']
    );
    await logActivity('Project Added', `"${project_name}" added for ${client.name}`, 'project');
    const [[row]] = await pool.execute(
      'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
      [result.insertId]
    );
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/projects/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { project_name, project_status, budget, paid_amount, payment_status, start_date, deadline, description } = req.body;
    const [[proj]] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    await pool.execute(
      'UPDATE projects SET project_name=?,project_status=?,budget=?,paid_amount=?,payment_status=?,start_date=?,deadline=?,description=? WHERE id=?',
      [project_name, project_status, budget||0, paid_amount||0, payment_status, start_date||'', deadline||'', description||'', req.params.id]
    );
    await logActivity('Project Updated', `"${project_name}" updated`, 'project');
    const [[row]] = await pool.execute(
      'SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/projects/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[proj]] = await pool.execute('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!proj) return res.status(404).json({ message: 'Project not found' });
    await pool.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    await logActivity('Project Deleted', `"${proj.project_name}" removed`, 'project');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — INTERNS
// ═══════════════════════════════════════════════

app.get('/api/interns', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT DISTINCT
        i.intern_id AS id,
        i.name,
        i.email,
        i.phone,
        COALESCE(c.intern_course_name, 'Intern') AS role,
        '' AS current_project,
        i.duration,
        DATE_FORMAT(i.joining_date, '%Y-%m-%d') AS start_date,
        i.status,
        '' AS college_name,
        CONCAT('Mode: ', i.mode, ', Payment: ', i.payment, ', Working Days: ', i.total_workingdays) AS skills,
        i.joining_date AS created_at,
        'erp' AS source
      FROM internship_tbl i
      LEFT JOIN inter_course_tbl c ON c.inte_cou_id = i.inte_cou_id
      WHERE i.status = 'Active'
      ORDER BY i.joining_date DESC, i.intern_id DESC
    `);
    if (erpResult) return res.json(erpResult[0]);

    const [rows] = await pool.execute("SELECT * FROM interns WHERE status = 'Active' ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/interns/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT DISTINCT
        i.intern_id AS id,
        i.name,
        i.email,
        i.phone,
        COALESCE(c.intern_course_name, 'Intern') AS role,
        '' AS current_project,
        i.duration,
        DATE_FORMAT(i.joining_date, '%Y-%m-%d') AS start_date,
        i.status,
        '' AS college_name,
        CONCAT('Mode: ', i.mode, ', Payment: ', i.payment, ', Working Days: ', i.total_workingdays) AS skills,
        i.joining_date AS created_at,
        'erp' AS source
      FROM internship_tbl i
      LEFT JOIN inter_course_tbl c ON c.inte_cou_id = i.inte_cou_id
      WHERE i.intern_id = ?
      LIMIT 1
    `, [req.params.id]);
    if (erpResult) {
      const intern = erpResult[0][0];
      if (!intern) return res.status(404).json({ message: 'Intern not found' });
      return res.json(intern);
    }

    const [[intern]] = await pool.execute('SELECT * FROM interns WHERE id = ?', [req.params.id]);
    if (!intern) return res.status(404).json({ message: 'Intern not found' });
    res.json(intern);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/interns', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, role, current_project, duration, start_date, status, college_name, skills } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const [result] = await pool.execute(
      'INSERT INTO interns (name,email,phone,role,current_project,duration,start_date,status,college_name,skills) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, email||'', phone||'', role||'', current_project||'', duration||'', start_date||'', status||'Active', college_name||'', skills||'']
    );
    await logActivity('Intern Added', `${name} joined as ${role||'Intern'}`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM interns WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/interns/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[existing]] = await pool.execute('SELECT * FROM interns WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Intern not found' });
    const { name, email, phone, role, current_project, duration, start_date, status, college_name, skills } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    await pool.execute(
      'UPDATE interns SET name=?,email=?,phone=?,role=?,current_project=?,duration=?,start_date=?,status=?,college_name=?,skills=? WHERE id=?',
      [name, email||'', phone||'', role||'', current_project||'', duration||'', start_date||'', status||'Active', college_name||'', skills||'', req.params.id]
    );
    await logActivity('Intern Updated', `${name} profile updated`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM interns WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/interns/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[intern]] = await pool.execute('SELECT * FROM interns WHERE id = ?', [req.params.id]);
    if (!intern) return res.status(404).json({ message: 'Intern not found' });
    await pool.execute('DELETE FROM interns WHERE id = ?', [req.params.id]);
    await logActivity('Intern Deleted', `${intern.name} removed`, 'client');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// ROUTES — EMPLOYEES
// ═══════════════════════════════════════════════

app.get('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT DISTINCT
        b.id,
        b.name,
        COALESCE(r.role_name, 'Employee') AS role,
        b.email,
        b.phone,
        COALESCE(en.entity_name, '') AS department,
        '' AS current_project,
        b.status,
        b.created_at,
        b.updated_at,
        'erp' AS source
      FROM basic_details b
      LEFT JOIN additional_details a ON a.basic_id = b.id
      LEFT JOIN roles r ON r.role_id = a.role
      LEFT JOIN entity_tbl en ON en.entity_id = a.entity_id
      WHERE b.is_admin = 'False' AND b.status = 'Active'
      ORDER BY b.created_at DESC, b.id DESC
    `);
    if (erpResult) return res.json(erpResult[0]);

    const [rows] = await pool.execute("SELECT * FROM employees WHERE status = 'Active' ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT DISTINCT
        b.id,
        b.name,
        COALESCE(r.role_name, 'Employee') AS role,
        b.email,
        b.phone,
        COALESCE(en.entity_name, '') AS department,
        '' AS current_project,
        b.status,
        b.created_at,
        b.updated_at,
        'erp' AS source
      FROM basic_details b
      LEFT JOIN additional_details a ON a.basic_id = b.id
      LEFT JOIN roles r ON r.role_id = a.role
      LEFT JOIN entity_tbl en ON en.entity_id = a.entity_id
      WHERE b.id = ?
      LIMIT 1
    `, [req.params.id]);
    if (erpResult) {
      const employee = erpResult[0][0];
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      return res.json(employee);
    }

    const [[employee]] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/employees', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, role, email, phone, department, current_project, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const [result] = await pool.execute(
      'INSERT INTO employees (name,role,email,phone,department,current_project,status) VALUES (?,?,?,?,?,?,?)',
      [name, role||'', email||'', phone||'', department||'', current_project||'', status||'Active']
    );
    await logActivity('Employee Added', `${name} added as ${role||'Employee'}`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[existing]] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Employee not found' });
    const { name, role, email, phone, department, current_project, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    await pool.execute(
      'UPDATE employees SET name=?,role=?,email=?,phone=?,department=?,current_project=?,status=? WHERE id=?',
      [name, role||'', email||'', phone||'', department||'', current_project||'', status||'Active', req.params.id]
    );
    await logActivity('Employee Updated', `${name} profile updated`, 'client');
    const [[row]] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/employees/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [[employee]] = await pool.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    await pool.execute('DELETE FROM employees WHERE id = ?', [req.params.id]);
    await logActivity('Employee Deleted', `${employee.name} removed`, 'client');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════
async function getRoshanTradeSnapshot() {
  const [products] = await pool.execute('SELECT id, product_name, unit FROM roshan_products ORDER BY id');
  const [suppliers] = await pool.execute('SELECT id, supplier_name, phone, address FROM roshan_suppliers ORDER BY supplier_name');
  const [clients] = await pool.execute('SELECT id, client_name, phone, address FROM roshan_clients ORDER BY client_name');
  const [transactions] = await pool.execute(`
    SELECT
      id,
      transaction_type,
      product_id,
      supplier_id,
      client_id,
      quantity,
      rate,
      total_amount,
      paid_amount,
      pending_amount,
      payment_status,
      payment_mode,
      DATE_FORMAT(transaction_date, '%Y-%m-%d') AS transaction_date,
      note
    FROM roshan_transactions
    ORDER BY transaction_date DESC, id DESC
  `);
  return { products, suppliers, clients, transactions };
}

function roshanPaymentStatus(total, paid) {
  const totalAmount = Number(total || 0);
  const paidAmount = Number(paid || 0);
  if (paidAmount >= totalAmount && totalAmount > 0) return 'PAID';
  if (paidAmount > 0) return 'PARTIAL';
  return 'PENDING';
}

async function findOrCreateRoshanParty(conn, tableName, name, phone, address) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const table = tableName === 'suppliers' ? 'roshan_suppliers' : 'roshan_clients';
  const nameColumn = tableName === 'suppliers' ? 'supplier_name' : 'client_name';
  const [[existing]] = await conn.execute(
    `SELECT id FROM ${table} WHERE LOWER(${nameColumn}) = LOWER(?) LIMIT 1`,
    [cleanName]
  );
  if (existing) {
    await conn.execute(
      `UPDATE ${table} SET phone = COALESCE(NULLIF(?, ''), phone), address = COALESCE(NULLIF(?, ''), address) WHERE id = ?`,
      [phone || '', address || '', existing.id]
    );
    return existing.id;
  }
  const [result] = await conn.execute(
    `INSERT INTO ${table} (${nameColumn}, phone, address) VALUES (?,?,?)`,
    [cleanName, phone || '', address || '']
  );
  return result.insertId;
}

async function getRoshanStock(conn, productId) {
  const [[row]] = await conn.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN quantity ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN quantity ELSE 0 END), 0) AS stock
    FROM roshan_transactions
    WHERE product_id = ?
  `, [productId]);
  return Number(row?.stock || 0);
}

app.get('/api/roshan/trade', authMiddleware, adminOnly, async (req, res) => {
  try {
    res.json(await getRoshanTradeSnapshot());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/roshan/transactions', authMiddleware, adminOnly, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      transaction_type,
      product_id,
      supplier_name,
      client_name,
      phone,
      address,
      quantity,
      rate,
      paid_amount,
      payment_mode,
      transaction_date,
      note
    } = req.body;

    const type = String(transaction_type || '').toUpperCase();
    const productId = Number(product_id);
    const qty = Number(quantity || 0);
    const unitRate = Number(rate || 0);
    const paid = Number(paid_amount || 0);
    if (!['PURCHASE', 'SALE'].includes(type) || !productId || qty <= 0 || unitRate <= 0 || !transaction_date) {
      return res.status(400).json({ message: 'Invalid transaction details' });
    }
    if (type === 'PURCHASE' && !String(supplier_name || '').trim()) {
      return res.status(400).json({ message: 'Supplier is required for purchase' });
    }
    if (type === 'SALE' && !String(client_name || '').trim()) {
      return res.status(400).json({ message: 'Client is required for sale' });
    }

    await conn.beginTransaction();
    const [[product]] = await conn.execute('SELECT id FROM roshan_products WHERE id = ?', [productId]);
    if (!product) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    if (type === 'SALE') {
      const stock = await getRoshanStock(conn, productId);
      if (qty > stock) {
        await conn.rollback();
        return res.status(400).json({ message: `Only ${stock} available in stock` });
      }
    }

    const supplierId = type === 'PURCHASE'
      ? await findOrCreateRoshanParty(conn, 'suppliers', supplier_name, phone, address)
      : null;
    const clientId = type === 'SALE'
      ? await findOrCreateRoshanParty(conn, 'clients', client_name, phone, address)
      : null;
    const total = qty * unitRate;
    const pending = Math.max(total - paid, 0);
    const status = roshanPaymentStatus(total, paid);

    const [result] = await conn.execute(`
      INSERT INTO roshan_transactions
      (transaction_type, product_id, supplier_id, client_id, quantity, rate, total_amount, paid_amount, pending_amount, payment_status, payment_mode, transaction_date, note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      type,
      productId,
      supplierId,
      clientId,
      qty,
      unitRate,
      total,
      paid,
      pending,
      status,
      ['Cash', 'UPI', 'Bank'].includes(payment_mode) ? payment_mode : 'Cash',
      transaction_date,
      note || ''
    ]);
    await conn.commit();
    await logActivity('Roshan Trade Saved', `${type} transaction #${result.insertId}`, 'payment');
    res.status(201).json(await getRoshanTradeSnapshot());
  } catch (err) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
});

app.get('/api/rn/things-products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT subcat_id AS id, name, UPPER(LEFT(REPLACE(name, ' ', ''), 3)) AS icon
      FROM expense_subcategory
      WHERE status = 'Active'
      ORDER BY name
    `);
    if (erpResult) return res.json(erpResult[0]);
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/rn/things-expenses', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT
        e.expense_id AS id,
        DATE_FORMAT(e.date, '%Y-%m-%d') AS date,
        e.cash_handler AS vehicleNo,
        COALESCE(s.name, c.name, 'Expense') AS productName,
        e.mode AS charges,
        0 AS firstWeight,
        0 AS secondWeight,
        0 AS netWeight,
        CAST(e.amount AS DECIMAL(12,2)) AS amount,
        e.description AS notes
      FROM expense_details e
      LEFT JOIN expense_subcategory s ON s.subcat_id = e.sub_id
      LEFT JOIN expense_category c ON c.cat_id = s.cat_id
      WHERE e.status = 'Active'
      ORDER BY e.date DESC, e.expense_id DESC
    `);
    if (erpResult) return res.json(erpResult[0]);
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/rn/employee-salary', authMiddleware, adminOnly, async (req, res) => {
  try {
    const salaryDate = firstSaturdayExpr('s.month');
    const erpResult = await erpExecute(`
      SELECT
        s.salary_id AS id,
        DATE_FORMAT(${salaryDate}, '%Y-%m-%d') AS date,
        b.name AS employeeName,
        s.salary AS salaryAmount,
        s.salary AS finalSalary,
        'Paid' AS status,
        CONCAT('ERP month: ', DATE_FORMAT(s.month, '%Y-%m-%d'), ', Days: ', s.days) AS notes
      FROM salary_tbl s
      LEFT JOIN (
        SELECT id, MIN(name) AS name
        FROM basic_details
        GROUP BY id
      ) b ON b.id = s.basic_id
      WHERE s.status = 'Active'
      ORDER BY s.month DESC, s.salary_id DESC
    `);
    if (erpResult) return res.json(erpResult[0]);
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/rn/bricks-income', authMiddleware, adminOnly, async (req, res) => {
  try {
    const erpResult = await erpExecute(`
      SELECT
        CONCAT('project-', pa.pro_amt_id) AS id,
        DATE_FORMAT(pa.pay_date, '%Y-%m-%d') AS date,
        COALESCE(c.client_name, '') AS customer,
        COALESCE(p.project_name, 'Project Payment') AS detail,
        pa.amnt_received AS rate,
        1 AS count,
        pa.amnt_received AS amount,
        CASE WHEN pa.pay_status = 'Completed' THEN 'Paid' ELSE 'Pending' END AS paymentStatus
      FROM project_amount pa
      LEFT JOIN project_tbl p ON p.project_id = pa.project_id
      LEFT JOIN client_tbl c ON c.client_id = p.client
      UNION ALL
      SELECT
        CONCAT('iv-', id) AS id,
        DATE_FORMAT(paid_date, '%Y-%m-%d') AS date,
        reason AS customer,
        CONCAT(reason, ' Payment') AS detail,
        amount AS rate,
        1 AS count,
        amount,
        CASE WHEN pay_status = 'Paid' THEN 'Paid' ELSE 'Pending' END AS paymentStatus
      FROM iv_payment_tbl
      WHERE status = 'Active'
      ORDER BY date DESC
    `);
    if (erpResult) return res.json(erpResult[0]);
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║   NexaCRM Backend is RUNNING! 🚀     ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║   API: http://localhost:${PORT}         ║`);
    console.log('║   DB:  MySQL ✅                      ║');
    console.log('║   Login: admin@gmail.com             ║');
    console.log('║   Pass:  admin                       ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('');
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  console.error('Check your .env file and make sure MySQL is running!');
  process.exit(1);
});
