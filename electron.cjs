const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { protocol } = require('electron')
const { log } = require('console')

const configPath = path.join(app.getPath('userData'), 'config.json')

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')) }
  catch { return {} }
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data))
}

function initDB(dbPath) {
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT
    );
  `)
  return db
}

let db

ipcMain.handle('get-db-path', () => {
  const config = getConfig()
  return config.dbPath || path.join(path.dirname(app.getPath('exe')), 'savor.db')
})

ipcMain.handle('choose-db-path', async () => {
  const result = await dialog.showOpenDialog({ title: 'Choose where to save your database', properties: ['openDirectory'] })
  if (result.canceled) return null
  const dbPath = path.join(result.filePaths[0], 'savor.db')
  saveConfig({ dbPath })
  db = initDB(dbPath)
  return dbPath
})

ipcMain.handle('get-income',     () => db.prepare('SELECT * FROM income ORDER BY date DESC').all())
ipcMain.handle('add-income',     (_, e) => db.prepare('INSERT INTO income (date,category,amount,note) VALUES (?,?,?,?)').run(e.date, e.category, e.amount, e.note))
ipcMain.handle('update-income',  (_, e) => db.prepare('UPDATE income SET date=?,category=?,amount=?,note=? WHERE id=?').run(e.date, e.category, e.amount, e.note, e.id))
ipcMain.handle('delete-income',  (_, id) => db.prepare('DELETE FROM income WHERE id=?').run(id))

ipcMain.handle('get-expenses',   () => db.prepare('SELECT * FROM expenses ORDER BY date DESC').all())
ipcMain.handle('add-expense',    (_, e) => db.prepare('INSERT INTO expenses (date,category,amount,note) VALUES (?,?,?,?)').run(e.date, e.category, e.amount, e.note))
ipcMain.handle('update-expense', (_, e) => db.prepare('UPDATE expenses SET date=?,category=?,amount=?,note=? WHERE id=?').run(e.date, e.category, e.amount, e.note, e.id))
ipcMain.handle('delete-expense', (_, id) => db.prepare('DELETE FROM expenses WHERE id=?').run(id))

function createWindow() {
  const config = getConfig()
  const dbPath = config.dbPath || path.join(path.dirname(app.getPath('exe')), 'savor.db')
  db = initDB(dbPath)

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Savor — Resort & Restaurant',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

if (app.isPackaged) {
  win.loadURL('app://index.html')
} else {
  win.loadURL('http://localhost:5173')
}}

app.on('ready', () => {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://', '')
    const filePath = path.join(__dirname, 'dist', decodeURIComponent(url))
    callback({ path: filePath })
  })
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
console.log