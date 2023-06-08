const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


// middlewares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('Academy is going to be fulled soon')
})

app.listen(port, () => {
    console.log(`Sports academy is admiting students on port ${port}`)
})