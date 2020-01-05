const assert = require('chai').assert;
const ticketParser = require('../ticketParser.js');

const test1 = `
201517000000 0.134 X 357.00\r
PALETA CLAS. PALAD!\r
201075000000 0.106 X 445.98\r
- OS. TYBO ROSALAT KG\r
202164000000 0.272 X 35.99\r
ZANAHORIA SUELTA\r
179058098000\r
CHOCLO GR. ARCOR300\r
SUBTOT.\r
\r
TOTAL\r
\r
(21.00)\r
(21.00)\r
(10.50)\r
\r
(0.00)\r
\r
47.85\r
\r
a7.h\r
\r
n.5\r
176,14\r
\r
176.74\r
\f`;

const test2 = `
1,0000 x 23,9900\r 
Galletas Caricias an\r      
1,0000 x 32,6900\r
Pure tomate Marolio\r       
1,0000 x 79,9900\r
Mayonesa Hellmanns 4\r      
1,0000 x 49,9900\r
Prestopronta 5000\r
1,0000 x 55,9900\r
Lentejas secas Egr (10,50)\r
1,0000 x 87,1900\r
0.545 x 159.99\r
Molida comun Vaqui (10,50)\r
1,0000 x 44,9900\r
Papel Floripel 4un\r
1,0000 x 16,8000\r
0.28 x 59.99\r
\r
Bollitos (10,50)\r
\r
\r
\r
\r
\r
\r
23,99\r
32,69\r
79,9\r
49,99\r
\r
55,99\r
\r
87,19\r
\r
44,99\r
\r
16,80\r
\r
24,49\r
416,12\r
\r
\r
\r
\f\r
`

const test3 = `1/4 TRASERO SOYCHU (10.50) 98.89

202148000000 1.350 X 29.99

PAPA ELEGIDA SUELT (10.50) 40.49
SUBTOT. 139.34

TOTAL. 139. 34

`

describe('ASSERT Testing ticketParser with different inputs', function(){
    it('Extract TOTAL from last line in multiline text - LA GALLEGA Ticket - Pure Result.', function()
    {
        var result = ticketParser.analizeTotalValue(test1);
        assert.equal(result, 176.74);
    });

    it('Extract TOTAL from last line in multiline text - LA GALLEGA Ticket - Mixed Result.', function()
    {
        var result = ticketParser.analizeTotalValue(test3);
        assert.equal(result, 139.34);
    });

    it('Extract TOTAL from last line in multiline text - CAMILA Ticket', function()
    {
        var result = ticketParser.analizeTotalValue(test2);
        assert.equal(result, 416.12);
    });
});


/*const categorizeTest = [
    "Mayonesa",
    "Choclo",
    "PAPA ELEGIDA SUELTA",
    "Papel Higiénico"
]
*/

describe('ASSERT Testing ticketParser classification with filtered lists', function (){

    it('Classify groceries from a LA GALLEGA OCR Result', function(done){
        ticketParser.initialize().then(()=>{
            ticketParser.classifyEntries(test1);            
            done();
        });                
    });
    it('Classify groceries from CAMILA\'S MARKET Result', function(done){
        ticketParser.initialize().then(()=>{
            ticketParser.classifyEntries(test2);            
            done();
        });
    });
    it('Classify groceries from a second LA GALLEGA OCR Result', function(done){
        ticketParser.initialize().then(()=>{
            ticketParser.classifyEntries(test3);            
            done();
        });                
    });
});