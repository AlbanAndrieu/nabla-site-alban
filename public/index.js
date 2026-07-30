mixpanel.init("e28ee9625ec33982c6f8666ed974382c", {
  debug: true,
  ignore_dnt: true,
  track_pageview: true,
  persistence: "localStorage",
});

// Set this to a unique identifier for the user performing the event.
//mixpanel.identify(/* \"<USER_ID\"> */)

// 1. Create the button
var button = document.createElement("button");
button.innerHTML = "Track me";

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 4. Add the button to the page
//button.click();

// 3. Add event handler
button.addEventListener("click", () => {
  //alert("did something");
  console.log("did something");
  // Track a pageview.
  mixpanel.track("testing that button was clidked");

  // Track an event. It can be anything, but in this example, we're tracking a Sign Up event.
  // mixpanel.track('Sign Up', {
  //   'Signup Type': 'Referral'
  // })
});

// import { inject } from "@vercel/analytics";

// import { injectSpeedInsights } from "@vercel/speed-insights";

// inject();
// injectSpeedInsights();
