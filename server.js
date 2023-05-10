const express = require('express');

const port = 9450;

const app = express();

app.get('/test', (req, res) => {
    res.send('patata');
})

app.listen(port, () => {
    console.log("Server listening on port ", port);
})