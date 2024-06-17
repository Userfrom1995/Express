const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Function to get file/folder details
const getFileDetails = (filePath) => {
    const stats = fs.statSync(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
    };
};

// Route to list contents of a folder
app.get('/files', (req, res) => {
    const directoryPath = req.query.path ? path.resolve(__dirname, req.query.path) : __dirname;

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            res.status(500).send('Unable to scan directory: ' + err);
            return;
        }

        const filesList = files.map(file => getFileDetails(path.join(directoryPath, file)));
        res.json(filesList);
    });
});

// Route to download a file
app.get('/download', (req, res) => {
    const filePath = req.query.path ? path.resolve(__dirname, req.query.path) : null;

    if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).send('File not found');
        return;
    }

    if (fs.statSync(filePath).isDirectory()) {
        res.status(400).send('Cannot download a directory');
        return;
    }

    res.download(filePath);
});

// Route to stream a video file
app.get('/stream', (req, res) => {
    const filePath = req.query.path ? path.resolve(__dirname, req.query.path) : null;

    if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).send('File not found');
        return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
            return;
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
