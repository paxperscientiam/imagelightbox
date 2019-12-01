import '~/imagelightbox.css';

const PROJECT_NAME = 'imageLightbox';

import { ImageLightbox } from './imagelightbox';

$.fn.imageLightbox = Object.assign<any, ILBGlobalSettings>(
    function(this: JQuery, options: Partial<ILBOptions>): JQuery {
        // guard against double initialization
        if ($.data( this, PROJECT_NAME) != null) {
            return this;
        }

        // Here's a best practice for overriding 'defaults'
        // with specified options. Note how, rather than a
        // regular defaults object being passed as the second
        // parameter, we instead refer to $.fn.pluginName.options
        // explicitly, merging it with the options passed directly
        // to the plugin. This allows us to override options both
        // globally and on a per-call level.
        //   // Merge the global options with the options given as argument.
        const mergedOptions = {
            ...$.fn.imageLightbox.options,
            ...options,
        };

        this.each(() => {
            $.data( this, $.fn.imageLightbox.PROJECT_NAME, new ImageLightbox(mergedOptions, this) );
        });

        return this;
    },
    {
        PROJECT_NAME,

        options: {
            selector:       'a[data-imagelightbox]',
            id:             'imagelightbox',
            allowedTypes:   'png|jpg|jpeg|gif',
            animationSpeed: 250,
            activity:       false,
            arrows:         false,
            button:         false,
            caption:        false,
            enableKeyboard: true,
            history:        false,
            fullscreen:     false,
            gutter:         10,     // percentage of client height
            offsetY:        0,      // percentage of gutter
            navigation:     false,
            overlay:        false,
            preloadNext:    true,
            quitOnEnd:      false,
            quitOnImgClick: false,
            quitOnDocClick: true,
            quitOnEscKey:   true,
        },
    },
);
