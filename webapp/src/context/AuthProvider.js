import React, { useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import { jwtDecode } from "jwt-decode"; // Corrected import statement

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // on component rendering, check if user already signed in
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error accessing local storage:", error);
      // TODO: handle error gracefully and show message on screen
    }
  }, []);

  const signIn = (response) => {
    try {
      const signedInUser = jwtDecode(response.credential);
      setUser(signedInUser);
      localStorage.setItem("user", JSON.stringify(signedInUser));
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem("user");
      setUser(null);
      //window.google.accounts.id.disableAutoSelect(); // Prevents automatic sign-in popups
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
