const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Diagnostics: Log exactly where the server is running
console.log("Current Directory:", __dirname);

// 2. Allow access to the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. SECURE ROOT ACCESS: If the user visits '/', manually find index.html
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.log("Error finding index.html at:", indexPath);
            res.status(404).send("Internal Error: Mikki could not find your index.html file in the public folder.");
        }
    });
});

// ... Keep your Mikki AI /api/chat code here ...

app.listen(PORT, () => console.log(`[+] SYSTEM LIVE ON PORT ${PORT}`));
