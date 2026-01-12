const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const download = (url, dest) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Download completed: ' + dest);
        });
    }).on('error', (err) => {
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        console.error('Error downloading ' + dest + ': ' + err.message);
    });
};

download('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', path.join(fontsDir, 'Roboto-Regular.ttf'));
download('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', path.join(fontsDir, 'Roboto-Bold.ttf'));
