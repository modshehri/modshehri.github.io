const auth             = firebase.auth();
const firestore        = firebase.firestore();
const realtimeDatabase = firebase.database();

//HTML Elements
const isCanvasFoundDiv    = document.getElementById('isCanvasFound');
const isCanvasNotFoundDiv = document.getElementById('isCanvasNotFound');
const canvasNameDiv       = document.getElementById('canvasName');
const canvasAdminNameDiv  = document.getElementById('canvasAdminName');
const canvasMembersDiv    = document.getElementById('canvasMembers');
const cursorsDiv          = document.getElementById('cursors');

let canvasId;
let userId;

let canvasListener;
let canvasSessionListener;

let mouseX = -1;
let mouseY = -1;

// Listening for user authentication state changes
auth.onAuthStateChanged(user => {
    unsubscribeListeners();
    if (user) {
        userId = user.uid
        retrieveCanvasData(userId);
    } else {
        redirectToHomePage();
    }
});

function retrieveCanvasData(userId) {
    canvasListener = firestore
        .collection('canvases')
        .doc(`${ findGetParameter("id") }`)
        .onSnapshot(documentSnapshot => {
            let canvasExists = documentSnapshot.exists;
            isCanvasFoundDiv.hidden = !canvasExists
            isCanvasNotFoundDiv.hidden = canvasExists

            if (canvasExists) {
                canvasId = documentSnapshot.id;
                canvasNameDiv.innerHTML = `<h1>Canvas name: ${ documentSnapshot.data().canvasName }</h1>`;
                canvasAdminNameDiv.innerHTML = `<h2>Canvas admin: ${ documentSnapshot.data().adminUid }</h2>`;
                canvasMembersDiv.innerHTML = `<h2>Number of users: ${ documentSnapshot.data().users.length }</h2>`;

                canvasSessionListener = realtimeDatabase.ref(`canvasSessions/${canvasId}`);
                
                canvasSessionListener.on('value', function(snapshot) {
                    let innerHTML = ``
                    snapshot.forEach(function(childSnapshot) {
                        innerHTML += `<p style="position: absolute; left: ${childSnapshot.val().x}px; top: ${childSnapshot.val().y}px;">${childSnapshot.key}</p>`;
                    });
                    cursorsDiv.innerHTML = innerHTML;
                });
            } else {
                canvasId = null;
            }
        }, err => {
            isCanvasFoundDiv.hidden = true;
            isCanvasNotFoundDiv.hidden = false;
        });
}

function redirectToHomePage() {
    window.location.replace("https://www.softchart-3ee27.web.app/");
}

function unsubscribeListeners() {
    canvasListener && canvasListener.unsubscribe();
    canvasSessionListener && canvasSessionListener.unsubscribe();
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function refreshHTMLCursors(cursorPositions) {
    cursorsDiv.innerHTML = ``;
    for (snapshot in cursorPositions) {
        let cursor = document.createElement("p");
        cursor.innerHTML = snapshot.key;
        cursorsDiv.appendChild(cursor);
    }
}

function setDatabaseMousePosition(x, y) {
    if (userId == null || canvasId == null) { return }
    realtimeDatabase.ref(`canvasSessions/${canvasId}/${userId}`).set({
        x: `${x}`,
        y: `${y}`
    });
}

(function() {
    document.onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        var eventDoc, doc, body;
        
        event = event || window.event;
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
        mouseX = event.pageX;
        mouseY = event.pageY;

        setDatabaseMousePosition(mouseX, mouseY);
    }
})();