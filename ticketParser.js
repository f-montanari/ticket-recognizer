const fs = require('fs');
const natural = require('natural');

const dictionaryUrl = "./data/categoryArray.json";
var myClassifier = new natural.BayesClassifier();


/**
 * Train model with saved data from a dictionary stored in the dictionaryUrl constant.
 * @returns {natural.BayesClassifier} Naive Bayes classifier object trained with data from a loaded dictionary.
 */
function trainModel() {
    var data = loadDictionary();
    if (data == null) {
        console.log("ERROR: Could not load data dictionary. Can't train the model.");
        return;
    }
    data.forEach(keyValuePair => {
        var category = keyValuePair.key;
        keyValuePair.value.forEach(strValue => {
            myClassifier.addDocument(strValue, category);
        });
    });

    console.log("Loaded documents. Now training model...");
    myClassifier.train();
    console.log("Finished training data.");
    myClassifier.save('./data/trainingData.json', (err, clasifier) => {
        if (err) {
            console.log("Error: Couldn't save data.\n" + err.message);
        }
        else {
            console.log("Saved training data successfully");
        }
        return myClassifier;
    });
}


/**
 * Load data dictionary from a URL, along with corrections from the 'corrections.json' file.
 * 
 * @returns {JSON} Data from dictionary that has all key/values associated with categories.
 */
function loadDictionary() {
    var data = fs.readFileSync(dictionaryUrl);
    var dataDictionary = JSON.parse(data.toString());
    try {
        // Correction data will be a text file with different correction arrays separated by new lines.
        var correctionDataRaw = fs.readFileSync('./data/corrections.json').toString();

        var correctionData = JSON.parse(correctionDataRaw);
        
        // TODO : If the key exists, add to this key.
        correctionData.forEach((keyValuePair) => {

            // TODO: This is slow. Should search for an implementation of some sort, instead of doing
            // it by hand.

            var added = false;

            // Search dictionary for the given key
            dataDictionary.forEach(element => {
                if(element.key == keyValuePair.key)
                {
                    keyValuePair.value.forEach(val => {
                        element.value.push(val);
                    });
                    added = true;
                    return;
                }
            });

            if(!added)
            {
                dataDictionary.push(keyValuePair);    
            }

            // if(dataDictionary[keyValuePair.key])
            // {
            //     keyValuePair.value.forEach(element => {
            //         dataDictionary[keyValuePair.key].push(element);
            //     });
            // }else{
            //     dataDictionary.push(keyValuePair);
            // }
            
        });        
    } catch (err) {
        console.error(err);
    }

    return dataDictionary;
}

exports.initialize = function () {
    return new Promise((resolve) => {
        natural.BayesClassifier.load('./data/trainingData.json', null, (err, classifier) => {
            if (err) {
                console.log("Warning! couldn't load training data. Training again!");
                resolve(trainModel());
            }
            console.log("Successfully loaded training data.");
            myClassifier = classifier;
            resolve(classifier);
        });
    });
}

/**
 * Get all categories from the data dictionary.
 * @returns {JSON} Key-Value pair with the following format: {'category' : [ 'item1','item2','item3', ... ]}
 */
exports.getCategories = function () {
    var data = loadDictionary();
    var categories = [];
    data.forEach(element => {
        categories.push(element.key);
    });
    return categories;
}

/**
 * Extract the total value FROM THE LAST LINE.
 * @param {string} text Multiline text containing total value in the last line.
 * @returns {float} Total value number from last line.
 */
exports.analizeTotalValue = function (text) {
    // Split by line
    var arr = text.split("\n");

    // Clean every carriage return
    for (let i = 0; i < arr.length; i++) {
        var sub = arr[i];
        if (sub.includes('\r')) {
            sub = sub.substr(0, sub.length - 1);
        }
        sub = sub.trim();
        arr[i] = sub;
    }

    // Filter empty entries.
    var filtered = arr.filter(function (el) {
        return el != "" && el != "\f";
    });


    console.log(filtered);

    // Get the last item 
    var res = filtered[filtered.length - 1];

    // includes TOTAL word?
    if (res.includes("TOTAL")) {
        res = res.split("TOTAL")[1];
    }

    res = res.trim();
    if (res.startsWith('.')) {
        // Remove starting dots.
        res = res.substr(1, res.length);
    }

    // Remove whitespaces
    res = res.replace(/ /g, '');

    // Change comma to dots.
    res = res.replace(',', '.');

    console.log("Found: " + res);
    // Start parsing.
    var total = parseFloat(res);
    return total;
}

/**
 * This function filters unwanted noise in the recognition.
 * @param {string} unfilteredArray OCR Text feed with the objects to be recognized separated by a new line.
 * @returns {string} Multiline text with (hopefully) filtered noise out.
 */
