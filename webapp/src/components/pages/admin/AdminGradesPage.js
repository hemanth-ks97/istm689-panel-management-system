import React, { useState, useEffect } from "react";

import { Select, MenuItem, Typography, List } from "@mui/material";

import { httpClient } from "../../../client";
import { useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";

import ListDisplay from "../../widgets/ListDisplay";
import LoadingSpinner from "../../widgets/LoadingSpinner";

const AdminGradesPage = () => {
  const { user } = useSelector((state) => state.user);
  const [panelFilter, setPanelFilter] = useState("");
  const [metrics, setMetrics] = useState([]);
  // const [userFilter, setUserFilter] = useState("");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };

  const [panelFilterOptions, setPanelFilterOptions] = useState([
    { name: "None", value: "None" },
  ]);

  useEffect(() => {
    // all users

    httpClient
      .get("/panel", { headers })
      .then((response) => {
        const panels = response.data;

        const options = panels.map((panel) => {
          return {
            name: `${panel.PanelName} by ${panel.Panelist} - ${panel.PanelPresentationDate}`,
            value: panel.PanelID,
          };
        });
        options.unshift({ name: "None", value: "None" });

        setPanelFilterOptions(options);
      })
      .catch((error) => {
        setPanelFilterOptions(["None"]);
      });

    // Append or replcae?
  }, []);

  useEffect(() => {
    // Prevent calling the API with empty ID
    if (panelFilter === "None") return;

    httpClient
      .get(`/panel/${panelFilter}/metrics`, { headers })
      .then((response) => {
        setMetrics(response.data);
      })
      .catch((error) => {
        setMetrics([]);
      });
  }, [panelFilter]);

  const handlePanelFilterChange = (e) => {
    setPanelFilter(e.target.value);
  };

  const prepareList = () => {
    const dataKeys = Object.keys(metrics[0]);
    dataKeys.sort();

    // Render all columns...
    const columns = dataKeys.map((column) => {
      return { field: column, headerName: column, width: 200 };
    });

    return (
      <DataGrid
        rows={metrics}
        columns={columns}
        getRowId={(row) => `${row.PanelID}-${row.UserID}`}
      />
    );
  };

  return (
    <>
      <br />
      <br />
      <Typography>Select a Panel</Typography>
      <Select
        fullWidth
        labelId="demo-simple-select-standard-label"
        id="demo-simple-select-standard"
        value={panelFilter}
        onChange={handlePanelFilterChange}
        label="Panel"
      >
        {panelFilterOptions.map((option) => (
          <MenuItem value={option.value}>
            <em>{option.name}</em>
          </MenuItem>
        ))}
      </Select>

      <Typography>Metrics</Typography>
      {metrics.length === 0 && <Typography>No metrics fetched</Typography>}
      {metrics.length > 0 && prepareList()}
    </>
  );
};

export default AdminGradesPage;
