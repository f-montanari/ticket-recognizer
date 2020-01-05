const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const crawler = require('crawler');

const url = "https://www.cotodigital3.com.ar/sitios/cdigi";
const saveFile = './data/categoryArray.json';

var categories = [];

fs.readFile('./data/categories.json', function(err,data)
{
    if (err)
    {
        console.log('Error: ' + err.message);
    }
    
    var mainCategoryString = data.toString();
    var mainCategory = JSON.parse(mainCategoryString);
    
    var urlArray = [];
    var categoryNameArray = [];

    mainCategory.navigationCategories.forEach(navigationCategory => {
        if(navigationCategory.idCategoria != "-" && navigationCategory.idCategoria != "catv00001296")
        {            
            navigationCategory.firstLevelCategories.forEach(firstLevelCategory => {                
                var dispName = firstLevelCategory.displayName;
                firstLevelCategory.secondLevelCategories.forEach(endCategory =>{
                    urlArray.push(endCategory.url);
                    categoryNameArray.push(endCategory.displayName);
                });
            });
        }
    });

    var i = 0;    
    /*urlArray.forEach(element =>
    {
        var category = categoryNameArray[i];
        axios.get(url + element).then(response => {            
            var names = getNameVector(response.data);
            var keyValuePair = { key : category , value : names};            
            categories.push(keyValuePair);
            console.log(categories);
            checkFinished(urlArray.length);
        }).catch((err)=>{
            console.log("Error: " + err.message);
            forceSave();            
        });
        i+=1;
    });*/

    var c = new crawler({
        rateLimit:500,
        callback : function (err,res,done){
            if(err)
            {
                // Just in case
                forceSave();
                i+=1;
                done();
                return;
            }

            var category = categoryNameArray[i];
            var names = getNameVector(res.$);
            var keyValuePair = { key : category , value : names};            
            categories.push(keyValuePair);
            console.log(categories);
            //checkFinished(urlArray.length);
            checkCrawlFinish(c);
            i+=1;
            done();
        }
    });
    c.on('drain',function(){
        forceSave();
        console.log("Finished crawling");
    });
    urlArray.forEach(element =>{
        var strUri = url + element;        
        c.queue({uri: strUri});        
    });
});

/*function filterData()
{
    categories = categories.map(element => {
        element = element.replace('/\d|Cmq|Bot|Ltr|Kg|Ml|Frasco|Botella|Gr|Cc|L|Bot|Pouch|Tetrabrik|Cm|Uni|Kgm|Grm|K|Bsa|Bolsa|Bol|Pou|Fra|Pote/g','');
    });
}
*/
function forceSave()
{

  //  filterData();

    fs.writeFile(saveFile,JSON.stringify(categories),()=>{
        console.log('Finished saving data into file');
    });
}

var counter = 0;
function checkCrawlFinish(c)
{
    counter+=1;
    console.log("Current: " + counter + "\nRemaining: " + c.queueSize);    
}


function checkFinished(count)
{
    counter+=1;
    console.log("Counter: " + counter + "\nCount: " + count);
    if(count == counter - 1)
    {
        fs.writeFile(saveFile,JSON.stringify(categories),()=>{
            console.log('Finished saving data into file');
        });
    }
}

function getNameVector($)
{        
    var nameVector = [];
    $("#products").find('.descrip_full').each(function (index) {
        var text = $(this).text();
        text = text.replace(/\.|\d|\bCmq\b|\bBot\b|\bLtr\b|\bKg\b|\bMl\b|\bFrasco\b|\bBotella\b|\bGr\b|\bCc\b|\bL\b|\bBot\b|\bPouch\b|\bTetrabrik\b|\bCm\b|\bUni\b|\bKgm\b|\bGrm\b|\bK\b|\bBsa\b|\bBolsa\b|\bBol\b|\bPou\b|\bFra\b|\bPote\b|\bCaja\b|\bEst\b|\bm\b|\bPak\b|\bPot\b|\bCja\b|\bFwp\b|\bUnidad\b|\bUnidades\b|\bPaquete\b|\bPaq\b|\bLat\b|\bTab\b|\bDsp\b|\bBli\b|\bLata\b|\bSaquitos\b|\bPet\b|\bSobre\b|\bSob\b|/g,"");        
        text = text.trim();
        nameVector.push(text);
    });

    return nameVector;
}