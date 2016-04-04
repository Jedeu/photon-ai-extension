'use strict';
/* globals $:false, chrome:false, console:false */

$(function() {

  const iconWidth = 38;
  const MIN_WIDTH = 150;
  const MIN_HEIGHT = 150;

  // on document ready, checks if user is logged in, then displays the button accordingly
  chrome.storage.sync.get(function(value) {
    if (value.user_id) {
      monitorHover();
    } else {
      removeZeButtonz();
    }
  });

  function monitorHover() {

    $('body').on('mouseenter', 'img', function() {
      
      var $zeImg = $(this);
      // var imagePath = $zeImg.attr('src')
      // console.log($zeImg[0].height);
      var imageObj = {
        url: $zeImg.attr('src'),
        height: $zeImg[0].width,
        width: $zeImg[0].height
      };
      var outerDiv = $('<div>').addClass('outer');
      if (($zeImg[0].width > MIN_WIDTH && $zeImg[0].height > MIN_HEIGHT) && ($zeImg.closest('.outer').length === 0)) {
        $(this).wrap(outerDiv);
      }
      var $imgContainer = $(this).closest('.outer');

      if ($imgContainer.children('.flip-img').length === 0) {
        addZeButton($imgContainer);
      } else {
        $imgContainer.children('div').show();
      }

      $(".flip-img").hover(function(){
        if ($(this).data('clicked')) {
          return;
        } else {
          $(this).children('.card-img').addClass("flipped");
          return false;  
        }
      }, function() {
        if ($(this).data('clicked')) {
          return;
        } else {
          $(this).children('.card-img').removeClass("flipped");
          return false;  
        } 
      });

      addClickListener($imgContainer, imageObj);

    });

    $('body').on('mouseleave', '.outer', function() {
      $(this).children('div').hide();
    });
  }

  // adds the photonAI button to the image container
  function addZeButton($imgContainer) {
    var logoURL = chrome.extension.getURL('images/logo-' + iconWidth + '.png');
    var plusURL = chrome.extension.getURL('images/plus-' + iconWidth + '.png');
    var $cardFront = $('<div>').addClass('face front').css({ 'background-image': 'url("' + logoURL + '")' });
    var $cardBack = $('<div>').addClass('face back').css({ 'background-image': 'url("' + plusURL + '")' });

    $imgContainer.prepend($('<div>', { class: 'flip-img' }));
    var $cardContainer = $imgContainer.children('.flip-img');
    $cardContainer.append($('<div>', { class: 'card-img' }));
    $cardContainer.children('.card-img').append($cardFront);
    $cardContainer.children('.card-img').append($cardBack);
  }

  function addClickListener($imgContainer, imageObj) {

    $imgContainer.find('.flip-img').one('click', function(e) {
      
      e.preventDefault();
      var $zeButtonBack = $(this).find('.face.back');
      var checkURL = chrome.extension.getURL('/images/check-' + iconWidth + '.png');

      $(this).attr('data-clicked', 'true');

      chrome.runtime.onMessage.addListener(function(req) {
        if (req) {
          $zeButtonBack.css({'background-image': 'url("' + checkURL + '")'});
        }
      });

      sendImage(imageObj);

    });
  }

  function sendImage(imgObj) {
    chrome.runtime.sendMessage({ url: imgObj.url, width: imgObj.width, height: imgObj.height });
  }

  function removeZeButtonz() {
    $('.outer').remove();
  }

});
