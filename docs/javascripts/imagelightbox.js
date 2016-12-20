//
// By Osvaldas Valutis, www.osvaldas.info
// Available for use under the MIT License
//
;(function ($, window, document, undefined) {
    'use strict';
    // COMPONENTS //
    var $activityObject = $('<div/>')
            .attr('id','imagelightbox-loading')
            .append($('<div/>')),
        $arrowLeftObject = $('<button/>',{
            type: 'button',
            class: 'imagelightbox-arrow imagelightbox-arrow-left'}),
        $arrowRightObject = $('<button/>',{
            type: 'button',
            class: 'imagelightbox-arrow imagelightbox-arrow-right'}),
        $arrows = $arrowLeftObject.add($arrowRightObject),
        $captionObject = $('<div/>', {
            id: 'imagelightbox-caption',
            html: "&nbsp;"
        }),
        $buttonObject =  $('<a/>', {
            id: 'imagelightbox-close'
        }),
        $overlayObject = $('<div/>', {
            id:'imagelightbox-overlay'
        }),
        $navItem = $('<a/>', {
            href:'#',class:"imagelightbox-navitem"
        }),
        $navObject = $('<div/>', {
            id: 'imagelightbox-nav'
        }),
        $wrapper = $('<div/>', {
            id: 'imagelightbox-wrapper'
        });

    var cssTransitionSupport = function () {
            var s = document.body || document.documentElement;
            s = s.style;
            if (s.WebkitTransition === '') {
                return '-webkit-';
            }
            if (s.MozTransition === '') {
                return '-moz-';
            }
            if (s.OTransition === '') {
                return '-o-';
            }
            if (s.transition === '') {
                return '';
            }
            return false;
        },

        isCssTransitionSupport = cssTransitionSupport() !== false,

        cssTransitionTranslateX = function (element, positionX, speed) {
            var options = {}, prefix = cssTransitionSupport();
            options[prefix + 'transform'] = 'translateX(' + positionX + ')';
            options[prefix + 'transition'] = prefix + 'transform ' + speed + 's linear';
            element.css(options);
        },

        hasTouch = ( 'ontouchstart' in window ),
        hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
        wasTouched = function (event) {
            if (hasTouch) {
                return true;
            }

            if (!hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined') {
                return false;
            }

            if (typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined') {
                if (event.MSPOINTER_TYPE_MOUSE !== event.pointerType) {
                    return true;
                }
            }
            else if (event.pointerType !== 'mouse') {
                return true;
            }

            return false;
        };

    $.fn.imageLightbox = function (opts) {
        var options = $.extend({
                selector:       'a[data-imagelightbox]',
                id:             'imagelightbox',
                allowedTypes:   'png|jpg|jpeg|gif', // TODO make it work again
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
            }, opts),
            _onStart = function () {
                if (options.arrows) {
                    arrowsOn(this);
                }
                if (options.navigation) {
                    navigationOn(this, options.selector);
                }
                if (options.overlay) {
                    overlayOn();
                }
                if (options.button) {
                    closeButtonOn();
                }
                if (options.caption) {
                    $wrapper.append($captionObject);
                }
            },
            _onLoadStart = function () {
                if (options.activity) {
                    activityIndicatorOn();
                }
                if (options.caption) {
                    captionReset();
                }

            },
            _onLoadEnd = function () {
                if (options.activity) {
                    activityIndicatorOff();
                }
                if (options.arrows) {
                    $arrows.css('display', 'block');
                }
                if (options.navigation) {
                    navigationUpdate(options.selector);
                }

            },
            _previousTarget = function () {
                $wrapper.trigger("previous.ilb2");
                var targetIndex = targets.index(target) - 1;
                if (targetIndex < 0) {
                    if (options.quitOnEnd === true) {
                        _quitImageLightbox();
                        return false;
                    }
                    else {
                        targetIndex = targets.length - 1;
                    }
                }
                target = targets.eq(targetIndex);
                _loadImage(-1);
            },
            _nextTarget = function () {
                $wrapper.trigger("next.ilb2");
                var targetIndex = targets.index(target) + 1;
                if (targetIndex >= targets.length) {
                    if (options.quitOnEnd === true) {
                        _quitImageLightbox();
                        return false;
                    }
                    else {
                        targetIndex = 0;
                    }
                }
                target = targets.eq(targetIndex);
                _loadImage(+1);
            },
            activityIndicatorOn = function () {
                $wrapper.append($activityObject);
            },
            activityIndicatorOff = function () {
                $('#imagelightbox-loading').remove();
            },
            overlayOn = function () {
                $wrapper.append($overlayObject);
            },
            closeButtonOn = function () {
                $buttonObject.appendTo($wrapper).on('click.ilb7', function () {
                    _quitImageLightbox();
                    return false;
                });
            },
            captionReset = function () {
                $captionObject.html("&nbsp;");
                if ($(target).data("ilb2-caption")) {
                    $captionObject.html($(target).data("ilb2-caption"));
                } else if ($(target).find('img').length > 0) {
                    $captionObject.html($(target).find('img').attr('alt'));
                }
            },
            navigationOn = function () {
                var images = targets;
                if (images.length) {
                    for (var i = 0; i < images.length; i++) {
                        $navObject.append($navItem.clone());
                    }
                    $wrapper.append($navObject);
                    $navObject.on('click.ilb7 touchend.ilb7', function () {
                        return false;
                    });
                    var navItems = $navObject.find('a');
                    navItems.on('click.ilb7 touchend.ilb7', function () {
                        var $this = $(this);
                        if (images.eq($this.index()).attr('href') !== $('#imagelightbox').attr('src')) {
                            var tmpTarget = targets.eq($this.index());
                            if (tmpTarget.length) {
                                var currentIndex = targets.index(target);
                                target = tmpTarget;
                                _loadImage($this.index() < currentIndex ? -1 : 1);
                            }
                        }
                        navItems.removeClass('active');
                        navItems.eq($this.index()).addClass('active');
                        return false;
                    }).on('touchend.ilb7', function () {
                        return false;
                    });
                }
            },
            navigationUpdate = function () {
                var items = $navObject.find('a');
                items.removeClass('active');
                items.eq(targets.index(target)).addClass('active');
            },
            arrowsOn = function () {
                $wrapper.append($arrows);
                $arrows.on('click.ilb7 touchend.ilb7', function (e) {
                    e.preventDefault();
                    if ($(this).hasClass('imagelightbox-arrow-left')) {
                        _previousTarget();
                    } else {
                        _nextTarget();
                    }
                    return false;
                });
            },
            targetSet = "",
            targets = $([]),
            target = $(),
            image = new Image(),
            imageWidth = 0,
            imageHeight = 0,
            swipeDiff = 0,

            isTargetValid = function (validImage) {
                var allowedTypes = options.allowedTypes;

                //test that RegExp is restricted to disjunction format
                var isGoodRE = /^(?!\|)[\w\|]+(?!\|)$/.test(allowedTypes);
                //
                if (!isGoodRE) {
                    //allowedTypes = 'png|jpg|jpeg|gif';
                    return false;
                }
                //
                var URL = validImage.attr("href");
                var ext = parseURL(URL).pathname;
                var re = new RegExp(allowedTypes,"i");
                //
                var isAllowed = re.test(ext);
                // function by Cory LaViska
                function parseURL(url) {
                    var parser = document.createElement('a'),
                        searchObject = {},
                        queries, split, i;
                    // Let the browser do the work
                    parser.href = url;
                    // Convert query string to object
                    queries = parser.search.replace(/^\?/, '').split('&');
                    for( i = 0; i < queries.length; i++ ) {
                        split = queries[i].split('=');
                        searchObject[split[0]] = split[1];
                    }
                    return {
                        protocol: parser.protocol,
                        host: parser.host,
                        hostname: parser.hostname,
                        port: parser.port,
                        pathname: parser.pathname,
                        search: parser.search,
                        searchObject: searchObject,
                        hash: parser.hash
                    };
                }
                return isAllowed;
            },
            // TODO make it work again
            // isTargetValid = function (element) {
            //   var classic = $(element).prop('tagName').toLowerCase() === 'a' && ( new RegExp('.(' + options.allowedTypes + ')$', 'i') ).test($(element).attr('href'));
            //   var html5 = $(element).attr('data-lightbox') !== undefined;
            //   return classic || html5;
            // },

            _getSetImage = function () {
                var imgPath = target.attr('href');
		return new Promise(function(resolve, reject){
		    image.id = options.id;
		    image.src = imgPath;
		    //
                    image.onload = function () {
                        resolve();
                    };
                    image.onerror = function () {
                        reject(image.src);
                    };
		});
	    },
            _size = function () {
                var captionHeight = $captionObject.outerHeight();
                var screenWidth = $(window).width() * 0.8,
                    wHeight = ((window.innerHeight) ? window.innerHeight : $(window).height()) - captionHeight,
                    screenHeight = wHeight * 0.9,
                    tmpImage = new Image(),
                    obj = {};

                tmpImage.src = image.src;
                imageWidth = tmpImage.width;
                imageHeight = tmpImage.height;
                //
                //
                if (imageWidth > screenWidth || imageHeight > screenHeight) {
                    var ratio = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
                    imageWidth /= ratio;
                    imageHeight /= ratio;
                }

                obj.width = imageWidth;
                obj.height = imageHeight;
                obj.top = ( wHeight - imageHeight ) / 2;
                obj.left = ( $(window).width() - imageWidth ) / 2;
                return obj;
            },
            _loadImage = function (direction) {
                _onLoadStart();
                _removeImage();
                _getSetImage().then(
                    function (success) {
                        var dim = _size();
		        $(image).css({
                            'width': dim.width + 'px',
                            'height': dim.height + 'px',
                            'top':  dim.top + 'px',
                            'left': dim.left + 'px'
                        });
                        $(image).css({'opacity': 0}).appendTo($wrapper);
                        $(image).animate({'opacity': 1},{
                            duration:options.animationSpeed});
                    },
		    function (failImage){
                        console.log("Image source "+ failImage + " failed to load!");
		    }
                )
                    .then(function (success) {
                        _onLoadEnd();
                    });
            },
            _removeImage = function () {
                $(image).remove();
            },

            _openImageLightbox = function ($target) {
                _onStart();
                $('body').append($wrapper);
                if (options.lockBody) {
                    $("body").addClass("imagelightbox-scroll-lock");
                }
                $wrapper.trigger("start.ilb2");
                target = $target;
                _loadImage(0);
            },

            _quitImageLightbox = function () {
                if (options.lockBody) {
                    $("body").removeClass("imagelightbox-scroll-lock");
                }
                $(image).animate({'opacity': 0},{
                    duration:options.animationSpeed,
                    complete: function () {
                        $(image).remove();
                        targets = $([]);
                        $wrapper.trigger("quit.ilb2");
                        $wrapper.remove().find("*").remove();
                    }
                });
            },

            _addTargets = function( newTargets ) {
                newTargets.on('click.ilb7', {set: targetSet}, function (e) {
                    e.preventDefault();
                    targetSet = $(e.currentTarget).data("imagelightbox");
                    filterTargets();
                    if (targets.length < 1) {
                        _quitImageLightbox();
                    } else {
                        _openImageLightbox($(this));
                    }
                });
                function filterTargets () {
                    newTargets
                        .filter(function () {
                            return $(this).data("imagelightbox") === targetSet;
                        })
                        .filter(function () {
                            return isTargetValid($(this));
                        })
                        .each(function () {
                            targets = targets.add($(this));
                        });
                }
            };
        $(window).on('resize.ilb7', function () {
            var dim = _size();
            $(image).css({
                            'width': dim.width + 'px',
                            'height': dim.height + 'px',
                            'top':  dim.top + 'px',
                            'left': dim.left + 'px'
            });
        }
        );



        $(document).ready(function() {
            if (options.quitOnDocClick) {
                $(document).on(hasTouch ? 'touchend.ilb7' : 'click.ilb7', function (e) {
                    if (image.length && !$(e.target).is(image)) {
                        e.preventDefault();
                        _quitImageLightbox();
                    }
                });
            }

            if (options.lockBody) {
                $(document).on('keydown.ilb7', function (e) {
                    if (!image.length) {
                        return true;
                    }
                    if([9,32,38,40].indexOf(e.which) > -1) {
                        e.preventDefault();
                        return false;
                    }
                });
            }

            if (options.enableKeyboard) {
                $(document).on('keyup.ilb7', function (e) {
                    if (!image.length) {
                        return true;
                    }
                    e.preventDefault();
                    if ([27].indexOf(e.which) > -1 && options.quitOnEscKey) {
                        _quitImageLightbox();
                    }
                    if ([37].indexOf(e.which) > -1) {
                        _previousTarget();
                    } else if ([39].indexOf(e.which) > -1) {
                        _nextTarget();
                    }
                });
            }
        });

        $(document).off('click', this.selector);

        _addTargets($(this));

        this.addToImageLightbox = function(elements)  {
            _addTargets(elements);
        };

        this.loadPreviousImage = function () {
            _previousTarget();
        };

        this.loadNextImage = function () {
            _nextTarget();
        };

        this.quitImageLightbox = function () {
            _quitImageLightbox();
            return this;
        };

        this.startImageLightbox = function () {
            $(this).trigger('click.ilb7');
        };

        return this;
    };
})(jQuery, window, document);
