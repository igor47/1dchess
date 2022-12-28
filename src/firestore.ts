import { initializeApp } from 'firebase/app';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// from here:
// https://console.firebase.google.com/u/0/project/igor47-1dchess/settings/general/web
const firebaseConfig = {
  apiKey: "AIzaSyD916OoR7luzhqBUuJfwiUj5wh42UDblkg",
  authDomain: "igor47-1dchess.firebaseapp.com",
  databaseURL: "https://igor47-1dchess-default-rtdb.firebaseio.com",
  projectId: "igor47-1dchess",
  storageBucket: "igor47-1dchess.appspot.com",
  messagingSenderId: "1085583103294",
  appId: "1:1085583103294:web:7ef26af996c48daf3f886f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app)

export {
  db,
}
