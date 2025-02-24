"use strict";

/** DOM Cache */
const DOM={
  emailOTP:{
    field:document.getElementById("authEmailOTP-EmailInput"),
    button:document.getElementById("emailOtpButton"),
    container:{
      email:document.getElementById("emailOtpContainer-Email"),
      otp:document.getElementById("emailOtpContainer-Otp")
    },
    preview:document.getElementById("otpEmailPreviewText"),
    input:document.getElementById("otpInput"),
    confirmButton:document.getElementById("emailOtpConfirmButton")
  },
  emailPassword:{
    signUp:document.getElementById("authPasswordSignUp"),
    logIn:document.getElementById("authPasswordLogIn"),
    createForm:{
      email:document.getElementById("createEmailPassword-EmailInput"),
      password:document.getElementById("createEmailPassword-PasswordInput"),
      passwordContainer:document.getElementById("createEmailPassword-PasswordContainer"),
      button:document.getElementById("createEmailPassAuthButton")
    },
    loginForm:{
      email:document.getElementById("authEmailPassword-EmailInput"),
      password:document.getElementById("authEmailPassword-PasswordInput"),
      passwordContainer:document.getElementById("authEmailPassword-PasswordContainer"),
      button:document.querySelector("#authPasswordLogIn button.btn-primary")
    }
  },
  recovery:{
    modal:{
      header:document.getElementById("inputRequestTitle"),
      description:document.getElementById("inputRequestDescription"),
      button:document.getElementById("inputRequestButton")
    },
    password:document.getElementById("password")
  },
  verification:{
    title:document.getElementById("emailVerificationTitle"),
    body:document.getElementById("emailVerificationBody")
  }
};

/** Constants and Utilities */
const AUTH_TOAST_DURATION=3000,AUTH_REDIRECT_DELAY=1500;
function validateEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}

/** OAuth Authentication */
window.oAuth=async function(authProvider,scopes=[]){
  try{
    await account.createOAuth2Session(
      authProvider,
      PROJECT_DOMAIN+"?authWith="+authProvider,
      PROJECT_DOMAIN+"/auth/api/error.html",
      scopes
    );
  }catch(e){
    console.error(authProvider,"Authentication Error:",e);
    showToast({heading:authProvider+" Authentication Error",message:e.message,type:"error"});
  }
};

/** Logout */
window.logout=async function(){
  showLoadingToast("logOutToast",{loadingHeading:"Closing Session..",loadingMessage:"Removing current session"});
  try{
    sessionStorage.clear();
    await account.deleteSession("current");
    updateLoadingToast("logOutToast","success",{heading:"Logged Out",message:"Session closed"});
  }catch(e){
    updateLoadingToast("logOutToast","error",{heading:"Error",message:"Could not close session"});
  }finally{
    bootstrap.Modal.getInstance(document.getElementById("logOutModal"))?.hide();
    setTimeout(()=>window.location.reload(),AUTH_REDIRECT_DELAY);
  }
};

/** Email OTP Auth */
window.authAccountEmailOTP=async function(){
  const email=DOM.emailOTP.field?.value?.trim();
  DOM.emailOTP.preview.innerText=email||"";
  if(!email||!validateEmail(email)){
    showToast({
      heading:!email?"Email is required":"Invalid Email",
      message:"Please enter a valid email address.",
      type:"error",
      duration:!email?2500:2000
    });
    DOM.emailOTP.field?.focus();return;
  }
  try{
    DOM.emailOTP.button.disabled=true;
    const{userId}=await account.createEmailToken(Appwrite.ID.unique(),email,false);
    showToast({heading:"Email Sent",message:"An OTP has been sent to your email.",duration:AUTH_TOAST_DURATION});
    DOM.emailOTP.container.email.style.display="none";
    DOM.emailOTP.container.otp.style.display="block";
    DOM.emailOTP.input.value="";
    DOM.emailOTP.input?.focus();
    const submitOTP=()=>{const code=DOM.emailOTP.input.value;code?.length===6&&createSessionFromOTP(userId,code);};
    DOM.emailOTP.input?.addEventListener("keydown",e=>e.key==="Enter"&&submitOTP());
    DOM.emailOTP.confirmButton?.addEventListener("click",submitOTP);
  }catch(e){
    console.error("OTP Error:",e);
    DOM.emailOTP.button.disabled=false;
    showToast({heading:"Error",message:"Failed to send OTP. Please try again.",duration:AUTH_TOAST_DURATION,type:"error"});
  }
};

