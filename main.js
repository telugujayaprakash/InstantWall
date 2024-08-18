const { app, BrowserWindow } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
require('dotenv').config();

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');

    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await axios.get(process.env.INSTAGRAM_API_URL, requestOptions);
        const posts = response.data.data;

        if (posts && posts.length > 0) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            const imageUrl = randomPost.media_url;

            const documentsPath = path.join(os.homedir(), 'Documents');
            const wallpapersPath = path.join(documentsPath, 'Wallpapers');

            if (!fs.existsSync(wallpapersPath)) {
                fs.mkdirSync(wallpapersPath);
            }

            // Save the image with the current date in the filename
            const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const imagePath = path.join(wallpapersPath, `wallpaper_${dateStr}.jpg`);

            const writer = fs.createWriteStream(imagePath);
            const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
            imageResponse.data.pipe(writer);

            writer.on('finish', async () => {
                writer.close();
                console.log('Image downloaded successfully to:', imagePath);

                try {
                    // VBScript to set the wallpaper using the image path and refresh the desktop
                    const vbscript = `
Set WshShell = WScript.CreateObject("WScript.Shell")
imagePath = "${imagePath.replace(/\\/g, '\\\\')}"
WshShell.RegWrite "HKCU\\Control Panel\\Desktop\\Wallpaper", imagePath
Set objShell = CreateObject("Shell.Application")
objShell.ShellExecute "rundll32.exe", "user32.dll,UpdatePerUserSystemParameters", "", "open", 1
                    `;

                    const vbscriptPath = path.join(wallpapersPath, `setWallpaper.vbs`);
                    fs.writeFileSync(vbscriptPath, vbscript, { encoding: 'utf-16le' });

                    exec(`cscript //nologo "${vbscriptPath}"`, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Error setting wallpaper:', error);
                            return;
                        }
                        console.log('Wallpaper set successfully!');
                        // fs.unlinkSync(vbscriptPath); // Clean up the VBScript file
                    });
                } catch (err) {
                    console.error('Error setting wallpaper:', err);
                }
            });

            writer.on('error', (err) => {
                console.error('Error downloading image:', err);
            });

        } else {
            console.error('No posts found.');
        }
    } catch (error) {
        console.error('Error fetching post or setting wallpaper:', error);
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});