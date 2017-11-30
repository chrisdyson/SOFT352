/* Your JS code goes here */
$(document).ready(function () {

    function setView() {
        var loginVisibility = $("#login").css("display");
        if (loginVisibility == "block") {
            //alert("login visible");
            $("#home, #board, #chat, #times, #mySidebar, #navBar").css({
                "display": "none"
            });
        } else {
            //alert("login not visible");
            $("#home, #board, #chat, #times").css({
                "display": "block"
            });
        }
    }

    window.onload(setView())
});
