let express = require('express')
let cors = require('cors')
require('dotenv').config()

let App = express()


App.listen(process.env.PORT, () => {
    console.log('Server Started')
})