window.createSessionFromOTP=async function(userID,otpCode){
  if(!otpCode){
    showToast({heading:"Code is required",duration:2000});
    DOM.emailOTP.input?.focus();return;
  }
  try{
    await account.createSession(userID,otpCode);
    DOM.emailOTP.container.otp.style.display="none";
    checkUser();
  }catch(e){
    console.error("Session Error:",e);
    showToast({heading:e.message,duration:AUTH_TOAST_DURATION,type:"error"});
    DOM.emailOTP.input.value="";
    DOM.emailOTP.input?.focus();
  }
};

/** Toggle Signup/Login Display */
window.toggleAuthDisplay=function(auth){
  if(!DOM.emailPassword.signUp||!DOM.emailPassword.logIn)return;
  [DOM.emailPassword.signUp.style.display,DOM.emailPassword.logIn.style.display]=
    auth==="signup"?["block","none"]:["none","block"];
};

/** Switch Between Signup/Login Forms */
window.switchAuthPasswordType=function(){
  if(!DOM.emailPassword.signUp)return;
  toggleAuthDisplay(DOM.emailPassword.signUp.style.display==="none"?"signup":"login");
};

/** Show password form after validating email */
window.validateEmailAndShowPassword=function(isLogin=false){
  const form=isLogin?DOM.emailPassword.loginForm:DOM.emailPassword.createForm;
  if(!form.email)return false;
  const email=form.email.value.trim();
  if(!email||!validateEmail(email)){
    showToast({
      heading:"Validation Failed",
      message:!email?"Email is required.":"Please enter a valid email address.",
      duration:AUTH_TOAST_DURATION
    });
    form.email.focus();return false;
  }
  form.passwordContainer&&(form.passwordContainer.style.display="block",form.password?.focus());
  return true;
};

/** Create Account (Email/Password) */
window.createEmailPassAuth=async function(){
  const email=DOM.emailPassword.createForm.email?.value.trim();
  if(!validateEmailAndShowPassword())return;
  const password=DOM.emailPassword.createForm.password?.value;
  if(!password){
    DOM.emailPassword.createForm.passwordContainer.style.display="block";
    DOM.emailPassword.createForm.password?.focus();return;
  }
  showLoadingToast("createAccountEmailPassword",{
    loadingHeading:"Creating Account..",
    loadingMessage:"Please wait while we create your account."
  });
  try{
    await account.create(Appwrite.ID.unique(),email,password);
    await account.createEmailPasswordSession(email,password);
    updateLoadingToast("createAccountEmailPassword","success",{
      heading:"Account Created Successfully",
      message:"Successfully Signed Up to your account."
    });
    await sendEmailVerificationLink();
    checkUser();
  }catch(e){
    updateLoadingToast("createAccountEmailPassword","error",{
      heading:"Account Creation Failed",
      message:e.message
    });
  }
};

/** Sign In (Email/Password) */
window.authEmailPassword=async function(){
  const email=DOM.emailPassword.loginForm.email?.value.trim();
  if(!validateEmailAndShowPassword(true))return;
  const password=DOM.emailPassword.loginForm.password?.value;
  if(!password){
    DOM.emailPassword.loginForm.passwordContainer.style.display="block";
    DOM.emailPassword.loginForm.password?.focus();
    return;
  }
  showLoadingToast("authEmailPasswordToast",{
    loadingHeading:"Logging In..",
    loadingMessage:"Please wait while we log you in."
  });
  try{
    await account.createEmailPasswordSession(email,password);
    updateLoadingToast("authEmailPasswordToast","success",{
      heading:"Session Created",
      message:"Successfully Signed In to your account."
    });
    checkUser();
  }catch(e){
    updateLoadingToast("authEmailPasswordToast","error",{
      heading:"Sign In Failed",
      message:e.message
    });
  }
};

