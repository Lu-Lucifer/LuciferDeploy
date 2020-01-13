<<<<<<< HEAD
// Modules to control application life and create native browser window
const {app, BrowserWindow,dialog,Tray} = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
  app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
});
//建立与页面之间的通信
const ipcMain = require('electron').ipcMain;
ipcMain.on('asynchronous-message', function(event, arg) {
    dialog.showOpenDialog(mainWindow,{
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      filters: [
        { name: 'Vs Csproj', extensions: ['csproj'] },
        { name: 'Vs Project', extensions: ['sln'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    },function(res){
      event.sender.send('asynchronous-reply', [arg,res]);
    })
});

// ipcMain.on('showMessage', function(event, arg) {
//   let tray = new Tray("./images/deploy.png");
//   tray.displayBalloon({title:'123',icon:"./images/deploy.png",context:'123'});
// });
=======
// Modules to control application life and create native browser window
const {app, BrowserWindow,dialog} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
  app.quit()
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})
//建立与页面之间的通信
const ipcMain = require('electron').ipcMain;
ipcMain.on('asynchronous-message', function(event, arg) {
    dialog.showOpenDialog(mainWindow,{
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      filters: [
        { name: 'Vs Project', extensions: ['sln'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    },function(res){
      event.sender.send('asynchronous-reply', [arg,res]);
    })
});
>>>>>>> d5249fe0a4ddc8c9796eedf607562143fee2cfe6
