/* =========================================
   ZENVIA - HOMEPAGE JAVASCRIPT
========================================= */

"use strict";


/* =========================================
   ELEMENTS
========================================= */

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


/* =========================================
   GENERATE MEETING ID
========================================= */

function generateMeetingId() {

    const letters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let randomLetters = "";

    for (let i = 0; i < 3; i++) {

        randomLetters +=
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ];
    }

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return `ZEN-${randomLetters}-${randomNumber}`;
}


/* =========================================
   SHOW JOIN BOX
========================================= */

function showJoinBox() {

    if (!joinBox) {
        return;
    }

    joinBox.style.display = "block";

    setTimeout(() => {

        if (meetingIdInput) {
            meetingIdInput.focus();
        }

    }, 100);
}


/* =========================================
   NEW MEETING
========================================= */

if (newMeetingBtn) {

    newMeetingBtn.addEventListener(
        "click",
        function () {

            const meetingId =
                generateMeetingId();

            /*
               Save the meeting ID
               so meeting.html can use it.
            */

            localStorage.setItem(
                "zenviaMeetingId",
                meetingId
            );

            localStorage.setItem(
                "zenviaJoinedMeeting",
                meetingId
            );

            /*
               Open the actual meeting room.
            */

            window.location.href =
                "meeting.html?id=" +
                encodeURIComponent(
                    meetingId
                );
        }
    );
}


/* =========================================
   JOIN MEETING BUTTON
========================================= */

if (joinMeetingBtn) {

    joinMeetingBtn.addEventListener(
        "click",
        function () {

            showJoinBox();

        }
    );
}


/* =========================================
   JOIN MEETING
========================================= */

function joinMeeting() {

    if (!meetingIdInput) {
        return;
    }

    const meetingId =
        meetingIdInput.value
            .trim()
            .toUpperCase();

    if (!meetingId) {

        if (joinMessage) {

            joinMessage.textContent =
                "Please enter a Meeting ID.";

            joinMessage.style.color =
                "#ff6b6b";
        }

        return;
    }


    /*
       Basic Meeting ID validation.

       Expected format:
       ZEN-ABC-123456
    */

    const meetingPattern =
        /^ZEN-[A-Z]{3}-[0-9]{6}$/;


    if (!meetingPattern.test(meetingId)) {

        if (joinMessage) {

            joinMessage.textContent =
                "Invalid Meeting ID. Example: ZEN-ABC-123456";

            joinMessage.style.color =
                "#ff6b6b";
        }

        return;
    }


    /*
       Save joined meeting.
    */

    localStorage.setItem(
        "zenviaJoinedMeeting",
        meetingId
    );


    localStorage.setItem(
        "zenviaMeetingId",
        meetingId
    );


    /*
       Open meeting room with ID.
    */

    window.location.href =
        "meeting.html?id=" +
        encodeURIComponent(
            meetingId
        );
}


/* =========================================
   JOIN BUTTON EVENT
========================================= */

if (joinBtn) {

    joinBtn.addEventListener(
        "click",
        joinMeeting
    );
}


/* =========================================
   ENTER KEY
========================================= */

if (meetingIdInput) {

    meetingIdInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                joinMeeting();
            }
        }
    );
}


/* =========================================
   MENU
========================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        function () {

            const choice =
                window.confirm(
                    "Zenvia Menu\n\n" +
                    "OK = New Meeting\n" +
                    "Cancel = Close"
                );

            if (choice) {

                if (newMeetingBtn) {
                    newMeetingBtn.click();
                }
            }
        }
    );
}


/* =========================================
   RESTORE SAVED MEETING
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const savedMeeting =
            localStorage.getItem(
                "zenviaJoinedMeeting"
            );

        /*
           Do not automatically open
           an old meeting.

           We only keep the ID saved
           for future use.
        */

        if (savedMeeting) {

            console.log(
                "Saved Zenvia Meeting:",
                savedMeeting
            );
        }

    }
);


/* =========================================
   BUTTON PRESS EFFECT
========================================= */

const allButtons =
    document.querySelectorAll(
        "button"
    );

allButtons.forEach(
    button => {

        button.addEventListener(
            "pointerdown",
            function () {

                this.style.transform =
                    "scale(0.97)";
            }
        );

        button.addEventListener(
            "pointerup",
            function () {

                this.style.transform =
                    "";
            }
        );

        button.addEventListener(
            "pointerleave",
            function () {

                this.style.transform =
                    "";
            }
        );
    }
);


/* =========================================
   ZENVIA READY
========================================= */

console.log(
    "Zenvia homepage is ready."
);
