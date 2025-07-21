// TEST: Events
const allEvents = [];

const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

EventTarget.prototype.addEventListener = function(type, listener, options) {
    allEvents.push({
        target: this,
        type,
        listener,
        options
    });
    originalAddEventListener.call(this, type, listener, options);
};

EventTarget.prototype.removeEventListener = function(type, listener, options) {
    // allEvents'ten kaldır
    for (let i = allEvents.length - 1; i >= 0; i--) {
        const ev = allEvents[i];
        if (
            ev.target === this &&
            ev.type === type &&
            ev.listener === listener &&
            (ev.options === options || JSON.stringify(ev.options) === JSON.stringify(options))
        ) {
            allEvents.splice(i, 1);
        }
    }
    originalRemoveEventListener.call(this, type, listener, options);
};

const show = function() {
    console.table(allEvents);
}

//console.table(allEvents);