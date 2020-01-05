var ImageEditor = require('tui-image-editor');
var instance = new ImageEditor(document.querySelector('#tui-image-editor'), {
    includeUI: {
        loadImage: {
            path: 'img/img1.jpeg',
            name: 'SampleTicket'
        },
        //theme: blackTheme, // or whiteTheme
        initMenu: 'filter',
        menuBarPosition: 'bottom'
    },
    cssMaxWidth: 700,
    cssMaxHeight: 1200,
    selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
    }
});

var btn = $('.tui-image-editor-download-btn');
btn.html("Upload");
btn.click(function(){
    alert("Button clicked!");
});