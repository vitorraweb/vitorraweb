const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
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

const usersToCreate = [
  { email: 'john.b2c@test.com', pass: 'password123', name: 'John Doe', role: 'b2c', company: null, accountType: 'individual' },
  { email: 'jane.b2c@test.com', pass: 'password123', name: 'Jane Smith', role: 'b2c', company: null, accountType: 'individual' },
  { email: 'globex.b2b@test.com', pass: 'password123', name: 'Globex Rep', role: 'b2b', company: { name: 'Globex Corp', taxId: 'TAX-888', registrationNo: 'REG-567', website: 'globex.com' }, accountType: 'business' }
];

async function seed() {
  for (const u of usersToCreate) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
      const user = cred.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: u.name,
        email: u.email,
        emailVerified: true,
        providers: ['password'],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        phone: '+256 700 000 000',
        photoURL: '',
        company: u.company || { name: '', taxId: '', registrationNo: '', website: '' },
        addresses: [],
        preferences: { language: 'en', currency: 'UGX', emailNotifications: { orderUpdates: true, promotions: true, newsletter: true } },
        role: u.role,
        accountType: u.accountType,
        status: 'active'
      }, { merge: true });
      console.log(`Created ${u.email}`);
    } catch (e) {
      console.log(`Skipped ${u.email}: ${e.message}`);
    }
  }
  process.exit(0);
}

seed();
