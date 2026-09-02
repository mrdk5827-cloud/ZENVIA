/* =========================================================
   ZENVIA
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const newMeetingBtn =
    document.getElementById("newMeetingBtn");

const joinMeetingBtn =
    document.getElementById("joinMeetingBtn");

const joinBox =
    document.getElementById("joinBox");

const meetingIdInput =
    document.getElementById("meetingId");

const joinBtn =
    document.getElementById("joinBtn");

const joinMessage =
    document.getElementById("joinMessage");

const menuBtn =
    document.getElementById("menuBtn");


/* =========================================================
   GENERATE MEETING ID
   ========================================================= */

function generateMeetingId() {

    const letters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const numbers =
        "0123456789";

    function randomCharacters(length, characters) {

        let result = "";

        for (let i = 0; i < length; i++) {

            const randomIndex =
                Math.floor(
                    Math.random() * characters.length
                );

            result += characters[randomIndex];
        }

        return result;
    }

    const part1 =
        randomCharacters(3, letters);

    const part2 =
        randomCharacters(3, numbers);

    const part3 =
        randomCharacters(3, numbers);

    return `ZEN-${part1}-${part2}${part3}`;
}


/* =========================================================
   NEW MEETING
   ========================================================= */

if (newMeetingBtn) {

    newMeetingBtn.addEventListener(
        "click",
        function () {

            const meetingId =
                generateMeetingId();

            /*
             * अभी हम केवल meeting ID बना रहे हैं।
             * वास्तविक video room अगले चरण में WebRTC
             * और signaling server से बनाया जाएगा।
             */

            localStorage.setItem(
                "zenviaMeetingId",
                meetingId
            );

            joinMessage.textContent =
                "Meeting created: " + meetingId;

            joinMessage.style.color =
                "#8d96ff";

            joinBox.classList.add("active");

            meetingIdInput.value =
                meetingId;

            meetingIdInput.focus();

        }
    );

}


/* =========================================================
   SHOW JOIN BOX
   ========================================================= */

if (joinMeetingBtn) {

    joinMeetingBtn.addEventListener(
        "click",
        function () {

            joinBox.classList.toggle("active");

            if (
                joinBox.classList.contains("active")
            ) {

                meetingIdInput.focus();

            }

        }
    );

}


/* =========================================================
   JOIN MEETING
   ========================================================= */

if (joinBtn) {

    joinBtn.addEventListener(
        "click",
        function () {

            const meetingId =
                meetingIdInput.value.trim();


            /* Empty input */

            if (meetingId === "") {

                joinMessage.textContent =
                    "Please enter a meeting ID.";

                joinMessage.style.color =
                    "#ff8d8d";

                meetingIdInput.focus();

                return;
            }


            /* Minimum length */

            if (meetingId.length < 5) {

                joinMessage.textContent =
                    "Please enter a valid meeting ID.";

                joinMessage.style.color =
                    "#ff8d8d";

                return;
            }


            /*
             * Temporary meeting behaviour.
             * Actual video meeting will be connected
             * after WebRTC implementation.
             */

            localStorage.setItem(
                "zenviaJoinedMeeting",
                meetingId
            );


            joinMessage.textContent =
                "Meeting ID accepted. Video room coming next.";

            joinMessage.style.color =
                "#8dffbf";

        }
    );

}


/* =========================================================
   ENTER KEY TO JOIN
   ========================================================= */

if (meetingIdInput) {

    meetingIdInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                joinBtn.click();

            }

        }
    );

}


/* =========================================================
   MENU BUTTON
   ========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        function () {

            alert(
                "Zenvia Menu\n\n" +
                "New Meeting\n" +
                "Join Meeting\n" +
                "About Zenvia"
            );

        }
    );

}


/* =========================================================
   AUTO RESTORE LAST MEETING ID
   ========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedMeetingId =
            localStorage.getItem(
                "zenviaMeetingId"
            );

        if (savedMeetingId) {

            /*
             * केवल ID को restore किया जाता है।
             * User की privacy के लिए इसे automatically
             * join नहीं किया जाता।
             */

        }

    }
);


/* =========================================================
   BUTTON PRESS EFFECT
   ========================================================= */

document
    .querySelectorAll("button")
    .forEach(function (button) {

        button.addEventListener(
            "mousedown",
            function () {

                button.style.transform =
                    "scale(0.98)";

            }
        );

        button.addEventListener(
            "mouseup",
            function () {

                button.style.transform =
                    "";

            }
        );

        button.addEventListener(
            "mouseleave",
            function () {

                button.style.transform =
                    "";

            }
        );

    });


/* =========================================================
   ZENVIA READY
   ========================================================= */

console.log(
    "Zenvia is ready."
);
