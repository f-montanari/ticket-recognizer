// Module responsible for tracking and making monthly summaries of expenses.

const fs = require('fs');
const date = new Date();

const dirUrl = "./data/expenses/";

/**
 * Add new expenses to monthly file, stored in ./data/expenses.
 * If this file isn't available, it will be created.
 * 
 * @param {json} data Data that will be stored into the monthly file (mm-yyyy-expenses.json).
 */
const addNewExpenses = function (data){    
    var currentMonthExpenseURL = dirUrl + (date.getMonth() + 1).toString() + "-" + date.getFullYear() + "-expenses.json";
    var expenses = [];
    try {
        expenses = JSON.parse(fs.readFileSync(currentMonthExpenseURL).toString());
    } catch (err) {
        console.error(err.message)
    } finally {
        //var jsonData = JSON.parse(data);
        
        // jsonData.forEach(element => {
        //     expenses.push(element);
        // });
        expenses.push(data);
        fs.writeFileSync(currentMonthExpenseURL,JSON.stringify(expenses));
    }
}

/**
 * Generate chartjs data for a month and year.
 * 
 * @param {int} month Desired month we want to get data from
 * @param {int} year Desired year we want to get data from
 * @returns An array going from 0 -> 30 of the total value spent that day.
 */
const generateMonthChartData = function (month, year) {
    
    var url = getExpensesFilePath(month,year);
    
    // This should be an array of objects.
    var expensesData = JSON.parse(fs.readFileSync(url).toString());            
    var datapoints = [];

    // All points not in the graph need to be NaN in order to avoid false data.
    for(i=1;i<=31;i++)
    {        
        datapoints[i-1] = NaN;
    }    

    expensesData.forEach(element => {
        if(Number.isNaN(datapoints[element.date-1]))
        {
            datapoints[element.date-1] = element.value;             
        }
        else
        {
            datapoints[element.date-1] += element.value;         
        }        
    });
    
    return datapoints;
}

/**
 * Get file path for the desired expenses file.
 * @param {int} month Desired month to get expenses from
 * @param {int} year Desired year to get expenses from
 * @returns {string} File path for the expenses file of the desired month and year.
 */
function getExpensesFilePath(month,year)
{
    return dirUrl + month + "-" + year + "-expenses.json";
}

/**
 * Get file path for this month's expenses.
 * @returns File path for today's expenses file.
 */
function getTodaysExpensesFilePath()
{
    // January starts with 0
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    return getExpensesFilePath(month,year);
}


/**
 * A function to get all money spent this month.
 * @returns Total money spent this month.
 */
const getTotalSpentThisMonth = function ()
{    
    var month = date.getMonth() + 1;
    var year = date.getUTCFullYear();
    
    return getTotalSpentInMonth(month,year);
}

/**
 * Gets all money spent in a given month. If the records weren't found, this will return NaN.
 * @param {int} month Month of the given record to search for
 * @param {int} year Year of the given record to search for
 */
const getTotalSpentInMonth = function(month, year)
{
    var url = getExpensesFilePath(month,year);

    var total = NaN;
    try {
        var strData = fs.readFileSync(url).toString();
        var jsonData = JSON.parse(strData);
        total = 0;
        jsonData.forEach(element => {
            total += element.value;
        });

    } catch (error) {
        console.error("Error: couldn't find file " + url);
    }finally{
        return total;
    }
}


/**
 * Generate ChartJS data for the given year. If the year isn't found, this will return an array of NaN.
 * @param {int} year Year to gather data from.
 */
const generateYearChartData = function(year)
{    
    var data = []
    for(i=0;i<12;i++)
    {
        data[i] = NaN;
        var path = getExpensesFilePath(i+1,year);
        if(fs.existsSync(path))
        {
            var monthData = JSON.parse(fs.readFileSync(path).toString());
            data[i] = 0;
            monthData.forEach(element =>{
                data[i] += element.value;
            });
        }
    }

    return data;
}


/**
 * Get all money spent this year
 * @returns all money that was spent in this year.
 */
const getTotalSpentThisYear = function() 
{
    var year = date.getFullYear();
    return getTotalSpentInYear(year);
}

/**
 * Get total money spent in a given year. This returns NaN if the records couldn't be found.
 * @param {int} year Year we want to fetch data from.
 */
const getTotalSpentInYear = function(year)
{
    var total = NaN;
    for(i=1;i<=12;i++)
    {        
        var path = getExpensesFilePath(i,year);
        if(fs.existsSync(path))
        {
            var monthData = JSON.parse(fs.readFileSync(path).toString());
            total = 0;            
            monthData.forEach(element =>{
                total += element.value;
            });
        }
    }

    return total;
}


// =================== EXPORTS ===================
exports.generateMonthChartData = generateMonthChartData;
exports.addNewExpenses = addNewExpenses;
exports.getTotalSpentInMonth = getTotalSpentInMonth;
exports.getTotalSpentThisMonth = getTotalSpentThisMonth;
exports.getTotalSpentInYear = getTotalSpentInYear;
exports.getTotalSpentThisYear = getTotalSpentThisYear;
exports.generateYearChartData = generateYearChartData;