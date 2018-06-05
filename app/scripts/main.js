// Sticky Plugin v1.0.3 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 02/14/2011
// Date: 07/20/2015
// Website: http://stickyjs.com/
// Description: Makes an element on the page stick on the screen as you scroll
//              It will only set the 'top' and 'position' of your element, you
//              might need to adjust the width in some cases.
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
})(function ($) {
    var slice = Array.prototype.slice;
    // save ref to original slice()
    var splice = Array.prototype.splice;
    // save ref to original slice()
    var defaults = {
        topSpacing: 0,
        bottomSpacing: 0,
        className: 'is-sticky',
        wrapperClassName: 'sticky-wrapper',
        center: false,
        getWidthFrom: '',
        widthFromWrapper: true,
        // works only when .getWidthFrom is empty
        responsiveWidth: false
    }, $window = $(window), $document = $(document), sticked = [], windowHeight = $window.height(), scroller = function () {
        var scrollTop = $window.scrollTop(), documentHeight = $document.height(), dwh = documentHeight - windowHeight, extra = scrollTop > dwh ? dwh - scrollTop : 0;
        for (var i = 0, l = sticked.length; i < l; i++) {
            var s = sticked[i], elementTop = s.stickyWrapper.offset().top, etse = elementTop - s.topSpacing - extra;
            //update height in case of dynamic content
            s.stickyWrapper.css('height', s.stickyElement.outerHeight());
            if (scrollTop <= etse) {
                if (s.currentTop !== null) {
                    s.stickyElement.css({
                        width: '',
                        position: '',
                        top: ''
                    });
                    s.stickyElement.parent().removeClass(s.className);
                    s.stickyElement.trigger('sticky-end', [s]);
                    s.currentTop = null;
                }
            } else {
                var newTop = documentHeight - s.stickyElement.outerHeight() - s.topSpacing - s.bottomSpacing - scrollTop - extra;
                if (newTop < 0) {
                    newTop = newTop + s.topSpacing;
                } else {
                    newTop = s.topSpacing;
                }
                if (s.currentTop !== newTop) {
                    var newWidth;
                    if (s.getWidthFrom) {
                        newWidth = $(s.getWidthFrom).width() || null;
                    } else if (s.widthFromWrapper) {
                        newWidth = s.stickyWrapper.width();
                    }
                    if (newWidth == null) {
                        newWidth = s.stickyElement.width();
                    }
                    s.stickyElement.css('width', newWidth).css('position', 'fixed').css('top', newTop);
                    s.stickyElement.parent().addClass(s.className);
                    if (s.currentTop === null) {
                        s.stickyElement.trigger('sticky-start', [s]);
                    } else {
                        // sticky is started but it have to be repositioned
                        s.stickyElement.trigger('sticky-update', [s]);
                    }
                    if (s.currentTop === s.topSpacing && s.currentTop > newTop || s.currentTop === null && newTop < s.topSpacing) {
                        // just reached bottom || just started to stick but bottom is already reached
                        s.stickyElement.trigger('sticky-bottom-reached', [s]);
                    } else if (s.currentTop !== null && newTop === s.topSpacing && s.currentTop < newTop) {
                        // sticky is started && sticked at topSpacing && overflowing from top just finished
                        s.stickyElement.trigger('sticky-bottom-unreached', [s]);
                    }
                    s.currentTop = newTop;
                }
                // Check if sticky has reached end of container and stop sticking
                var stickyWrapperContainer = s.stickyWrapper.parent();
                var unstick = s.stickyElement.offset().top + s.stickyElement.outerHeight() >= stickyWrapperContainer.offset().top + stickyWrapperContainer.outerHeight() && s.stickyElement.offset().top <= s.topSpacing;
                if (unstick) {
                    s.stickyElement.css('position', 'absolute').css('top', '').css('bottom', 0);
                } else {
                    s.stickyElement.css('position', 'fixed').css('top', newTop).css('bottom', '');
                }
            }
        }
    }, resizer = function () {
        windowHeight = $window.height();
        for (var i = 0, l = sticked.length; i < l; i++) {
            var s = sticked[i];
            var newWidth = null;
            if (s.getWidthFrom) {
                if (s.responsiveWidth) {
                    newWidth = $(s.getWidthFrom).width();
                }
            } else if (s.widthFromWrapper) {
                newWidth = s.stickyWrapper.width();
            }
            if (newWidth != null) {
                s.stickyElement.css('width', newWidth);
            }
        }
    }, methods = {
        init: function (options) {
            var o = $.extend({}, defaults, options);
            return this.each(function () {
                var stickyElement = $(this);
                var stickyId = stickyElement.attr('id');
                var wrapperId = stickyId ? stickyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName;
                var wrapper = $('<div></div>').attr('id', wrapperId).addClass(o.wrapperClassName);
                stickyElement.wrapAll(wrapper);
                var stickyWrapper = stickyElement.parent();
                if (o.center) {
                    stickyWrapper.css({
                        width: stickyElement.outerWidth(),
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    });
                }
                if (stickyElement.css('float') === 'right') {
                    stickyElement.css({
                        'float': 'none'
                    }).parent().css({
                        'float': 'right'
                    });
                }
                o.stickyElement = stickyElement;
                o.stickyWrapper = stickyWrapper;
                o.currentTop = null;
                sticked.push(o);
                methods.setWrapperHeight(this);
                methods.setupChangeListeners(this);
            });
        },
        setWrapperHeight: function (stickyElement) {
            var element = $(stickyElement);
            var stickyWrapper = element.parent();
            if (stickyWrapper) {
                stickyWrapper.css('height', element.outerHeight());
            }
        },
        setupChangeListeners: function (stickyElement) {
            if (window.MutationObserver) {
                var mutationObserver = new window.MutationObserver(function (mutations) {
                    if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                        methods.setWrapperHeight(stickyElement);
                    }
                });
                mutationObserver.observe(stickyElement, {
                    subtree: true,
                    childList: true
                });
            } else {
                stickyElement.addEventListener('DOMNodeInserted', function () {
                    methods.setWrapperHeight(stickyElement);
                }, false);
                stickyElement.addEventListener('DOMNodeRemoved', function () {
                    methods.setWrapperHeight(stickyElement);
                }, false);
            }
        },
        update: scroller,
        unstick: function (options) {
            return this.each(function () {
                var that = this;
                var unstickyElement = $(that);
                var removeIdx = -1;
                var i = sticked.length;
                while (i-- > 0) {
                    if (sticked[i].stickyElement.get(0) === that) {
                        splice.call(sticked, i, 1);
                        removeIdx = i;
                    }
                }
                if (removeIdx !== -1) {
                    unstickyElement.unwrap();
                    unstickyElement.css({
                        width: '',
                        position: '',
                        top: '',
                        'float': ''
                    });
                }
            });
        }
    };
    // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
    if (window.addEventListener) {
        window.addEventListener('scroll', scroller, false);
        window.addEventListener('resize', resizer, false);
    } else if (window.attachEvent) {
        window.attachEvent('onscroll', scroller);
        window.attachEvent('onresize', resizer);
    }
    $.fn.sticky = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.sticky');
        }
    };
    $.fn.unstick = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.unstick.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.sticky');
        }
    };
    $(function () {
        setTimeout(scroller, 0);
    });
});

