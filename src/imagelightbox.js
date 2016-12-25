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
        this._name = "imageLightbox";
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
            this._addTargets();
            this._buildCache();
            //             this._buildLightbox();
            //             this._bindEvents();
        },
        _buildCache: function () {
            this.targetSet = "";
            this.targets = $([]);
            this.target = $();
            this.image = $();
            this.imageWidth = 0;
            this.imageHeight = 0;
            this.swipeDiff = 0;
            //
            this.$activityObject = $('<div/>')
                .attr('id','imagelightbox-loading')
                .append($('<div/>'));
            this.$arrowLeftObject = $('<button/>',{
                type: 'button',
                class: 'imagelightbox-arrow imagelightbox-arrow-left'});
            this.$arrowRightObject = $('<button/>',{
                type: 'button',
                class: 'imagelightbox-arrow imagelightbox-arrow-right'});
            this.$arrows = this.$arrowLeftObject.add(this.$arrowRightObject);
            this.$captionObject = $('<div/>', {
                id: 'imagelightbox-caption',
                html: "&nbsp;"
            });
            this.$buttonObject =  $('<a/>', {
                id: 'imagelightbox-close'
            });
            this.$overlayObject = $('<div/>', {
                id:'imagelightbox-overlay'
            });
            this.$navItem = $('<a/>', {
                href:'#',
                class:"imagelightbox-navitem"
            });
            this.$navObject = $('<div/>', {
                id: 'imagelightbox-nav'
            });
            this.$wrapper = $('<div/>', {
                id: 'imagelightbox-wrapper'
            });
        },
        _openImageLightbox: function ($target) {
            this.target = $target;
            $('body').append(this.$wrapper);
            if (this.lockBody) {
                $("body").addClass("imagelightbox-scroll-lock");
            }
            this.$wrapper.trigger("start.ilb2");
            this._loadImage(0);
        },
        _buildLightbox: function () {

        },
        _setImage: function (image) {

            var plugin = this;
            var imageWidth = this.imageWidth;
            var imageHeight = this.imageHeight;
            var captionHeight = this.$captionObject.outerHeight();

            var screenWidth = $(window).width() * 0.8,
                wHeight = ((window.innerHeight) ? window.innerHeight : $(window).height()) - captionHeight,
                screenHeight = wHeight * 0.9,
                tmpImage = new Image();

            tmpImage.src = image.attr('src');
            tmpImage.onload = function () {
                imageWidth = tmpImage.width;
                imageHeight = tmpImage.height;

                if (imageWidth > screenWidth || imageHeight > screenHeight) {
                    var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                    imageWidth /= ratio;
                    imageHeight /= ratio;
                }
                image.css({
                    'width': imageWidth + 'px',
                    'height': imageHeight + 'px',
                    'top': ( wHeight - imageHeight ) / 2 + 'px',
                    'left': ( $(window).width() - imageWidth ) / 2 + 'px'
                });
            };
        },
        _loadImage: function (direction) {
            var plugin = this;
            var options = this.options;
            var image = this.image;
            setTimeout(function () {
                var imgPath = plugin.target.attr('href');
                image = $('<img id="' + options.id + '" />')
                    .attr('src', imgPath)
                    .on('load.ilb7', function () {
                        $(image).appendTo(plugin.$wrapper);
                        plugin._setImage(image);
                    });
                //
            },options.animationSpeed + 100);
        },
        _quitImageLightbox: function () {
            this.unbindEvents();
            this.$element.removeData();
        },
        //
        _isTargetValid: function (validImage) {
            return true;
        },
        _addTargets: function () {
            var newTargets = this.$el;
            var plugin = this;
            //
            newTargets.on("click"+'.'+ plugin._name, function (e) {
                e.preventDefault();
                //
                plugin.targetSet = $(e.currentTarget).data("imagelightbox");
                filterTargets(plugin._isTargetValid,plugin);
                if (plugin.targets.length < 1) {
                    plugin._quitImageLightbox();
                } else {
                    plugin._openImageLightbox($(this));
                }
            });
            function filterTargets (check,plugin) {
                newTargets
                    .filter(function () {
                        return $(this).data("imagelightbox") === plugin.targetSet;
                    })
                    .filter(function () {
                        return check($(this));
                    })
                    .each(function () {
                        plugin.targets = plugin.targets.add($(this));
                    });
            }
        },
        _bindEvents: function () {
            var plugin = this;
            var options = this.options;
            var image = this.image;
            var hasTouch = ( 'ontouchstart' in window );
            //
            if (options.quitOnDocClick) {
                $(document).on(hasTouch ? 'touchend'+'.'+plugin._name : 'click'+'.'+plugin._name, function (e) {
                    if (image.length && !$(e.target).is(image)) {
                        e.preventDefault();
                        this._quitImageLightbox();
                    }
                });
            }
            if (options.lockBody) {
                $(document).on('keydown'+'.'+plugin._name, function (e) {
                    if([9,32,38,40].indexOf(e.which) > -1) {
                        e.preventDefault();
                    }
                });
            }
            if (options.enableKeyboard) {
                $(document).on('keyup.ilb7', function (e) {
                    e.preventDefault();
                    if ([27].indexOf(e.which) > -1 && options.quitOnEscKey) {
                        this._quitImageLightbox();
                    }
                    if ([37].indexOf(e.which) > -1) {
                        this._previousTarget();
                    } else if ([39].indexOf(e.which) > -1) {
                        this._nextTarget();
                    }
                });
            }
        },
        _unbindEvents: function () {
            this.$element.off('.'+this._name);
        }

    });

    $.extend($.Osvaldas.imageLightbox.prototype, {

        loadPreviousImage: function () {
            //   _previousTarget();
        },

        loadNextImage: function () {
            //   _nextTarget();
        },
        quitImageLightbox: function () {

        },
        startImageLightbox: function () {

        }
    });
    //wrapper
    $.fn.imageLightbox = function (options) {

        return new $.Osvaldas.imageLightbox(this, options);
    };

    return $.Osvaldas;

})(jQuery, window, document);
