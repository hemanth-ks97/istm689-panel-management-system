import { Avatar, Button } from "@mui/material";
import AuthContext from "../../context/AuthContext";
import GoogleSignInButton from "./GoogleSignInButton";
import { useContext } from "react";

const User = () => {
  const { user, signOut } = useContext(AuthContext);
  return (
    <>
      {user && (
        <div>
          <div> You are signed in as: {user.email}</div>
          <Avatar src = {user.picture}/>
          <div>Click this to sign out </div>
          <Button variant="contained" onClick={signOut}>Sign out</Button>
        </div>
      )}
         {!user && (
        <div>
          <div> You are not signed in</div>
          <div>Click this to sign in </div>
          <GoogleSignInButton />
        </div>
      )}
    </>
  );
};

export default User;
