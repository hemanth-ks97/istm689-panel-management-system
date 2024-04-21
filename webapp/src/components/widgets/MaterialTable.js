import React, { useState } from "react";

import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";

import EditDialog from "../forms/EditDialog";

const MaterialTable = ({ data, columns, type }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const table = useMaterialReactTable({
    columns,
    data,
    initialState: { density: "compact" },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        setSelectedData(row.original);
        setIsDialogOpen(true);
      },
      sx: {
        cursor: "pointer",
      },
    }),
  });

  console.log(selectedData);
  return (
    <>
      <MaterialReactTable table={table} />
      {selectedData && (
        <EditDialog
          isOpen={isDialogOpen}
          setIsOpen={() => setIsDialogOpen(!isDialogOpen)}
          selectedData={selectedData}
          type={type}
        />
      )}
    </>
  );
};

export default MaterialTable;
