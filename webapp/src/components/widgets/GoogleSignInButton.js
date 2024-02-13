import React, { useEffect, useContext } from "react";
import AuthContext from "../../context/AuthContext";

const GoogleSignInButton = () => {
  const { signIn } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = (response) => {
      signIn(response);
    };

    /* global google */
    google.accounts.id.initialize({
      client_id:
        "370940936724-4qh7n4qh6vrgli6bsf3je6kbe2lsotef.apps.googleusercontent.com",
      callback: handleCallback,
    });

    if (window.google) {
      google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { theme: "outline", size: "medium" } 
      );
    } else {
      console.error("Google API script not loaded");
    }
  }, []);

  return <div id="signInDiv"></div>;
};

export default GoogleSignInButton;
