import React, { useState } from "react";

import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";

import FormDialog from "../forms/FormDialog";

const MaterialTable = ({ data, columns }) => {
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

  return (
    <>
      <MaterialReactTable table={table} />;
      {selectedData && (
        <FormDialog
          isOpen={isDialogOpen}
          setIsOpen={() => setIsDialogOpen(!isDialogOpen)}
          selectedData={selectedData}
        />
      )}
    </>
  );
};

export default MaterialTable;
