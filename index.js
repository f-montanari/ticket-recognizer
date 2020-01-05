const tesseract = require('node-tesseract-ocr');
const express = require('express');
const ticketParser = require('../Tesseract/ticketParser');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const expensesTracker = require('./expensesTracker')

// =============================== INITIALIZATION ===============================

// MULTER
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})
const upload = multer({ storage: storage }).single('img')

// EXPRESS
var app = express();
// Uncomment when pushing to production, after copying the front-end data to the ftp folder.
app.use(express.static('ftp')); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// TICKET PARSER
ticketParser.initialize();

// ============================= END INITIALIZATION =============================

/**
 * Recognize strings inside an image located in Uploads folder, and parse it in a TicketData object. 
 * Usually called after the file was uploaded.
 * @param {String} imgName Name of the image located in the "uploads" folder.
 * @returns {Promise} 
 */
function recognize(imgName) {
    return new Promise(resolve => {

        var imgPath = 'uploads/' + imgName;

        // Set Language config
        var config = {
            lang: 'spa'
        };

        // Recognize the image
        tesseract.recognize(imgPath, config)
            .then((value) => {
                // We got a value
                //console.log("Result: ", value);

                var totalValue = ticketParser.analizeTotalValue(value);

                var ticketItems = ticketParser.classifyEntries(value);
                console.log(ticketItems);

                var ticketData = {
                    items: ticketItems,
                    value: totalValue
                }

                resolve(ticketData);

            }).catch((ex) => {

                //We got an error.
                console.log("Error!", ex.message);
                resolve('Error while trying to parse image: ' + ex.message);
            });
    });
}


// =============================== API ROUTES ===============================

app.post('/upload', (req, res) => {
    console.log("Uploading file");
    upload(req, res, (err) => {
        if (err) {
            console.log('first err', err);
            res.send({
                msg: err
            });
        } else {
            if (req.file == undefined) {
                console.log('Error: No File Selected!')
                res.send({
                    msg: 'Error: No File Selected!'
                });
            } else {
                console.log('File Uploaded!')
                recognize(req.file.filename).then((data) => {
                    res.send(data);
                });
            }
        }
    });
});

app.get('/forceTrain', (req,res) => {
    ticketParser.forceTrainData();
    res.send('Successfully forced new training data');
});

app.get('/getYearData', (req,res) => {
    
    var date = new Date();
        var data =
        {
            chartData: expensesTracker.generateYearChartData(date.getFullYear()),
            totalValue : expensesTracker.getTotalSpentThisYear()
        } 
        
        if(Number.isNaN(data.totalValue))
        {
            // This year doesn't have any records yet, or there was an error during data fetching.
            console.error("Error: Data not found for this year. Is this ok?")            
            res.sendStatus(404);
            return;
        }

        res.send(data);
    
});

app.post('/getYearData', (req,res) =>{
    if(!req.body.year)
    {
        var date = new Date();
        var data =
        {
            chartData: expensesTracker.generateYearChartData(date.getFullYear()),
            totalValue : expensesTracker.getTotalSpentThisYear()
        } 
        
        if(Number.isNaN(data.totalValue))
        {
            // This year doesn't have any records yet, or there was an error during data fetching.
            console.error("Error: Data not found for this year. Is this ok?")            
            res.sendStatus(404);
            return;
        }

        res.send(data);
    }
    else
    {
        var year = req.body.year;
        var data = 
        {
            chartData: expensesTracker.generateYearChartData(year),
            totalValue : expensesTracker.getTotalSpentInYear(year)
        }

        if(Number.isNaN(data.totalValue))
        {
            // The selected year doesn't have any records yet, or there was an error during data fetching.
            console.error("Error: Data not found for year "+ year +". Is this ok?")            
            res.sendStatus(404);
            return;
        }

        res.send(data);
    }
})

app.post('/addNewTrainingData', (req,res) => {    
    if(req.body.correctionData)
    {
        var data = JSON.stringify(req.body.correctionData);
        ticketParser.addCorrectedData(data);        
        var expenses =  {
            date  : new Date().getDate(),
            items : req.body.correctionData,
            value : parseFloat(req.body.totalValue)
        };

        expensesTracker.addNewExpenses(expenses);   
        res.json({message:"Successfully saved data."});             
    }else{
        console.error('Bad correction data')
        res.sendStatus(400);
    }
});

app.get('/forceTrainData', (req,res) => {
    ticketParser.forceTrainData();
    res.send("Okay");
});

app.get('/getCategories', (req, res) => {
    var categories = ticketParser.getCategories();
    res.send(categories);
});

app.get('/getMonthData', (req,res) => {

    
    var date = new Date();    
    
    var data = {
        chartData : expensesTracker.generateMonthChartData(date.getMonth() + 1, date.getFullYear()),
        totalValue : expensesTracker.getTotalSpentThisMonth()
    }

    res.send(data);
});

app.post('/getMonthData', (req,res) => {
    var year, month;
    
    if(!req.body.month && !req.body.year)
    {
        // We got an empty body. This means to get this month's total (by design).
        var date = new Date();
        year = date.getFullYear();
        month = date.getMonth() + 1;
    }
    else if(!req.body.month || !req.body.year)
    {
        // One of the required months is null.
        res.sendStatus(404);
        return;
    }
    year = req.body.year;
    month = req.body.month;
    var data = {
        chartData : expensesTracker.generateMonthChartData(month, year),
        totalValue : expensesTracker.getTotalSpentThisMonth()
    }

    res.send(data);
})

// =============================== END API ROUTES ===============================

app.listen(3000, () => {
    console.log("Listening on port 3000!");
});