function filterCategoryArray(unfilteredArray) {

    // Split by line
    var arr = unfilteredArray.split("\n");

    // Clean every carriage return
    for (let i = 0; i < arr.length; i++) {
        var sub = arr[i];
        if (sub.includes('\r')) {
            sub = sub.substr(0, sub.length - 1);
        }
        sub = sub.trim();
        arr[i] = sub;
    }

    // Filter empty entries.
    // And filter entries starting with a number (we just want all the groceries, not the prices).    
    var filtered = arr.filter(function (el) {
        return el != "" &&
            el != "\f" &&
            !/^\d/.test(el) &&
            !el.includes('TOTAL') &&
            !el.includes('SUBTOT.') &&
            !el.startsWith('(') &&
            el.length > 7;
    });

    /*var parenthesysFiltered = filtered.filter(element =>{
        if(/\([^)]*\)/g.test(element))
        {
            var replacedString = element.replace(/\([^)]*\)/g,'');
            return replacedString;
        }
        else{
            return element;
        }
    })
*/

    filtered = filtered.map(element => {
        // TODO: Find a "More readable" way to list and filter undesired words in the elements.
        element = element.replace(/\.|\d|\bCmq\b|\bBot\b|\bLtr\b|\bKg\b|\bMl\b|\bFrasco\b|\bBotella\b|\bGr\b|\bCc\b|\bL\b|\bBot\b|\bPouch\b|\bTetrabrik\b|\bCm\b|\bUni\b|\bKgm\b|\bGrm\b|\bK\b|\bBsa\b|\bBolsa\b|\bBol\b|\bPou\b|\bFra\b|\bPote\b|\bCaja\b|\bEst\b|\bm\b|\bPak\b|\bPot\b|\bCja\b|\bFwp\b|\bUnidad\b|\bUnidades\b|\bPaquete\b|\bPaq\b|\bLat\b|\bTab\b|\bDsp\b|\bBli\b|\bLata\b|\bSaquitos\b|\bPet\b|\bSobre\b|\bSob\b|\bGR\b|\bGR\.\b|/g, "");
        if (/\([^)]*\)/g.test(element)) {
            var replacedString = element.replace(/\([^)]*\)/g, '');
            return replacedString;
        }
        else {
            return element;
        }
    });

    //console.log(filtered);
    return filtered;
}

/**
 * Classify entries given from a text feed (usually from an OCR) given training data.
 * @param {string} ocrText Text from an OCR, with objects to be classified separated with new lines.
 * @returns {JSON} JSON Array containing objects with the following format: {id, name, category}.
 */
exports.classifyEntries = function (ocrText) {

    var filteredArray = filterCategoryArray(ocrText);

    var probabilityVector = [];    
    var itemId = 0;
    filteredArray.forEach(element => {

        // Classify whole element
        var classification = (myClassifier.classify(element));

        // // ... and each word, so we can get an idea of what it is.
        // words = element.split(" ");
        // words.forEach(word => {
        //     classifications.push(myClassifier.classify(word));
        // });

        // // Get count of every classification in this element.
        // var possibleLabels = {};
        // classifications.forEach( x => { possibleLabels[x] = (possibleLabels[x] || 0)+1; });
        
        // var betterLabel = "TEST";
        // var bestChance = 0;

        // // Iterate over the classifications array and see which is the best one 
        // var keys = Object.keys(possibleLabels);
        // for(const key of keys)
        // {
        //     if(possibleLabels[key] > bestChance)
        //     {
        //         betterLabel = key;
        //         bestChance = possibleLabels[key];
        //     }
        // }

        // var betterLabel = vector[0].label;
        // var bestChance = vector[0].value;

        // vector.forEach(probabilityPair => {
        //     if (probabilityPair.value > bestChance) {
        //         bestChance = probabilityPair.value;
        //         betterLabel = probabilityPair.label;
        //     }
        //     if (probabilityPair.value > bestPrediction) {
        //         bestPrediction = probabilityPair.value;
        //     }
        // });

        probabilityVector.push({ id: itemId, name: element, label: classification });
        itemId += 1;
    });


    // How reliable is the prediction vs the most accurate one?    
    /*probabilityVector.forEach(element => {
        if (Math.log10(bestPrediction / element.value) > 2) {
            element.label = element.label + " - UNRELIABLE";
        }
        //console.log("Trying to classify: " + element.name + "\nLabel: " + element.label + "\nProbability: " + element.value);
    });*/
    return probabilityVector;
}

/**
 * Erase training data and train again.
 */
exports.forceTrainData = function () {
    try {
        fs.unlinkSync('./data/trainingData.json');
        trainModel();
    }
    catch (err) {
        console.error(err);
    }
}


/**
 * Push correction to the 'corrections.json' file in order to be loaded later in training.
 * @param {JSON} data JSON Array with corrections. Eg: [{label:'myCategory',name:'myProductName'}]    
 */
exports.addCorrectedData = function (data) {
    var corrections = [];
    try {
        corrections = JSON.parse(fs.readFileSync('./data/corrections.json').toString());
    } catch (err) {
        console.error(err.message)
    } finally {
        data = JSON.parse(data);
        data.forEach(element => {
            corrections.push({ key: element.label, value: [element.name] })
        });

        fs.writeFile('./data/corrections.json', JSON.stringify(corrections), () => {
            console.log("Successfully added data to corrections.json");
        });
    }
}