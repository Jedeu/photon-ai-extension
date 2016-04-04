'use strict';
/* globals $:false, chrome:false, console:false */

$(function(){

    // remember to change this in css too (i.e. for div dimensions)!
    const iconWidth = 38;

    // on document ready, check if user is logged in, then display the button accordingly
    chrome.storage.sync.get(function(value) {
        if (value.user_id) {
            monitorHover();
        } else {
            removeZeButtonz();
        }
    });
    
    // Add button animation
    function addZeButton($imgContainer) {
        var logoURL = chrome.extension.getURL('images/logo-' + iconWidth + '.png');
        var plusURL = chrome.extension.getURL('images/plus-' + iconWidth + '.png');
        var $cardFront = $('<div>').addClass('face front').css({ 'background-image': 'url("' + logoURL + '")' });
        var $cardBack = $('<div>').addClass('face back').css({ 'background-image': 'url("' + plusURL + '")' });

        $imgContainer.prepend($('<div>', { class: 'flip' }));
        var $cardContainer = $imgContainer.children('.flip');
        $cardContainer.append($('<div>', { class: 'card' }));
        $cardContainer.children('.card').append($cardFront);
        $cardContainer.children('.card').append($cardBack);
    }

    // Parses the styleAttrib string into a hash of styles
    function createStyleObj(styleAttrib) {
        var parts = styleAttrib.split("; ");
        var obj = {};
        for (var i = 0; i < parts.length; i++) {
            var subParts = parts[i].split(': ');
            obj[subParts[0]]=subParts[1];
        }
        return obj;
    }

    // Gets the photo URL from the style attribute of the photo container
    function createPhotoUrl(styleAttrib) {
        var cleanStyle = createStyleObj(styleAttrib);
        var photoUrl = cleanStyle['background-image'];
        var linkLinter = /\(([^\)]+)\)/;
        var theLink = ((photoUrl.match(linkLinter)[1]));
        return theLink;
    }

    // Determines if last underscore in url before .jpg is part of path or just an image size modifier
    function underscoresInPath(imagePath) {
       var underScoreFragment = imagePath.substring(imagePath.lastIndexOf("_") + 1, imagePath.lastIndexOf("."));
        // Flickr uses convention _ +  a letter to resize images via url
        return underScoreFragment.length > 1;
    }

    // makes an invisible image in order to get the dimensions of the full size image
    function getNativeDimensions(imagePath) {
        var completePath = 'https:' + imagePath + '_b.jpg';
        var output = {
            url: completePath,
            width: 0,
            height: 0
        };
        var $img = $('<img>').attr({
            src: completePath,
            id: 'photonParseSizeTarget'
        });
        $img.addClass('make-invis');
        $('body').append($img);
        $img.on('load', function(){
            var $zeImg = $(this);
            output.width = $zeImg.width();
            output.height = $zeImg.height();
            $(this).remove();
            sendImage(output);
        });
    }

    // sends image url, width, and height to background script (popup.js)
    // popup.js can then send ajax request to the web app to add the photo to the user's collection
    function sendImage(imgObj) {
        chrome.runtime.sendMessage({ url: imgObj.url, width: imgObj.width, height: imgObj.height });
    }

    function monitorHover() {
        // Body selector case for images wrapped in 'a' tags
        $('body').on('mouseenter', '.overlay', function() {
            var $imgContainer = $(this).closest('.photo-list-photo-interaction');
            if ($imgContainer.find('.flip').length !== 0) {
                return;
            } else {
                addZeButton($imgContainer);
            }

            $(".flip").hover(function(){
                if ($(this).data('clicked')) {
                    return;
                } else {
                    $(this).find(".card").addClass("flipped");
                    return false;  
                }
            }, function() {
              if ($(this).data('clicked')) {
                return;
              } else {
                $(this).find(".card").removeClass("flipped");
                return false;  
              }
            });

            var styleAttrib = $imgContainer.closest('.photo-list-photo-view').attr('style');

            addClickListener($imgContainer, styleAttrib);

        });
    }

    function addClickListener($imgContainer, styleAttrib) {
        $imgContainer.find('.flip').one('click', function() {
            var $flipDiv = $(this);
            var $zeButtonBack = $flipDiv.find('.face.back');
            var checkURL = chrome.extension.getURL('/images/check-' + iconWidth + '.png');
            var imagePath;
            if (styleAttrib) {
                imagePath = (createPhotoUrl(styleAttrib).replace(/"/g, ""));
            }
            else {
                // This case covers special a tags under "Trending"
                var $zeElem = ($flipDiv.closest('.photo-list-photo-interaction-view')).siblings('a').children('.photo');
                styleAttrib = $zeElem.attr('style');
                imagePath = (createPhotoUrl(styleAttrib).replace(/'/g, ""));
            }

            $flipDiv.attr('data-clicked', 'true');

            //If image path has more than one _, then take out the last _ and replace
            if (underscoresInPath(imagePath)) {
                imagePath = imagePath.replace(/\.jpg/g, "");
            } else {
                imagePath = imagePath.replace(/(_[a-z])(\.jpg+)$/g, "");
            }

            chrome.runtime.onMessage.addListener(function(req) {
                if (req) {
                    $zeButtonBack.css({'background-image': 'url("' + checkURL + '")'});
                }
            });

            getNativeDimensions(imagePath);

        });
    }

    function removeZeButtonz() {
      $('.outer').remove();
    }
});