/*!
 * parallax.js v1.4.2 (http://pixelcog.github.io/parallax.js/)
 * @copyright 2016 PixelCog, Inc.
 * @license MIT (https://github.com/pixelcog/parallax.js/blob/master/LICENSE)
 */
!function (t, i, e, s) {
    function o(i, e) {
        var h = this;
        'object' == typeof e && (delete e.refresh, delete e.render, t.extend(this, e)),
            this.$element = t(i), !this.imageSrc && this.$element.is('img') && (this.imageSrc = this.$element.attr('src'));
        var r = (this.position + '').toLowerCase().match(/\S+/g) || [];
        if (r.length < 1 && r.push('center'), 1 == r.length && r.push(r[0]), ('top' == r[0] || 'bottom' == r[0] || 'left' == r[1] || 'right' == r[1]) && (r = [r[1], r[0]]),
            this.positionX != s && (r[0] = this.positionX.toLowerCase()), this.positionY != s && (r[1] = this.positionY.toLowerCase()),
            h.positionX = r[0], h.positionY = r[1], 'left' != this.positionX && 'right' != this.positionX && (this.positionX = isNaN(parseInt(this.positionX)) ? 'center' : parseInt(this.positionX)),
            'top' != this.positionY && 'bottom' != this.positionY && (this.positionY = isNaN(parseInt(this.positionY)) ? 'center' : parseInt(this.positionY)),
            this.position = this.positionX + (isNaN(this.positionX) ? '' : 'px') + ' ' + this.positionY + (isNaN(this.positionY) ? '' : 'px'),
            navigator.userAgent.match(/(iPod|iPhone|iPad)/)) return this.imageSrc && this.iosFix && !this.$element.is('img') && this.$element.css({
                backgroundImage: 'url(' + this.imageSrc + ')',
                backgroundSize: 'cover',
                backgroundPosition: this.position
            }), this;
        if (navigator.userAgent.match(/(Android)/)) return this.imageSrc && this.androidFix && !this.$element.is('img') && this.$element.css({
            backgroundImage: 'url(' + this.imageSrc + ')',
            backgroundSize: 'cover',
            backgroundPosition: this.position
        }), this;
        this.$mirror = t('<div />').prependTo('body');
        var a = this.$element.find('>.parallax-slider'), n = !1;
        0 == a.length ? this.$slider = t('<img />').prependTo(this.$mirror) : (this.$slider = a.prependTo(this.$mirror),
            n = !0), this.$mirror.addClass('parallax-mirror').css({
                visibility: 'hidden',
                zIndex: this.zIndex,
                position: 'fixed',
                top: 0,
                left: 0,
                overflow: 'hidden'
            }), this.$slider.addClass('parallax-slider').one('load', function () {
                h.naturalHeight && h.naturalWidth || (h.naturalHeight = this.naturalHeight || this.height || 1,
                    h.naturalWidth = this.naturalWidth || this.width || 1), h.aspectRatio = h.naturalWidth / h.naturalHeight,
                    o.isSetup || o.setup(), o.sliders.push(h), o.isFresh = !1, o.requestRender();
            }), n || (this.$slider[0].src = this.imageSrc), (this.naturalHeight && this.naturalWidth || this.$slider[0].complete || a.length > 0) && this.$slider.trigger('load');
    }
    function h(s) {
        return this.each(function () {
            var h = t(this), r = 'object' == typeof s && s;
            this == i || this == e || h.is('body') ? o.configure(r) : h.data('px.parallax') ? 'object' == typeof s && t.extend(h.data('px.parallax'), r) : (r = t.extend({}, h.data(), r),
                h.data('px.parallax', new o(this, r))), 'string' == typeof s && ('destroy' == s ? o.destroy(this) : o[s]());
        });
    }
    !function () {
        for (var t = 0, e = ['ms', 'moz', 'webkit', 'o'], s = 0; s < e.length && !i.requestAnimationFrame; ++s) i.requestAnimationFrame = i[e[s] + 'RequestAnimationFrame'],
            i.cancelAnimationFrame = i[e[s] + 'CancelAnimationFrame'] || i[e[s] + 'CancelRequestAnimationFrame'];
        i.requestAnimationFrame || (i.requestAnimationFrame = function (e) {
            var s = new Date().getTime(), o = Math.max(0, 16 - (s - t)), h = i.setTimeout(function () {
                e(s + o);
            }, o);
            return t = s + o, h;
        }), i.cancelAnimationFrame || (i.cancelAnimationFrame = function (t) {
            clearTimeout(t);
        });
    }(), t.extend(o.prototype, {
        speed: .2,
        bleed: 0,
        zIndex: -100,
        iosFix: !0,
        androidFix: !0,
        position: 'center',
        overScrollFix: !1,
        refresh: function () {
            this.boxWidth = this.$element.outerWidth(), this.boxHeight = this.$element.outerHeight() + 2 * this.bleed,
                this.boxOffsetTop = this.$element.offset().top - this.bleed, this.boxOffsetLeft = this.$element.offset().left,
                this.boxOffsetBottom = this.boxOffsetTop + this.boxHeight;
            var t = o.winHeight, i = o.docHeight, e = Math.min(this.boxOffsetTop, i - t), s = Math.max(this.boxOffsetTop + this.boxHeight - t, 0), h = this.boxHeight + (e - s) * (1 - this.speed) | 0, r = (this.boxOffsetTop - e) * (1 - this.speed) | 0;
            if (h * this.aspectRatio >= this.boxWidth) {
                this.imageWidth = h * this.aspectRatio | 0, this.imageHeight = h, this.offsetBaseTop = r;
                var a = this.imageWidth - this.boxWidth;
                this.offsetLeft = 'left' == this.positionX ? 0 : 'right' == this.positionX ? -a : isNaN(this.positionX) ? -a / 2 | 0 : Math.max(this.positionX, -a);
            } else {
                this.imageWidth = this.boxWidth, this.imageHeight = this.boxWidth / this.aspectRatio | 0,
                    this.offsetLeft = 0;
                var a = this.imageHeight - h;
                this.offsetBaseTop = 'top' == this.positionY ? r : 'bottom' == this.positionY ? r - a : isNaN(this.positionY) ? r - a / 2 | 0 : r + Math.max(this.positionY, -a);
            }
        },
        render: function () {
            var t = o.scrollTop, i = o.scrollLeft, e = this.overScrollFix ? o.overScroll : 0, s = t + o.winHeight;
            this.boxOffsetBottom > t && this.boxOffsetTop <= s ? (this.visibility = 'visible',
                this.mirrorTop = this.boxOffsetTop - t, this.mirrorLeft = this.boxOffsetLeft - i,
                this.offsetTop = this.offsetBaseTop - this.mirrorTop * (1 - this.speed)) : this.visibility = 'hidden',
                this.$mirror.css({
                    transform: 'translate3d(0px, 0px, 0px)',
                    visibility: this.visibility,
                    top: this.mirrorTop - e,
                    left: this.mirrorLeft,
                    height: this.boxHeight,
                    width: this.boxWidth
                }), this.$slider.css({
                    transform: 'translate3d(0px, 0px, 0px)',
                    position: 'absolute',
                    top: this.offsetTop,
                    left: this.offsetLeft,
                    height: this.imageHeight,
                    width: this.imageWidth,
                    maxWidth: 'none'
                });
        }
    }), t.extend(o, {
        scrollTop: 0,
        scrollLeft: 0,
        winHeight: 0,
        winWidth: 0,
        docHeight: 1 << 30,
        docWidth: 1 << 30,
        sliders: [],
        isReady: !1,
        isFresh: !1,
        isBusy: !1,
        setup: function () {
            if (!this.isReady) {
                var s = t(e), h = t(i), r = function () {
                    o.winHeight = h.height(), o.winWidth = h.width(), o.docHeight = s.height(), o.docWidth = s.width();
                }, a = function () {
                    var t = h.scrollTop(), i = o.docHeight - o.winHeight, e = o.docWidth - o.winWidth;
                    o.scrollTop = Math.max(0, Math.min(i, t)), o.scrollLeft = Math.max(0, Math.min(e, h.scrollLeft())),
                        o.overScroll = Math.max(t - i, Math.min(t, 0));
                };
                h.on('resize.px.parallax load.px.parallax', function () {
                    r(), o.isFresh = !1, o.requestRender();
                }).on('scroll.px.parallax load.px.parallax', function () {
                    a(), o.requestRender();
                }), r(), a(), this.isReady = !0;
            }
        },
        configure: function (i) {
            'object' == typeof i && (delete i.refresh, delete i.render, t.extend(this.prototype, i));
        },
        refresh: function () {
            t.each(this.sliders, function () {
                this.refresh();
            }), this.isFresh = !0;
        },
        render: function () {
            this.isFresh || this.refresh(), t.each(this.sliders, function () {
                this.render();
            });
        },
        requestRender: function () {
            var t = this;
            this.isBusy || (this.isBusy = !0, i.requestAnimationFrame(function () {
                t.render(), t.isBusy = !1;
            }));
        },
        destroy: function (e) {
            var s, h = t(e).data('px.parallax');
            for (h.$mirror.remove(), s = 0; s < this.sliders.length; s += 1) this.sliders[s] == h && this.sliders.splice(s, 1);
            t(e).data('px.parallax', !1), 0 === this.sliders.length && (t(i).off('scroll.px.parallax resize.px.parallax load.px.parallax'),
                this.isReady = !1, o.isSetup = !1);
        }
    });
    var r = t.fn.parallax;
    t.fn.parallax = h, t.fn.parallax.Constructor = o, t.fn.parallax.noConflict = function () {
        return t.fn.parallax = r, this;
    }, t(e).on('ready.px.parallax.data-api', function () {
        t('[data-parallax="scroll"]').parallax();
    });
}(jQuery, window, document);

