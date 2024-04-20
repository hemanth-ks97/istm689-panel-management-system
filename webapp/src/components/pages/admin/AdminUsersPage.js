import React, { useState, useEffect } from "react";

import { httpClient } from "../../../client";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { ButtonGroup, Button } from "@mui/material";

import LoadingSpinner from "../../widgets/LoadingSpinner";
import NewUserForm from "../../forms/NewUserForm";

import MaterialTable from "../../widgets/MaterialTable";

import { DATABASE_ATTRIBUTE_MAPPING } from "../../../config/constants";

const AdminUsersPage = () => {
  const { user } = useSelector((state) => state.user);
  const [selectedAction, setSelectedAction] = useState("list");
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
    return <LoadingSpinner fullScren />;
  }

  const columns = Object.keys(DATABASE_ATTRIBUTE_MAPPING.User).map((key) => {
    return {
      accessorKey: key,
      header: DATABASE_ATTRIBUTE_MAPPING.User[key].displayName,
      size: 200,
    };
  });

  return (
    <>
      <br />
      <br />

      <ButtonGroup>
        <Button onClick={() => setSelectedAction("list")}>
          List all users
        </Button>
        <Button onClick={() => setSelectedAction("create")}>
          Add new user
        </Button>
      </ButtonGroup>
      {selectedAction === "create" && <NewUserForm />}
      {selectedAction === "list" && (
        <MaterialTable data={users} columns={columns} type={"User"} />
      )}
    </>
  );
};

export default AdminUsersPage;
