const auth = firebase.auth();
const firestore = firebase.firestore();

//HTML Elements
const signedInDiv     = document.getElementById('signedIn');
const signedOutDiv    = document.getElementById('signedOut');
const userDetailsDiv  = document.getElementById('userDetails');
const userCanvasesDiv = document.getElementById('userCanvases');

const signInGoogleBtn = document.getElementById('signInGoogleBtn');
const signOutBtn      = document.getElementById('signOutBtn');
const createCanvasBtn = document.getElementById('createCanvas');

const canvasNameTF = document.getElementById('canvasNameTF');

//Firestore Listeners
let userCanvasesListener

const provider = new firebase.auth.GoogleAuthProvider();

//Authentication State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        signedInDiv.hidden  = false;
        signedOutDiv.hidden = true;
        userDetailsDiv.innerHTML = `<p>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p>`;

        signOutBtn.onclick = () => auth.signOut();
        createCanvasBtn.onclick = () => firestore.collection('canvases').add({
            adminUid: user.uid,
            canvasName: canvasNameTF.value,
            users: [],
            components: []
        });

        userCanvasesListener = firestore.collection('canvases')
            .where('users', 'array-contains', user.uid)
            .onSnapshot(querySnapshot => {
                queryCanvases = querySnapshot.docs.map(doc => {
                    return `<li><a href="canvas.html?id=${ doc.id }">${ doc.data().canvasName }</a></li>`;
                });
                userCanvasesDiv.innerHTML = queryCanvases.join('');
        });
    } else {
        signedInDiv.hidden  = true;
        signedOutDiv.hidden = false;

        signInGoogleBtn.onclick = () => auth.signInWithPopup(provider);

        if (userCanvasesListener != null) { userCanvasesListener.unsubscribe(); }
    }
});

window.onbeforeunload = function() {
    if (userCanvasesListener != null) { userCanvasesListener.unsubscribe(); }
};