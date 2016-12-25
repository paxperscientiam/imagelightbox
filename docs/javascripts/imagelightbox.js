//
// By Osvaldas Valutis, www.osvaldas.info
// Available for use under the MIT License
//
;(function ($, window, document, undefined) {
    'use strict';
    if (!$.Osvaldas ) {
        $.Osvaldas = {};
    }

    $.Osvaldas.imageLightbox = function (element, opts) {
        this.el = element;
        this.$el = $(element);

        this.options = $.extend({},$.Osvaldas.imageLightbox.options, opts);

        this.init();
    };

    $.Osvaldas.imageLightbox.options = {
        selector:       'a[data-imagelightbox]',
        id:             'imagelightbox',
        allowedTypes:   'png|jpg|jpeg|gif',
        animationSpeed: 250,
        activity:       false,
        arrows:         false,
        button:         false,
        caption:        false,
        enableKeyboard: true,
        lockBody:       false,
        navigation:     false,
        overlay:        false,
        preloadNext:    true,
        quitOnEnd:      false,
        quitOnImgClick: false,
        quitOnDocClick: true,
        quitOnEscKey:   true
    };

    $.extend($.Osvaldas.imageLightbox.prototype, {
        init: function () {
            this.buildCache();
            this.bindEvents();
        },

        buildCache: function () {

        },
        bindEvents: function () {

        }

    });

    //wrapper
    $.fn.imageLightbox = function (options) {
        return new $.Osvaldas.imageLightbox(this, options);
    };

})(jQuery, window, document);
