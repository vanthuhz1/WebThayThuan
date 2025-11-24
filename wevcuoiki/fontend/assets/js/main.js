(function($) {
    "use strict";

    const $documentOn = $(document);
    const $windowOn = $(window);

    $documentOn.ready( function() {

        //>> Mobile Menu Js Start <<//
        $('#mobile-menu').meanmenu({
            meanMenuContainer: '.mobile-menu',
            meanScreenWidth: "1199",
            meanExpand: ['<i class="far fa-plus"></i>'],
        });

        //>> Sidebar Toggle Js Start <<//
        $(".offcanvas__close,.offcanvas__overlay").on("click", function() {
            $(".offcanvas__info").removeClass("info-open");
            $(".offcanvas__overlay").removeClass("overlay-open");
        });
        $(".sidebar__toggle").on("click", function() {
            $(".offcanvas__info").addClass("info-open");
            $(".offcanvas__overlay").addClass("overlay-open");
        });

        //>> Body Overlay Js Start <<//
        $(".body-overlay").on("click", function() {
            $(".offcanvas__area").removeClass("offcanvas-opened");
            $(".df-search-area").removeClass("opened");;
            $(".body-overlay").removeClass("opened");
        });

        //>> Sticky Header Js Start <<//

        $windowOn.on("scroll", function() {
            if ($(this).scrollTop() > 250) {
                $("#header-sticky").addClass("sticky");
            } else {
                $("#header-sticky").removeClass("sticky");
            }
        });

        // Sidebar Area Start <<//
        $(".share-btn").on("click", function() {
            var target = $(this).data("target");
            $("#" + target).toggle();
        });
        $("#openButton").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").removeClass("side_bar_hidden");
        });
        $("#openButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").removeClass("side_bar_hidden2");
        });
        $("#closeButton").on("click", function(e) {
            e.preventDefault();
            $("#targetElement").addClass("side_bar_hidden");
        });
        $("#closeButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement2").addClass("side_bar_hidden2");
        });

        // Sidebar Area-2 Start <<//
        $(".share-btn").on("click", function() {
            var target = $(this).data("target");
            $("#" + target).toggle();
        });
        $("#openButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement2").removeClass("side_bar_hidden2");
        });
        $("#openButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement2").removeClass("side_bar_hidden2");
        });
        $("#closeButton2").on("click", function(e) {
            e.preventDefault();
            $("#targetElement2").addClass("side_bar_hidden2");
        });
        
        //>> Video Popup Start <<//
        $(".img-popup").magnificPopup({
            type: "image",
            gallery: {
                enabled: true,
            },
        });

        $('.video-popup').magnificPopup({
            type: 'iframe',
            callbacks: {
            }
        });
        
        //>> Counterup Start <<//
        $(".count").counterUp({
            delay: 15,
            time: 4000,
        });

        //>> Wow Animation Start <<//
        new WOW().init();

        //>> Nice Select Start <<//
        $('select').niceSelect();

        //>> Scrolldown Start <<//
        $("#scrollDown").on("click", function () {
            setTimeout(function () {
                $("html, body").animate({ scrollTop: "+=1000px" }, "slow");
            }, 1000);
        });

         //>> Shop Slider Start <<//
         if($('.hero-image-slider').length > 0) {
            const heroImageSlider = new Swiper(".hero-image-slider", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
            });
        }

         //>> Hero-1 Slider Start <<//
         const sliderActive2 = ".hero-slider";
         const sliderInit2 = new Swiper(sliderActive2, {
             loop: true,
             slidesPerView: 1,
             effect: "fade",
             speed: 3000,
             autoplay: {
                 delay: 3000,
                 disableOnInteraction: false,
             },
             navigation: {
                nextEl: ".array-prev",
                prevEl: ".array-next",
            },
             pagination: {
                 el: ".dot",
                 clickable: true,
             },
         });
 
        function animated_swiper(selector, init) {
            const animated = function animated() {
                $(selector + " [data-animation]").each(function () {
                    let anim = $(this).data("animation");
                    let delay = $(this).data("delay");
                    let duration = $(this).data("duration");
                    $(this)
                        .removeClass("anim" + anim)
                        .addClass(anim + " animated")
                        .css({
                            webkitAnimationDelay: delay,
                            animationDelay: delay,
                            webkitAnimationDuration: duration,
                            animationDuration: duration,
                        })
                        .one("animationend", function () {
                            $(this).removeClass(anim + " animated");
                        });
                });
            };
            animated();
            init.on("slideChange", function () {
                $(sliderActive2 + " [data-animation]").removeClass("animated");
            });
            init.on("slideChange", animated);
        }
        animated_swiper(sliderActive2, sliderInit2);
      

        //>> Shop Slider Start <<//
        if($('.shop-slider').length > 0) {
            const shopSlider = new Swiper(".shop-slider", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: ".shop-dot",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 5,
                    },
                    991: {
                        slidesPerView: 4,
                    },
                    767: {
                        slidesPerView: 3,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

        //>> Product Slider Start <<//
        if($('.product-slider').length > 0) {
            const productSlider = new Swiper(".product-slider", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: ".product-dot",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 4,
                    },
                    991: {
                        slidesPerView: 3,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

        //>> Brand Slider Start <<//
        if($('.brand-slider').length > 0) {
            const brandSlider = new Swiper(".brand-slider", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                centeredSlides: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    prevEl: ".array-prev",
                    nextEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 5,
                    },
                    991: {
                        slidesPerView: 4,
                    },
                    767: {
                        slidesPerView: 3,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

        //>> Testimonial Slider Start <<//
        if($('.testimonial-slider').length > 0) {
            const testimonialSlider = new Swiper(".testimonial-slider", {
                spaceBetween: 30,
                speed: 2000,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: ".dot",
                    clickable: true,
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 2,
                    },
                    991: {
                        slidesPerView: 2,
                    },
                    767: {
                        slidesPerView: 1,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

         //>> Testimonial Slider2 Start <<//
         if($('.testimonial-slider-2').length > 0) {
            const testimonialSlider2 = new Swiper(".testimonial-slider-2", {
                spaceBetween: 30,
                speed: 2000,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 1,
                    },
                    991: {
                        slidesPerView: 1,
                    },
                    767: {
                        slidesPerView: 1,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

         //>> Testimonial Slider2 Start <<//
         if($('.testimonial-slider-3').length > 0) {
            const testimonialSlider3 = new Swiper(".testimonial-slider-3", {
                spaceBetween: 30,
                speed: 2000,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 3,
                    },
                    991: {
                        slidesPerView: 2,
                    },
                    767: {
                        slidesPerView: 1,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }
       
        //>> Instagram Slider Start <<//
        if($('.instagram-banner-slider').length > 0) {
            const instagrambannerSlider = new Swiper(".instagram-banner-slider", {
                spaceBetween: 30,
                speed: 2000,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1399: {
                        slidesPerView: 6,
                    },
                    1199: {
                        slidesPerView: 5,
                    },
                    991: {
                        slidesPerView: 4,
                    },
                    767: {
                        slidesPerView: 3,
                    },
                    650: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

         //>> Instagram Slider Start <<//
         if($('.instagram-banner-slider-2').length > 0) {
            const instagrambannerSlider2 = new Swiper(".instagram-banner-slider-2", {
                spaceBetween: 30,
                speed: 2000,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                breakpoints: {
                    1399: {
                        slidesPerView: 5,
                    },
                    1199: {
                        slidesPerView: 4,
                    },
                    991: {
                        slidesPerView: 3,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    650: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }
         //>> Category Slider Start <<//
         if($('.category-slider').length > 0) {
            const categorySlider = new Swiper(".category-slider", {
                spaceBetween: 20,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 4,
                    },
                    991: {
                        slidesPerView: 3,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

        //>> Product Slider Start <<//
        if($('.product-slider-2').length > 0) {
            const productSlider2 = new Swiper(".product-slider-2", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 1,
                    },
                    991: {
                        slidesPerView: 1,
                    },
                    767: {
                        slidesPerView: 1,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

        //>> Product Slider Start <<//
        if($('.news-slider').length > 0) {
            const newsSlider = new Swiper(".news-slider", {
                spaceBetween: 30,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 3,
                    },
                    991: {
                        slidesPerView: 2,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 1,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }


         //>> Shop Slider Start <<//
         if($('.shop-slider-4').length > 0) {
            const shopSlider4 = new Swiper(".shop-slider-4", {
                spaceBetween: 10,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                navigation: {
                    nextEl: ".array-prev",
                    prevEl: ".array-next",
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 3,
                    },
                    991: {
                        slidesPerView: 2,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

         //>> Shop Slider Start <<//
         if($('.discover-slider').length > 0) {
            const discoverSlider = new Swiper(".discover-slider", {
                spaceBetween: 10,
                speed: 1300,
                loop: true,
                autoplay: {
                    delay: 2000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: ".dot-5",
                    clickable: true,
                },
                breakpoints: {
                    1199: {
                        slidesPerView: 2,
                    },
                    991: {
                        slidesPerView: 2,
                    },
                    767: {
                        slidesPerView: 2,
                    },
                    575: {
                        slidesPerView: 2,
                    },
                    0: {
                        slidesPerView: 1,
                    },
                },
            });
        }

       
        //>> CountDown Start <<//
        let targetDate = new Date("2025-05-8 00:00:00").getTime();
        const countdownInterval = setInterval(function () {
            let currentDate = new Date().getTime();
            let remainingTime = targetDate - currentDate;

            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                // Display a message or perform any action when the countdown timer reaches zero
                $("#countdown-container").text("Countdown has ended!");
            } else {
                let days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
                let hours = Math.floor(
                    (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                let minutes = Math.floor(
                    (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
                );
                let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

                // Pad single-digit values with leading zeros
                $("#day").text(days.toString().padStart(2, "0"));
                $("#hour").text(hours.toString().padStart(2, "0"));
                $("#min").text(minutes.toString().padStart(2, "0"));
                $("#sec").text(seconds.toString().padStart(2, "0"));
            }
        }, 1000);

        //>> Search Popup Start <<//
        const $searchWrap = $(".search-wrap");
        const $navSearch = $(".nav-search");
        const $searchClose = $("#search-close");

        $(".search-trigger").on("click", function (e) {
            e.preventDefault();
            $searchWrap.animate({ opacity: "toggle" }, 500);
            $navSearch.add($searchClose).addClass("open");
        });

        $(".search-close").on("click", function (e) {
            e.preventDefault();
            $searchWrap.animate({ opacity: "toggle" }, 500);
            $navSearch.add($searchClose).removeClass("open");
        });

        function closeSearch() {
            $searchWrap.fadeOut(200);
            $navSearch.add($searchClose).removeClass("open");
        }

        $(document.body).on("click", function (e) {
            closeSearch();
        });

        $(".search-trigger, .main-search-input").on("click", function (e) {
            e.stopPropagation();
        });


    // Offer Modal
    $windowOn.on('load', function () {
        setTimeout(function () {
            const modal = $('#exampleModal');
            
            // Show the modal
            modal.modal('show');
            
            // Remove aria-hidden when the modal is shown
            modal.on('shown.bs.modal', function () {
                modal.removeAttr('aria-hidden');
                modal.find('[data-focus="true"]').focus(); // Focus on the first focusable element, if specified
            });

            // Add aria-hidden back when the modal is hidden
            modal.on('hidden.bs.modal', function () {
                modal.attr('aria-hidden', 'true');
            });
        }, 500);
    });

    // range sliger
    function getVals() {
        let parent = this.parentNode;
        let slides = parent.getElementsByTagName("input");
        let slide1 = parseFloat(slides[0].value);
        let slide2 = parseFloat(slides[1].value);
        if (slide1 > slide2) {
            let tmp = slide2;
            slide2 = slide1;
            slide1 = tmp;
        }

        let displayElement = parent.getElementsByClassName("rangeValues")[0];
        displayElement.innerHTML = "$" + slide1 + " - $" + slide2;
    }

    window.onload = function() {
        let sliderSections = document.getElementsByClassName("range-slider");
        for (let x = 0; x < sliderSections.length; x++) {
            let sliders = sliderSections[x].getElementsByTagName("input");
            for (let y = 0; y < sliders.length; y++) {
                if (sliders[y].type === "range") {
                    sliders[y].oninput = getVals;
                    sliders[y].oninput();
                }
            }
        }
    }

    progressBar: () => {
        const pline = document.querySelectorAll(".progressbar.line");
        const pcircle = document.querySelectorAll(".progressbar.semi-circle");
        pline.forEach(e => {
            const line = new ProgressBar.Line(e, {
                strokeWidth: 6,
                trailWidth: 6,
                duration: 3000,
                easing: 'easeInOut',
                text: {
                    style: {
                        color: 'inherit',
                        position: 'absolute',
                        right: '0',
                        top: '-30px',
                        padding: 0,
                        margin: 0,
                        transform: null
                    },
                    autoStyleContainer: false
                },
                step: (state, line) => {
                    line.setText(Math.round(line.value() * 100) + ' %');
                }
            });
            let value = e.getAttribute('data-value') / 100;
            new Waypoint({
                element: e,
                handler: function() {
                    line.animate(value);
                },
                offset: 'bottom-in-view',
            })
        });
        pcircle.forEach(e => {
            const circle = new ProgressBar.SemiCircle(e, {
                strokeWidth: 6,
                trailWidth: 6,
                duration: 2000,
                easing: 'easeInOut',
                step: (state, circle) => {
                    circle.setText(Math.round(circle.value() * 100));
                }
            });
            let value = e.getAttribute('data-value') / 100;
            new Waypoint({
                element: e,
                handler: function() {
                    circle.animate(value);
                },
                offset: 'bottom-in-view',
            })
        });
    }

    const rangeInput = document.querySelectorAll(".range-input input"),
    priceInput = document.querySelectorAll(".price-input input"),
    range = document.querySelector(".slider .progress");
    let priceGap = 1000;
    
    priceInput.forEach((input) => {
        input.addEventListener("input", (e) => {
        let minPrice = parseInt(priceInput[0].value, 10),
            maxPrice = parseInt(priceInput[1].value, 10);
    
        if (maxPrice - minPrice >= priceGap && maxPrice <= parseInt(rangeInput[1].max, 10)) {
            if (e.target.className === "input-min") {
            rangeInput[0].value = minPrice;
            range.style.left = (minPrice / parseInt(rangeInput[0].max, 10)) * 100 + "%";
            } else {
            rangeInput[1].value = maxPrice;
            range.style.right = 100 - (maxPrice / parseInt(rangeInput[1].max, 10)) * 100 + "%";
            }
        }
        });
    });
    
    rangeInput.forEach((input) => {
        input.addEventListener("input", (e) => {
        let minVal = parseInt(rangeInput[0].value, 10),
            maxVal = parseInt(rangeInput[1].value, 10);
    
        if (maxVal - minVal < priceGap) {
            if (e.target.className === "range-min") {
            rangeInput[0].value = maxVal - priceGap;
            } else {
            rangeInput[1].value = minVal + priceGap;
            }
        } else {
            priceInput[0].value = minVal;
            priceInput[1].value = maxVal;
            range.style.left = (minVal / parseInt(rangeInput[0].max, 10)) * 100 + "%";
            range.style.right = 100 - (maxVal / parseInt(rangeInput[1].max, 10)) * 100 + "%";
        }
        });
    });   

    
    //>> Quantity Js Start <<//
    $(".quantity").on("click", ".plus", function () {
        let $input = $(this).prev("input.qty");
        let val = parseInt($input.val() || 0, 10); // Ensure valid number
        $input.val(val + 1).change();
    });

    $(".quantity").on("click", ".minus", function () {
        let $input = $(this).next("input.qty");
        let val = parseInt($input.val() || 0, 10); // Ensure valid number
        if (val > 1) { // Prevent negative values if needed
            $input.val(val - 1).change();
        }
    });

    //>> Quantity Cart Js Start <<//
    const quantity = 0;
    const price = 0;
    $(".cart-item-quantity-amount, .product-quant").html(quantity);
    $(".total-price, .product-pri").html(price.toFixed(2));
    $(".cart-increment, .cart-incre").on("click", function() {
        if (quantity <= 4) {
            quantity++;
            $(".cart-item-quantity-amount, .product-quant").html(quantity);
            let basePrice = $(".base-price, .base-pri").text();
            $(".total-price, .product-pri").html((basePrice * quantity).toFixed(2));
        }
    });

    $(".cart-decrement, .cart-decre").on("click", function() {
        if (quantity >= 1) {
            quantity--;
            $(".cart-item-quantity-amount, .product-quant").html(quantity);
            let basePrice = $(".base-price, .base-pri").text();
            $(".total-price, .product-pri").html((basePrice * quantity).toFixed(2));
        }
    });

    $(".cart-item-remove>a").on("click", function() {
        $(this).closest(".cart-item").hide(300);
    });

    //Cart Increment Decriemnt

    // Quantity increment and decrement
    const quantityIncrement = document.querySelectorAll(".quantityIncrement");
    const quantityDecrement = document.querySelectorAll(".quantityDecrement");

    if (quantityIncrement.length && quantityDecrement.length) {
        quantityIncrement.forEach((increment) => {
            increment.addEventListener("click", function () {
                const input = increment.parentElement.querySelector("input");
                const value = parseInt(input.value || 0, 10); // Ensure valid number
                input.value = value + 1;
            });
        });

        quantityDecrement.forEach((decrement) => {
            decrement.addEventListener("click", function () {
                const input = decrement.parentElement.querySelector("input");
                const value = parseInt(input.value || 0, 10); // Ensure valid number
                if (value > 1) {
                    input.value = value - 1;
                }
            });
        });
    }

        //>> PaymentMethod Js Start <<//
        const paymentMethod = $("input[name='pay-method']:checked").val();
        $(".payment").html(paymentMethod);
        $(".checkout-radio-single").on("click", function() {
            let paymentMethod = $("input[name='pay-method']:checked").val();
            $(".payment").html(paymentMethod);
        });

        //Quantity 
        const inputs = document.querySelectorAll('#qty, #qty2, #qty3');
        const btnminus = document.querySelectorAll('.qtyminus');
        const btnplus = document.querySelectorAll('.qtyplus');

        if (inputs.length > 0 && btnminus.length > 0 && btnplus.length > 0) {

            inputs.forEach(function(input, index) {
                const min = Number(input.getAttribute('min'));
                const max = Number(input.getAttribute('max'));
                const step = Number(input.getAttribute('step'));

                function qtyminus(e) {
                    const current = Number(input.value);
                    const newval = (current - step);
                    if (newval < min) {
                        newval = min;
                    } else if (newval > max) {
                        newval = max;
                    }
                    input.value = Number(newval);
                    e.preventDefault();
                }

                function qtyplus(e) {
                    const current = Number(input.value);
                    const newval = (current + step);
                    if (newval > max) newval = max;
                    input.value = Number(newval);
                    e.preventDefault();
                }

                btnminus[index].addEventListener('click', qtyminus);
                btnplus[index].addEventListener('click', qtyplus);
            });
        }

        //>> Mouse Cursor Start <<//
        function mousecursor() {
            if ($("body")) {
                const e = document.querySelector(".cursor-inner"),
                    t = document.querySelector(".cursor-outer");
                let n,
                    i = 0,
                    o = !1;
                (window.onmousemove = function(s) {
                    o ||
                        (t.style.transform =
                            "translate(" + s.clientX + "px, " + s.clientY + "px)"),
                        (e.style.transform =
                            "translate(" + s.clientX + "px, " + s.clientY + "px)"),
                        (n = s.clientY),
                        (i = s.clientX);
                }),
                $("body").on("mouseenter", "a, .cursor-pointer", function() {
                        e.classList.add("cursor-hover"), t.classList.add("cursor-hover");
                    }),
                    $("body").on("mouseleave", "a, .cursor-pointer", function() {
                        ($(this).is("a") && $(this).closest(".cursor-pointer").length) ||
                        (e.classList.remove("cursor-hover"),
                            t.classList.remove("cursor-hover"));
                    }),
                    (e.style.visibility = "visible"),
                    (t.style.visibility = "visible");
            }
        }
        $(function() {
            mousecursor();
        });
        
         //>> Back To Top Slider Start <<//
         $windowOn.on('scroll', function() {
            if ($(this).scrollTop() > 20) {
                $("#back-top").addClass("show");
            } else {
                $("#back-top").removeClass("show");
            }
        });
        
        $documentOn.on('click', '#back-top', function() {
            $('html, body').animate({ scrollTop: 0 }, 800);
            return false;
        });
        
    }); // End Document Ready Function

    function loader() {
        $windowOn.on('load', function() {
            // Animate loader off screen
            $(".preloader").addClass('loaded');
            $(".preloader").delay(600).fadeOut();
        });
    }

    loader();
   

})(jQuery); // End jQuery