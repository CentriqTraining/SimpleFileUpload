var remoteurl;
var dropZone;
var noDrop;
var drop;
var thumbnail;
var dropText = 'Drop file here...';
var progressText = 'Uploading file to server...';
var doneText = "Got it!"
var tooLargeText = "File too big...4 meg max";

$(function () {
    addDragTargetStylesheets();
})

function addDragTargetStylesheets() {
    var dropzoneCSS = '.drop-target{position:relative;height:55px;margin:25px 0 0 0;padding: 15px;max-width:25%;border: ridge 4px blue;border-radius:15px;font:12pt bold "Vollkorn"}.drop-text{text-align:center;vertical-align:middle}';

    //  Get the head element
    var head = $(window).head || document.getElementsByTagName('head')[0];

    //  Get the stylesheets attached to this page
    var styles = document.styleSheets;

    //  go through each stylesheet & rule looking for ".drop-target" 
    //  if you do not find...add it
    var foundcss = false;
    for (var i = 0; i < styles.length; i++) {
        var rules = styles[i].rules;
        for (var j = 0; j < rules.length; j++) {
            if (rules[j].selectorText == '.drop-target') {
                foundcss = true;
                break;
            }
            if (foundcss) {
                break;
            }
        }
    }

    if (!foundcss) {
        // Create the style element
        var style = document.createElement("style");
        style.type = "text/css";

        // set the css to the string created above.
        if (style.styleSheet) {
            style.styleSheet.cssText = dropzoneCSS;
        } else {
            style.appendChild(document.createTextNode(dropzoneCSS));
        }
        head.appendChild(style);
    }
}
function enableModalDragAndDropSupport(dropZoneSelecter, thumbnailImageSelecter, url) {
    dropZone = dropZoneSelecter;
    remoteurl = url;
    thumbnail = thumbnailImageSelecter;

    //register the drag drop events
    dropZone.on('dragenter', handleDragEnter);
    dropZone.on('dragover', handleDragOver);
    dropZone.on('drop', handleDragDrop);
    dropZone.on('fileUploadComplete', handleFileComplete);

    //Add a div inside the dropzone tag
    var droptext = $('.drop-text');

    if (droptext.length == 0) {
        var textdiv = document.createElement('span');
        textdiv.className = 'drop-text';
        dropZone.append(textdiv);
        dropZone.addClass('drop-target');
    }

    $('.drop-text').empty().text(dropText);

}
function handleFileComplete(e) {
    // detail.status
    $('.drop-text').text(doneText);
    $('.invisible').removeClass('invisible');
    thumbnail.attr('src', '/ContentFiles/Images/Thumbnails/' + e.detail.filename + ".png");
}

function handleDragEnter(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'; //Explicitly show this is a copy.
    }
}
function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy'; //Explicitly show this is a copy.
    }
}
function handleDragDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    console.log("dropped file")
    $('.drop-text').text(progressText);

    var files = evt.originalEvent.dataTransfer.files; //FileList object.

    if (files.length > 0) {
        uploadFile(files[0]);
    }
}
function uploadFile(file) {

    var output = [], filename = file.name;

    if (file.size > 6718592) {
        $('.drop-text').text(tooLargeText)
            .fadeToggle('fast').fadeToggle('fast')
            .fadeToggle('fast').fadeToggle('fast')
            .fadeToggle('fast').fadeToggle({
                duration: 400,
                done: function () {
                    $('.drop-text').text(dropText).fadeToggle('fast');;
                }
            });
        return;
    }
    //  trim the extension off 
    filename = filename.slice(0, -4);

    var upload = new FileReader();
    var svc = remoteurl + '?fileName=' + encodeURIComponent(filename);

    upload.onloadend = function (e) {
        output = e.target.result;
        $.ajax({
            url: svc, type: 'POST', data: output, cache: false,
            contentType: false, processData: false,
            complete: function (a) {

                //raise a fileUploadComplete event for each file
                //user can do what they want with it.
                if (a.status === 200) {
                    dropZone.trigger({
                        detail: {
                            filename: filename,
                            status: a.status,
                        },
                        type: 'fileUploadComplete',
                        message: 'successfully uploaded ' + filename,
                        time: new Date(),
                    });
                } else {
                    dropZone.trigger({
                        detail: {
                            filename: filename,
                            status: a.status,
                        },
                        type: 'fileUploadComplete',
                        message: 'Error uploading  ' + filename,
                        time: new Date(),
                    });
                }
            },
        });
    };
    upload.readAsArrayBuffer(file);
}



