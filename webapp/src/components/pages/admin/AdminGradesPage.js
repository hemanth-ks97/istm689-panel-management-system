import React, { useState, useEffect } from "react";

import { Select, MenuItem, Typography } from "@mui/material";

import { httpClient } from "../../../client";
import { useSelector } from "react-redux";

import LoadingSpinner from "../../widgets/LoadingSpinner";

import MetricList from "../../widgets/MetricList";

const AdminGradesPage = () => {
  const { user } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [panelFilter, setPanelFilter] = useState("");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.token}`,
  };
  const [panelFilterOptions, setPanelFilterOptions] = useState([
    { name: "None", value: "None" },
  ]);

  useEffect(() => {
    setIsLoading(true);
    httpClient
      .get("/panel", { headers })
      .then((response) => {
        const panels = response.data;

        const options = panels.map((panel) => {
          return {
            name: `${panel.PanelName} by ${panel.Panelist} - ${panel.PanelPresentationDate}`,
            value: panel.PanelID,
            key: panel.PanelID,
          };
        });
        options.unshift({ name: "None", value: "None" });

        setPanelFilterOptions(options);
      })
      .catch((error) => {
        setPanelFilterOptions(["None"]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handlePanelFilterChange = (e) => {
    setPanelFilter(e.target.value);
  };

  if (isLoading) {
    return <LoadingSpinner fullScren />;
  }

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
          <MenuItem key={option.value} value={option.value}>
            <em>{option.name}</em>
          </MenuItem>
        ))}
      </Select>

      <Typography>Metrics</Typography>
      {panelFilter && (
        <MetricList
          key={panelFilter}
          panelId={panelFilter}
          panelName={
            panelFilterOptions.find((ele) => ele.value == panelFilter).name
          }
        />
      )}
    </>
  );
};

export default AdminGradesPage;
