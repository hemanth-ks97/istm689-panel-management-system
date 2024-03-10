import React, { useState, useEffect } from "react";
import { Typography } from "@mui/material";

import { httpClient } from "../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import LoadingSpinner from "../widgets/LoadingSpinner";
import ListDisplay from "../widgets/ListDisplay";
const AdminUsersPage = () => {
  const { user } = useSelector((state) => state.user);
  const [users, setUsers] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/user", {
        headers: headers,
      })
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) =>
        enqueueSnackbar(error.message, {
          variant: "error",
        })
      )
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <ListDisplay data={users} idAttributeName="UserID" isAdmin={true} />;
};

export default AdminUsersPage;
