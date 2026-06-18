const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('db', {
  getDbPath:     () => ipcRenderer.invoke('get-db-path'),
  chooseDbPath:  () => ipcRenderer.invoke('choose-db-path'),

  getIncome:     () => ipcRenderer.invoke('get-income'),
  addIncome:     (e) => ipcRenderer.invoke('add-income', e),
  updateIncome:  (e) => ipcRenderer.invoke('update-income', e),
  deleteIncome:  (id) => ipcRenderer.invoke('delete-income', id),

  getExpenses:   () => ipcRenderer.invoke('get-expenses'),
  addExpense:    (e) => ipcRenderer.invoke('add-expense', e),
  updateExpense: (e) => ipcRenderer.invoke('update-expense', e),
  deleteExpense: (id) => ipcRenderer.invoke('delete-expense', id),
})