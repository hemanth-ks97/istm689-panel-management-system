import React, { useState, useEffect } from "react";

import { httpClient } from "../../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import LoadingSpinner from "../../widgets/LoadingSpinner";

import MaterialTable from "../../widgets/MaterialTable";
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

  const columns = [
    {
      accessorKey: "UserID",
      header: "ID",
      size: 200,
    },
    { accessorKey: "EmailID", header: "Email", size: 200 },
    { accessorKey: "FName", header: "First Name", size: 200 },
    { accessorKey: "LName", header: "Last Name", size: 200 },
    { accessorKey: "UIN", header: "UIN", size: 200 },
    { accessorKey: "Role", header: "Role", size: 200 },
    { accessorKey: "CanvasID", header: "Canvas ID", size: 200 },
    { accessorKey: "Section", header: "Section", size: 200 },
    { accessorKey: "CreatedAt", header: "CreatedAt", size: 200 },
  ];

  return <MaterialTable data={users} columns={columns} />;
};

export default AdminUsersPage;
