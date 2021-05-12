(function(){
    function onMessage(msg, sender, sendResponse) {
        console.log(msg.state);
    }

    function setupEvents() {
        chrome.runtime.onMessage.addListener(onMessage);
    }

    function run() {
        setupEvents();
    }
    
    run();
}())

