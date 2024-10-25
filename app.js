const express = require('express');
const app = express();
const port = 3000;
app.get('/', (req, res) => {
    const nilai = req.query.nilai
    res.send(nilai);
});

app.get('/about', (req, res) => {
    res.send('Ini adalah halaman about');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
