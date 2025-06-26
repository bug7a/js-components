/* Bismillah */

/*

DONT USE: IT IS NOT WORKING...

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

v24.06
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/javascript-mobile-app-template/


EXAMPLE: {javascript-mobile-app-template}/comp-name.htm


*/

"use strict";
const LightMotion = function(params = {}) {

    const defaults = {
        obj: null,
        fromLeft: null,
        toLeft: null,
        fromTop: null,
        toTop: null,
        toOpacity: null,
        onComplate: function() {},
    };

    const data = { ...defaults, ...params };

    if (data.obj != null) {

        if (data.obj.lightMotionInterval) {
            clearInterval(data.obj.lightMotionInterval);
        }

        let _left = null;
        let _top = null;
        let _opacity = null;
        let _minMove = 0;

        // LEFT move:
        if (data.toLeft != null && data.fromLeft != null && data.toLeft != data.fromLeft) {
            data.obj.left = data.fromLeft;
           if (data.toLeft > data.fromLeft) {
                _minMove = (data.toLeft - data.fromLeft) / 4;
                _left = [data.fromLeft + _minMove, data.fromLeft + (_minMove * 2), data.fromLeft + (_minMove * 3), data.toLeft];
            } else {
                _minMove = (data.fromLeft - data.toLeft) / 4;
                _left = [data.fromLeft - _minMove, data.fromLeft - (_minMove * 2), data.fromLeft - (_minMove * 3), data.toLeft];
            }
        }

        // Top move:
        if (data.toTop != null && data.fromTop != null && data.toTop != data.fromTop) {
            data.obj.top = data.fromTop;
           if (data.toTop > data.fromTop) {
                _minMove = (data.toTop - data.fromTop) / 4;
                _top = [data.fromTop + _minMove, data.fromTop + (_minMove * 2), data.fromTop + (_minMove * 3), data.toTop];
            } else {
                _minMove = (data.fromTop - data.toTop) / 4;
                _top = [data.fromTop - _minMove, data.fromTop - (_minMove * 2), data.fromTop - (_minMove * 3), data.toTop];
            }
        }

        // Top move:
        if (data.toOpacity != null) {
           if (data.toOpacity == 1) {
                data.obj.opacity = 0;
                _opacity = [0.25, 0.50, 0.75, 1];
            } else {
                data.obj.opacity = 1;
                _opacity = [0.75, 0.50, 0.25, 0];
            }
        }

        let _timer = 0;

        console.log("start");

        data.obj.lightMotionInterval = setInterval(() => requestAnimationFrame(function() {

            console.log(_timer);

            if (_left != null) data.obj.left = _left[_timer];
            if (_top != null) data.obj.top = _top[_timer];
            if (_opacity != null) data.obj.opacity = _opacity[_timer];

            _timer++;

            if (_timer >= 4) {

                if (data.obj.lightMotionInterval) {
                    clearInterval(data.obj.lightMotionInterval);
                }

                data.onComplate();
                
            }

        }), 50);

    };

};