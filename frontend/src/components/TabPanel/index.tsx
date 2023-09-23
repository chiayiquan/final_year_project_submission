import React from "react";
import Box from "@mui/material/Box";

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
  style?: React.CSSProperties;
  className?: string;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, style, className } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={style}
      className={className}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default TabPanel;
