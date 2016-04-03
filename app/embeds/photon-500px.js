'use strict';
/* globals $:false, chrome:false, console:false */

$(function() {

  const iconWidth = 50;
  const horizontalDistanceFromWindow = 11;

  // on document ready, checks if user is logged in, then displays the button accordingly
  chrome.storage.sync.get(function(value) {
    if (value.user_id) {
      // home page
      addZeHoverEffect('.link');
      // discovery popular, upcoming
      addZeHoverEffect('.photo_link');
    } else {
      removeZeButtonz();
    }
  });

  // adds https to image path if not already there
  function iCanHazHttps(imagePath) {
    if (imagePath.match(/https/g) || imagePath.match(/http/g)) {
      return imagePath;
    }
    else {
      imagePath = 'https' + imagePath;
      return imagePath;
    }
  }

  // makes an invisible image in order to get dimensions of full size image
  function getNativeDimensions(imagePath, callback) {
      var completePath = iCanHazHttps(imagePath);
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
          callback(output);
      });
  }

  // parses styleAttrib string into a hash of styles
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

  // sends image url, width, and height to background script (popup.js)
  // popup.js can then send ajax request to the web app to add the photo to the database
  function sendImage(imgObj) {
      chrome.runtime.sendMessage({ url: imgObj.url, width: imgObj.width, height: imgObj.height });
  }

  // adds the photonAI button to the image container
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

  function addZeHoverEffect(hoverElementClass) {
    $('body').on('mouseenter', hoverElementClass, function() {
      if (hoverElementClass === '.link') {
        var $imgContainer = $(this).closest('.lazy-hidden');
      } else if (hoverElementClass === '.photo_link') {
        var $imgContainer = $(this).siblings('.photo_thumbnail__pulse_container');
      }
      if ($imgContainer.find('.flip').length === 0) {
        addZeButton($imgContainer);
        $imgContainer.find('.custom-icon-button').css({
          'top': '-10px',
          'right': ($(this).width() - iconWidth - horizontalDistanceFromWindow) + 'px'
        });
      } else {
        $imgContainer.children('.flip').children('div').show();
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

      if (hoverElementClass === '.link') {
        var styleAttrib = $imgContainer.attr('style');
        var imagePath = (createPhotoUrl(styleAttrib)).replace(/"/g, "");
      } else if (hoverElementClass === '.photo_link') {
        var imagePath = ($(this).children('img').attr('src')).replace(/"/g, "");
      }

      addClickListener($imgContainer, imagePath);

    });

    $('body').on('mouseleave', '.photo.lazy-hidden', function() {
      $(this).children('.flip').children('div').hide();
    });
  }

  function addClickListener($imgContainer, imagePath) { 
    $imgContainer.find('.flip').one('click', function() {
      var zeButtonBack = $(this).find('.face.back');
      var checkURL = chrome.extension.getURL('/images/check-' + iconWidth + '.png');

      $(this).attr('data-clicked', 'true');

      chrome.runtime.onMessage.addListener(function(req) {
          if (req) {
              zeButtonBack.css({'background-image': 'url("' + checkURL + '")'});
          }
      });

      getNativeDimensions(imagePath, sendImage);
    });
  }

  function removeZeButtonz() {
    $('.flip').remove();
  }

  // Still need to handle grabbing imgs from individual profile gallery

    // $('body').on('mouseenter', '.photo_link', function() {
  //   var $imgContainer = $(this).siblings('.photo_thumbnail__pulse_container');
  //   if ($imgContainer.find('.custom-icon-button').length != 0) {
  //       return;
  //   } else {
  //       addZeButton($imgContainer);
  //   }

  //   $imgContainer.children('.custom-icon-button').one('click', function() {
  //     // No idea why but couldn't traverse DOM the regular way...
  //     var imgUrl = $imgContainer.closest('.photo_link').context.firstElementChild.currentSrc;
  //     console.log(imgUrl); 
  //   });
    
  // });


});
