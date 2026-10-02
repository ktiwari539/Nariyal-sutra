// Browser-route fixtures only. Never loaded by an application page or deployed auth flow.
export const app = `export const initializeApp=()=>({}),getApp=()=>({}),getApps=()=>[{}];`;
export const auth = `
const trace=(type)=>window.__authCalls.push(type);let listener;
export const getAuth=()=>({}),browserLocalPersistence={};
export const setPersistence=async()=>{},getRedirectResult=async()=>null;
export function onAuthStateChanged(a,cb){listener=cb;queueMicrotask(()=>cb(null));return()=>{};}
export async function signInWithEmailAndPassword(a,email,pw){trace('signin');if(window.__authScenario==='wrong-password')throw {code:'auth/invalid-credential'};const u=window.__authUser||{uid:'qa-customer',email,emailVerified:true,displayName:'QA Customer'};if(listener)await listener(u);return {user:u};}
export async function signOut(){trace('signout');if(listener)await listener(null);}
export async function sendPasswordResetEmail(){trace('reset');if(window.__authScenario==='missing-user')throw {code:'auth/user-not-found'};if(window.__authScenario==='network')throw {code:'auth/network-request-failed'};}
export async function sendEmailVerification(){trace('verify');}
export async function createUserWithEmailAndPassword(a,email){trace('signup');const u={uid:'qa-new',email,displayName:'',emailVerified:false};return {user:u};}
export async function updateProfile(u,data){Object.assign(u,data);trace('profile');}
export const deleteUser=async()=>{trace('delete-incomplete');};
export class GoogleAuthProvider{};export class OAuthProvider{};
`;
export const firestore = `
export const getFirestore=()=>({}),doc=(...args)=>args.slice(1).join('/'),collection=(...args)=>args.slice(1).join('/'),query=(...args)=>args,where=()=>({}),orderBy=()=>({}),limit=()=>({}),serverTimestamp=()=>({seconds:1});
export async function getDoc(ref){if(String(ref).startsWith('adminRoles'))return {exists:()=>!!window.__authRole,data:()=>window.__authRole};return {exists:()=>false,data:()=>({})};}
export async function setDoc(){window.__authCalls.push('setDoc');}
export const updateDoc=setDoc,deleteDoc=async()=>{};
export function onSnapshot(ref,next){if(typeof next==='function')queueMicrotask(()=>next({metadata:{fromCache:false},docs:[],forEach:()=>{}}));return()=>{};}
`;
export const storage = `export const getStorage=()=>({}),ref=()=>({}),uploadBytes=async()=>({}),getDownloadURL=async()=>'',deleteObject=async()=>{};`;
export const appCheck = `export class ReCaptchaEnterpriseProvider{};export const initializeAppCheck=()=>({}),getToken=async()=>({token:'qa-only'});`;
export const analytics = `export const isSupported=async()=>false,getAnalytics=()=>({}),logEvent=()=>{};`;
export const performance = `export const getPerformance=()=>({});`;
