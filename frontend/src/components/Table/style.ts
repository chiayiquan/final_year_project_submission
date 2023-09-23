import { styled } from "@mui/material/styles";
import { TableCell, tableCellClasses } from "@mui/material";

const TableHeaderCell = styled(TableCell)((theme) => ({
  [`&.${tableCellClasses.head}`]: {
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#e5e7eb",
  },
}));

export { TableHeaderCell };