/** Send Email Verification */
window.sendEmailVerificationLink=async function(){
  try{
    await account.createVerification(PROJECT_DOMAIN+"/auth/api/verify.html");
    showToast({heading:"Verification email sent",message:"Check your email to verify your account.",duration:2000});
  }catch(e){
    showToast({heading:"Verification email failed.",message:e.message,duration:AUTH_TOAST_DURATION});
  }
};

/** Password Reset Request */
window.resetPasswordRequest=async function(emailInput){
  if(!emailInput)return;
  try{
    await account.createRecovery(emailInput,PROJECT_DOMAIN+"/auth/api/reset-password.html");
    showToast({heading:"Recovery email sent.",message:"Check your email to reset your password.",type:"success",duration:5500});
    await delay(1000);
    const{header,description,button}=DOM.recovery.modal;
    if(header&&description&&button){
      header.innerText="Recovery Email Sent";
      description.innerText="Check your email to reset your password.";
      button.disabled=true;button.innerText="Email Sent";
    }
  }catch(e){
    showToast({heading:"Recovery email failed.",message:e.message,type:"error",duration:AUTH_TOAST_DURATION});
    await delay(AUTH_REDIRECT_DELAY);
    window.location.href="/";
  }
};

/** Confirm Recovered Password */
window.confirmPasswordRecovery=async function(){
  const params=new URLSearchParams(window.location.search),
  userId=params.get("userId"),secret=params.get("secret");
  if(!userId||!secret||!DOM.recovery.password)return;
  try{
    await account.updateRecovery(userId,secret,DOM.recovery.password.value);
    showToast({heading:"Password Changed",message:"Successfully changed the account password",duration:AUTH_TOAST_DURATION,type:"success"});
    setTimeout(()=>window.location.href="/login",AUTH_REDIRECT_DELAY);
  }catch(e){
    console.error("Password update failed:",e);
    showToast({heading:"Password Change Failed",message:e.message,duration:AUTH_TOAST_DURATION,type:"error"});
  }
};

/** Process verification callback */
(function(){
  if(!window.location.pathname.includes("/auth/api/verify"))return;
  const params=Object.fromEntries(new URLSearchParams(window.location.search));
  if(!params.userId||!params.secret){
    console.error("Missing verification parameters");
    DOM.verification.title&&(DOM.verification.title.innerText="Verification Failed!");
    DOM.verification.body&&(DOM.verification.body.innerText="Missing verification parameters");
    return;
  }
  (async()=>{
    try{
      await account.updateVerification(params.userId,params.secret);
      DOM.verification.title&&(DOM.verification.title.innerText="Account Verified!");
      DOM.verification.body&&(DOM.verification.body.innerText="Your email has been successfully verified.");
      setTimeout(()=>window.location.href="/",AUTH_REDIRECT_DELAY);
    }catch(e){
      console.error("Verification failed:",e);
      DOM.verification.title&&(DOM.verification.title.innerText="Verification Failed!");
      DOM.verification.body&&(DOM.verification.body.innerText=e.message);
    }
  })();
})();

/** Initialize Auth Display On Load */
document.addEventListener("DOMContentLoaded",()=>{
  toggleAuthDisplay(new URLSearchParams(window.location.search).get("auth"));
  // Setup Enter key listeners for create form
  DOM.emailPassword.createForm.email?.addEventListener("keypress",e=>{
    if(e.key==="Enter")validateEmailAndShowPassword(false);
  });
  DOM.emailPassword.createForm.password?.addEventListener("keypress",e=>{
    if(e.key==="Enter")createEmailPassAuth();
  });
  DOM.emailPassword.createForm.button?.addEventListener("click",createEmailPassAuth);
  // Setup Enter key listeners for login form
  DOM.emailPassword.loginForm.email?.addEventListener("keypress",e=>{
    if(e.key==="Enter")validateEmailAndShowPassword(true);
  });
  DOM.emailPassword.loginForm.password?.addEventListener("keypress",e=>{
    if(e.key==="Enter")authEmailPassword();
  });
  DOM.emailPassword.loginForm.button?.addEventListener("click",authEmailPassword);
  // Set up OTP field
  DOM.emailOTP.field?.addEventListener("keydown",e=>{if(e.key==="Enter")authAccountEmailOTP();});
});