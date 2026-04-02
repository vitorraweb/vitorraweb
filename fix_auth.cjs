const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDPVTBcKQkq91RF1FFOas2XKsBUEXcFNv4",
  authDomain: "vitorra-holdings-limited.firebaseapp.com",
  projectId: "vitorra-holdings-limited",
  storageBucket: "vitorra-holdings-limited.firebasestorage.app",
  messagingSenderId: "266755412449",
  appId: "1:266755412449:web:1f929fb06caefb166c82a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "jonathan@vitorra.org";
const password = "T9$vQ!r7Lx@2Pz#M";

async function fix() {
  let user;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log("[SUCCESS] Created user accounting matching those exact credentials in Firebase Auth.");
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      try {
         const cred = await signInWithEmailAndPassword(auth, email, password);
         user = cred.user;
         console.log("[SUCCESS] User already exists and the password matched gracefully.");
      } catch (signinError) {
         console.error("[ERROR] User exists but the password DOES NOT match what you provided.");
         console.error(signinError.message);
         process.exit(1);
      }
    } else {
      console.error("[ERROR] Creating user:", error.message);
      process.exit(1);
    }
  }

  // Now create the user document in Firestore!
  if (user) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: 'Jonathan',
        email: email,
        emailVerified: true,
        providers: ['password'],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        phone: '+256 000 000',
        photoURL: '',
        company: { name: 'Vitorra Holdings', registrationNo: '', taxId: '', website: '' },
        addresses: [],
        preferences: {
            language: 'en',
            currency: 'UGX',
            emailNotifications: { orderUpdates: true, promotions: true, newsletter: true },
        },
        role: 'admin',
        accountType: 'business',
        status: 'active'
      }, { merge: true });
      console.log("[SUCCESS] The user's Firestore Document has been forged with the 'admin' role.");
      process.exit(0);
    } catch (e) {
      console.error("[ERROR] Failed to write to Firestore:", e.message);
      process.exit(1);
    }
  }
}

fix();