$(document).ready(function () {
    var position;
    var year = '';
    function actualDate() {
        var dateNow = new Date();
        year = dateNow.getFullYear();
        $('.date').html(year);
    }
    actualDate();
    $('.nav li').on('click', function () {
        $('.navbar-collapse').removeClass('in');
        $(this).removeClass('animated pulse');
        $(this).addClass('animated bounce');
    });
    $('.nav li').mouseenter(function () {
        $(this).addClass('navOnHover', 400);
        $(this).addClass('animated pulse');
    }).mouseout(function () {
        $(this).removeClass('navOnHover', 200);
        $(this).removeClass('animated bounce');
        $(this).removeClass('animated pulse');
    });
    $('body li a').on('click', function (event) {
        event.preventDefault();
        console.log(event.target.id);
        if (event.target.id === 'port') {
            position = $('#portfolio').offset();
            $('html, body').animate({
                scrollTop: position.top
            }, 1e3, 'linear');
        } else if (event.target.id === 'hm' || event.target.id === 'logo') {
            position = $('#top').offset();
            $('html, body').animate({
                scrollTop: position.top
            }, 1e3, 'linear');
        } else if (event.target.id === 'ab') {
            position = $('#about').offset();
            $('html, body').animate({
                scrollTop: position.top
            }, 1e3, 'linear');
        } else if (event.target.id === 'ct') {
            position = $('#foot').offset();
            $('html, body').animate({
                scrollTop: position.top
            }, 1e3, 'linear');
        }
    });
    $('.navbar-inverse').sticky({
        topSpacing: 0
    });
    $(window).on('scroll', function () {
        if ((document.documentElement.scrollTop || document.body.scrollTop) > 0 && (document.documentElement.scrollTop || document.body.scrollTop) < 580) {
            $('li a.hm').addClass('active');
            $('li a.ab').removeClass('active');
            $('li a.port').removeClass('active');
            $('li a.ct').removeClass('active');
        } else if ((document.documentElement.scrollTop || document.body.scrollTop) >= 580 && (document.documentElement.scrollTop || document.body.scrollTop) < 1385) {
            $('li a.port').removeClass('active');
            $('li a.hm').removeClass('active');
            $('li a.ab').addClass('active');
            $('li a.ct').removeClass('active');
        } else if ((document.documentElement.scrollTop || document.body.scrollTop) >= 1385 && (document.documentElement.scrollTop || document.body.scrollTop) < 3270) {
            $('li a.port').addClass('active');
            $('li a.hm').removeClass('active');
            $('li a.ab').removeClass('active');
            $('li a.ct').removeClass('active');
        } else if ((document.documentElement.scrollTop || document.body.scrollTop) >= 3270) {
            $('li a.ct').addClass('active');
            $('li a.hm').removeClass('active');
            $('li a.ab').removeClass('active');
            $('li a.port').removeClass('active');
        }
    });
});